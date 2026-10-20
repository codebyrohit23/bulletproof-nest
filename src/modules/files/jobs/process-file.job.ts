import { FileRejectReason, FileStatus, FileVariantKind, FileVisibility } from '@prisma/client';

import { TransactionService } from '#/infrastructure/database/prisma/index.js';
import { JobHandler, type JobHandlerContract, type JobMeta } from '#/infrastructure/queue/index.js';
import { ObjectStorageService, STORAGE_BUCKET } from '#/infrastructure/storage/index.js';

import {
  CONTENT_SNIFF_BYTES,
  FILE_JOB,
  FILE_PURPOSE_POLICY,
  PUBLIC_OBJECT_CACHE_CONTROL,
} from '../constants/index.js';
import { FileRejectedError } from '../errors/index.js';
import type { ProcessFilePayload, StoredFileSnapshot } from '../interfaces/index.js';
import { StorageUsageRepository, StoredFileRepository } from '../repositories/index.js';
import {
  detectContentType,
  processImage,
  readToBuffer,
  storedBucket,
  thumbnailObjectKey,
  uploadObjectKey,
} from '../utils/index.js';

const WEBP = 'image/webp';

@JobHandler(FILE_JOB.PROCESS)
export class ProcessFileJob implements JobHandlerContract<ProcessFilePayload> {
  constructor(
    private readonly files: StoredFileRepository,

    private readonly usage: StorageUsageRepository,

    private readonly storage: ObjectStorageService,

    private readonly transaction: TransactionService,
  ) {}

  async handle(payload: ProcessFilePayload, meta: JobMeta): Promise<void> {
    const file = await this.files.findById(payload.fileId);

    if (file?.status !== FileStatus.UPLOADED) {
      return;
    }

    try {
      await this.process(file);
    } catch (error) {
      if (error instanceof FileRejectedError) {
        await this.reject(file, error.reason);

        return;
      }

      if (meta.attempt >= meta.maxAttempts) {
        await this.reject(file, FileRejectReason.UNREADABLE);
      }

      throw error;
    }
  }

  private async process(file: StoredFileSnapshot): Promise<void> {
    const policy = FILE_PURPOSE_POLICY[file.purpose];
    const uploadKey = uploadObjectKey(file);

    const upload = await readToBuffer(
      await this.storage.openStream(STORAGE_BUCKET.PRIVATE, uploadKey),
      policy.maxBytes,
    );

    const detected = await detectContentType(upload.subarray(0, CONTENT_SNIFF_BYTES));

    if (detected === null || !(policy.contentTypes as readonly string[]).includes(detected)) {
      throw new FileRejectedError(
        FileRejectReason.TYPE_NOT_ALLOWED,
        `Content is ${detected ?? 'unrecognised'}, which ${file.purpose} does not allow.`,
      );
    }

    const { image, thumbnail } = await processImage(upload, policy.image);

    const bucket = storedBucket(file.visibility);
    const thumbnailKey = thumbnailObjectKey(file.objectKey);
    const cacheControl =
      file.visibility === FileVisibility.PUBLIC ? PUBLIC_OBJECT_CACHE_CONTROL : undefined;

    await Promise.all([
      this.storage.put({
        bucket,
        key: file.objectKey,
        body: image.data,
        contentType: WEBP,
        ...(cacheControl !== undefined ? { cacheControl } : {}),
      }),
      this.storage.put({
        bucket,
        key: thumbnailKey,
        body: thumbnail.data,
        contentType: WEBP,
        ...(cacheControl !== undefined ? { cacheControl } : {}),
      }),
    ]);

    await this.transaction.run(async () => {
      const marked = await this.files.markReady(
        file.id,
        {
          detectedMimeType: WEBP,
          width: image.width,
          height: image.height,
          sizeBytes: image.data.length,
        },
        new Date(),
      );

      if (!marked) {
        return;
      }

      await this.files.saveVariant(file.id, {
        kind: FileVariantKind.THUMBNAIL,
        objectKey: thumbnailKey,
        mimeType: WEBP,
        width: thumbnail.width,
        height: thumbnail.height,
        sizeBytes: thumbnail.data.length,
      });

      // Usage counted the upload; the upload is about to go and these remain.
      if (file.workspaceId !== null) {
        await this.usage.adjust(
          file.workspaceId,
          image.data.length + thumbnail.data.length - file.sizeBytes,
        );
      }

      // A public upload sat in `incoming/` only to be processed. Its copy is now
      // stored, so it goes — after commit, and if this fails the bucket's
      // lifecycle rule takes it.
      if (uploadKey !== file.objectKey) {
        await this.transaction.runAfterCommit(() =>
          this.storage.deleteMany(STORAGE_BUCKET.PRIVATE, [uploadKey]),
        );
      }
    });
  }

  /**
   * The upload is deleted; the row stays `REJECTED` so the client polling it
   * learns why, and the purge removes the row. Usage is not touched here: the
   * purge subtracts what the row still counts.
   */
  private async reject(file: StoredFileSnapshot, reason: FileRejectReason): Promise<void> {
    await this.files.markRejected(file.id, reason);
    await this.storage.deleteMany(STORAGE_BUCKET.PRIVATE, [uploadObjectKey(file)]);
  }
}
