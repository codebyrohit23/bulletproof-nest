import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { FileStatus } from '@prisma/client';

import { FILE_ERROR_MESSAGE } from '../constants/index.js';
import type { AttachedImage } from '../dto/index.js';
import type { AttachFileInput } from '../interfaces/index.js';
import { StoredFileRepository } from '../repositories/index.js';

import { FileViewService } from './file-view.service.js';

@Injectable()
export class FilesService {
  constructor(
    private readonly files: StoredFileRepository,

    private readonly views: FileViewService,
  ) {}

  async attach(fileId: string, input: AttachFileInput): Promise<void> {
    const file = await this.files.findOwn(fileId, input.uploader);
    const now = new Date();

    // An expired upload is answered as a missing one, as `complete` does: the
    // purge may be removing it.
    if (file === null || (file.expiresAt !== null && file.expiresAt <= now)) {
      throw new NotFoundException(FILE_ERROR_MESSAGE.NOT_FOUND);
    }

    if (file.purpose !== input.purpose) {
      throw new UnprocessableEntityException(FILE_ERROR_MESSAGE.PURPOSE_MISMATCH);
    }

    if (file.attachedAt !== null) {
      throw new ConflictException(FILE_ERROR_MESSAGE.ALREADY_ATTACHED);
    }

    if (file.status !== FileStatus.UPLOADED && file.status !== FileStatus.READY) {
      throw new ConflictException(FILE_ERROR_MESSAGE.NOT_ATTACHABLE);
    }

    if (!(await this.files.attach(file.id, now))) {
      throw new ConflictException(FILE_ERROR_MESSAGE.ALREADY_ATTACHED);
    }
  }

  async release(fileId: string): Promise<void> {
    await this.files.release(fileId, new Date());
  }

  async attachedImages(
    fileIds: readonly (string | null)[],
  ): Promise<ReadonlyMap<string, AttachedImage | null>> {
    const ids = [...new Set(fileIds.filter((id): id is string => id !== null))];
    const files = await this.files.findManyByIds(ids);

    const images = new Map<string, AttachedImage | null>(ids.map((id) => [id, null]));

    for (const file of files) {
      images.set(file.id, this.views.toAttachedImage(file));
    }

    return images;
  }

  /** One owner's image — `null` when there is none or it is still processing. */
  async attachedImage(fileId: string | null): Promise<AttachedImage | null> {
    if (fileId === null) {
      return null;
    }

    return (await this.attachedImages([fileId])).get(fileId) ?? null;
  }
}
