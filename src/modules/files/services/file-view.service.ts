import { Injectable } from '@nestjs/common';
import { FileStatus, FileVisibility } from '@prisma/client';

import { ObjectStorageService } from '#/infrastructure/storage/index.js';

import type { AttachedImage, FileView } from '../dto/index.js';
import type { ServedObject, StoredFileSnapshot } from '../interfaces/index.js';
import { findThumbnail } from '../utils/index.js';

@Injectable()
export class FileViewService {
  constructor(private readonly storage: ObjectStorageService) {}

  async toView(file: StoredFileSnapshot): Promise<FileView> {
    const ready = file.status === FileStatus.READY;
    const original = ready ? await this.serve(file, file.objectKey) : null;
    const thumbnail = ready ? findThumbnail(file) : undefined;

    return {
      id: file.id,
      purpose: file.purpose,
      status: file.status,
      rejectReason: file.rejectReason,
      name: file.originalName,
      contentType: file.detectedMimeType ?? file.declaredMimeType,
      sizeBytes: file.sizeBytes,
      width: file.width,
      height: file.height,
      durationMs: file.durationMs,
      url: original?.url ?? null,
      urlExpiresAt: original?.expiresAt?.toISOString() ?? null,
      thumbnail:
        thumbnail === undefined
          ? null
          : {
              url: (await this.serve(file, thumbnail.objectKey)).url,
              width: thumbnail.width,
              height: thumbnail.height,
            },
      attachedAt: file.attachedAt?.toISOString() ?? null,
      expiresAt: file.expiresAt?.toISOString() ?? null,
      createdAt: file.createdAt.toISOString(),
    };
  }

  toAttachedImage(file: StoredFileSnapshot): AttachedImage | null {
    if (file.status !== FileStatus.READY || file.visibility !== FileVisibility.PUBLIC) {
      return null;
    }

    const thumbnail = findThumbnail(file);

    return {
      url: this.storage.publicUrl(file.objectKey),
      thumbnailUrl: thumbnail === undefined ? null : this.storage.publicUrl(thumbnail.objectKey),
    };
  }

  private async serve(file: StoredFileSnapshot, key: string): Promise<ServedObject> {
    if (file.visibility === FileVisibility.PUBLIC) {
      return { url: this.storage.publicUrl(key), expiresAt: null };
    }

    const signed = await this.storage.presignDownload({
      key,
      disposition: 'attachment',
      fileName: file.originalName,
    });

    return { url: signed.url, expiresAt: signed.expiresAt };
  }
}
