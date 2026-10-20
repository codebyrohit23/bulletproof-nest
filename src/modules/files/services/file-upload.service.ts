import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { FileRejectReason, FileStatus } from '@prisma/client';
import { uuidv7 } from 'uuidv7';

import { TransactionService } from '#/infrastructure/database/prisma/index.js';
import { JobDispatcher, QUEUE } from '#/infrastructure/queue/index.js';
import { ObjectStorageService, STORAGE_BUCKET } from '#/infrastructure/storage/index.js';

import {
  FILE_ERROR_MESSAGE,
  FILE_JOB,
  FILE_PURPOSE_POLICY,
  FILE_SCOPE,
  MAX_UNATTACHED_UPLOADS,
  UNATTACHED_FILE_TTL_MS,
  WORKSPACE_STORAGE_QUOTA_BYTES,
} from '../constants/index.js';
import type { FileView, StartUploadInput, StartedUpload } from '../dto/index.js';
import type { FileUploader, ProcessFilePayload, StoredFileSnapshot } from '../interfaces/index.js';
import { StorageUsageRepository, StoredFileRepository } from '../repositories/index.js';
import {
  describeBytes,
  describeContentTypes,
  processFileJobId,
  storedObjectKey,
  uploadObjectKey,
  uploaderColumns,
} from '../utils/index.js';

import { FileViewService } from './file-view.service.js';

@Injectable()
export class FileUploadService {
  constructor(
    private readonly files: StoredFileRepository,

    private readonly usage: StorageUsageRepository,

    private readonly storage: ObjectStorageService,

    private readonly views: FileViewService,

    private readonly transaction: TransactionService,

    private readonly jobs: JobDispatcher,
  ) {}

  /**
   * Checks what the client claims against the purpose, records a `PENDING`
   * row and returns where to send the bytes.
   *
   * The quota check here is advisory — it saves an upload that cannot fit —
   * and `complete` checks again atomically, since two uploads may each pass it.
   */
  async start(uploader: FileUploader, input: StartUploadInput): Promise<StartedUpload> {
    const policy = FILE_PURPOSE_POLICY[input.purpose];

    if (policy.scope !== uploader.scope) {
      throw new UnprocessableEntityException(FILE_ERROR_MESSAGE.PURPOSE_NOT_ALLOWED);
    }

    if (!(policy.contentTypes as readonly string[]).includes(input.contentType)) {
      throw new UnprocessableEntityException(
        FILE_ERROR_MESSAGE.TYPE_NOT_ALLOWED(describeContentTypes(policy.contentTypes)),
      );
    }

    if (input.sizeBytes > policy.maxBytes) {
      throw new UnprocessableEntityException(
        FILE_ERROR_MESSAGE.TOO_LARGE(describeBytes(policy.maxBytes)),
      );
    }

    const now = new Date();

    if ((await this.files.countUnattached(uploader, now)) >= MAX_UNATTACHED_UPLOADS) {
      throw new ConflictException(FILE_ERROR_MESSAGE.TOO_MANY_UNATTACHED);
    }

    if (uploader.scope === FILE_SCOPE.WORKSPACE) {
      const used = await this.usage.usedBytes(uploader.workspaceId);

      if (used + input.sizeBytes > WORKSPACE_STORAGE_QUOTA_BYTES) {
        throw new ForbiddenException(FILE_ERROR_MESSAGE.QUOTA_EXCEEDED);
      }
    }

    const id = uuidv7();

    const file = await this.files.create({
      id,
      ...uploaderColumns(uploader),
      purpose: input.purpose,
      visibility: policy.visibility,
      objectKey: storedObjectKey(uploader, input.purpose, id),
      originalName: input.fileName,
      declaredMimeType: input.contentType,
      sizeBytes: input.sizeBytes,
      expiresAt: new Date(now.getTime() + UNATTACHED_FILE_TTL_MS),
    });

    const upload = await this.storage.presignUpload({
      bucket: STORAGE_BUCKET.PRIVATE,
      key: uploadObjectKey(file),
      contentType: file.declaredMimeType,
    });

    return {
      file: await this.views.toView(file),
      upload: { ...upload, expiresAt: upload.expiresAt.toISOString() },
    };
  }

  /**
   * Confirms the object arrived at the declared size. Safe to repeat: a file
   * already confirmed is returned as it stands.
   *
   * A size mismatch rejects the file for good rather than asking for another
   * try on the same row — the declared size is what the quota was checked
   * against, and the client can start over with the truth.
   */
  async complete(uploader: FileUploader, id: string): Promise<FileView> {
    const file = await this.findOwnOrThrow(uploader, id);

    if (file.status === FileStatus.UPLOADED || file.status === FileStatus.READY) {
      return this.views.toView(file);
    }

    if (file.status === FileStatus.REJECTED) {
      throw new ConflictException(FILE_ERROR_MESSAGE.REJECTED);
    }

    const now = new Date();

    if (file.expiresAt !== null && file.expiresAt <= now) {
      throw new NotFoundException(FILE_ERROR_MESSAGE.NOT_FOUND);
    }

    const key = uploadObjectKey(file);
    const stored = await this.storage.head(STORAGE_BUCKET.PRIVATE, key);

    if (stored === null) {
      throw new ConflictException(FILE_ERROR_MESSAGE.NOT_UPLOADED);
    }

    if (stored.sizeBytes !== file.sizeBytes) {
      await this.files.markRejected(file.id, FileRejectReason.SIZE_MISMATCH);

      // The row is already rejected, so a failure here leaves only an object
      // the purge removes with the row.
      await this.storage.deleteMany(STORAGE_BUCKET.PRIVATE, [key]);

      throw new UnprocessableEntityException(FILE_ERROR_MESSAGE.SIZE_MISMATCH);
    }

    await this.transaction.run(async () => {
      if (!(await this.files.markUploaded(file.id, now))) {
        // Another `complete` won the race; the read below answers with its result.
        return;
      }

      if (
        uploader.scope === FILE_SCOPE.WORKSPACE &&
        !(await this.usage.addWithinQuota(
          uploader.workspaceId,
          file.sizeBytes,
          WORKSPACE_STORAGE_QUOTA_BYTES,
        ))
      ) {
        // Throwing rolls `markUploaded` back: the file stays `PENDING`, and
        // expires unless room is made and `complete` is called again.
        throw new ForbiddenException(FILE_ERROR_MESSAGE.QUOTA_EXCEEDED);
      }

      // Written to the outbox in this transaction: if the file is `UPLOADED`,
      // processing will run.
      await this.jobs.dispatch<ProcessFilePayload>(
        QUEUE.MEDIA,
        FILE_JOB.PROCESS,
        { fileId: file.id },
        { jobId: processFileJobId(file.id) },
      );
    });

    return this.views.toView(await this.findOwnOrThrow(uploader, id));
  }

  async get(uploader: FileUploader, id: string): Promise<FileView> {
    return this.views.toView(await this.findOwnOrThrow(uploader, id));
  }

  private async findOwnOrThrow(uploader: FileUploader, id: string): Promise<StoredFileSnapshot> {
    const file = await this.files.findOwn(id, uploader);

    if (file === null) {
      throw new NotFoundException(FILE_ERROR_MESSAGE.NOT_FOUND);
    }

    return file;
  }
}
