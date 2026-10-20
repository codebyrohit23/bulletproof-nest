import { Injectable } from '@nestjs/common';
import { FileStatus, type FileRejectReason } from '@prisma/client';

import { PrismaService } from '#/infrastructure/database/prisma/index.js';

import { STORED_FILE_SELECT } from '../constants/stored-file-select.constants.js';
import type {
  CreateStoredFileInput,
  FileUploader,
  MarkReadyInput,
  SaveVariantInput,
  StoredFileSnapshot,
} from '../interfaces/index.js';
import { toStoredFileSnapshot } from '../mappers/index.js';
import { uploaderWhere } from '../utils/index.js';

@Injectable()
export class StoredFileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateStoredFileInput): Promise<StoredFileSnapshot> {
    const row = await this.prisma.db.storedFile.create({
      data: input,
      select: STORED_FILE_SELECT,
    });

    return toStoredFileSnapshot(row);
  }

  /** The uploader's own file in that scope, or `null` — never anyone else's. */
  async findOwn(id: string, uploader: FileUploader): Promise<StoredFileSnapshot | null> {
    const row = await this.prisma.db.storedFile.findFirst({
      where: { id, ...uploaderWhere(uploader) },
      select: STORED_FILE_SELECT,
    });

    return row === null ? null : toStoredFileSnapshot(row);
  }

  /** Any file, whoever uploaded it — for jobs, never for a route. */
  async findById(id: string): Promise<StoredFileSnapshot | null> {
    const row = await this.prisma.db.storedFile.findUnique({
      where: { id },
      select: STORED_FILE_SELECT,
    });

    return row === null ? null : toStoredFileSnapshot(row);
  }

  async findManyByIds(ids: readonly string[]): Promise<StoredFileSnapshot[]> {
    if (ids.length === 0) {
      return [];
    }

    const rows = await this.prisma.db.storedFile.findMany({
      where: { id: { in: [...ids] } },
      select: STORED_FILE_SELECT,
    });

    return rows.map(toStoredFileSnapshot);
  }

  /**
   * Uploads the uploader could still attach. A rejected file is not one, and
   * one past its expiry is the purge's, whether or not it has run.
   */
  countUnattached(uploader: FileUploader, now: Date): Promise<number> {
    return this.prisma.db.storedFile.count({
      where: {
        ...uploaderWhere(uploader),
        attachedAt: null,
        status: { not: FileStatus.REJECTED },
        expiresAt: { gt: now },
      },
    });
  }

  async markUploaded(id: string, now: Date): Promise<boolean> {
    const { count } = await this.prisma.db.storedFile.updateMany({
      where: { id, status: FileStatus.PENDING },
      data: { status: FileStatus.UPLOADED, uploadedAt: now },
    });

    return count === 1;
  }

  async markReady(id: string, input: MarkReadyInput, now: Date): Promise<boolean> {
    const { count } = await this.prisma.db.storedFile.updateMany({
      where: { id, status: FileStatus.UPLOADED },
      data: { status: FileStatus.READY, processedAt: now, ...input },
    });

    return count === 1;
  }

  /** Upserted, so a job that runs twice writes one row, not two. */
  async saveVariant(fileId: string, input: SaveVariantInput): Promise<void> {
    await this.prisma.db.storedFileVariant.upsert({
      where: { fileId_kind: { fileId, kind: input.kind } },
      create: { fileId, ...input },
      update: input,
    });
  }

  async markRejected(id: string, reason: FileRejectReason): Promise<boolean> {
    const { count } = await this.prisma.db.storedFile.updateMany({
      where: { id, status: { in: [FileStatus.PENDING, FileStatus.UPLOADED] } },
      data: { status: FileStatus.REJECTED, rejectReason: reason },
    });

    return count === 1;
  }

  /** Claims the file for an owner. Clearing `expires_at` is what saves it from the purge. */
  async attach(id: string, now: Date): Promise<boolean> {
    const { count } = await this.prisma.db.storedFile.updateMany({
      where: {
        id,
        attachedAt: null,
        status: { in: [FileStatus.UPLOADED, FileStatus.READY] },
      },
      data: { attachedAt: now, expiresAt: null },
    });

    return count === 1;
  }

  /** A soft delete. Storage is purged after the grace period, by the purge. */
  async release(id: string, now: Date): Promise<void> {
    await this.prisma.db.storedFile.updateMany({
      where: { id },
      data: { deletedAt: now },
    });
  }
}
