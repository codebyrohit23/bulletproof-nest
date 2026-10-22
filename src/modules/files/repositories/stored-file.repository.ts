import { Injectable } from '@nestjs/common';
import { FileStatus, type FileRejectReason } from '@prisma/client';

import { PrismaService } from '#/infrastructure/database/prisma/index.js';

import { PURGE_FILE_SELECT } from '../constants/purge-file-select.constants.js';
import { STORED_FILE_SELECT } from '../constants/stored-file-select.constants.js';
import type {
  CreateStoredFileInput,
  FileUploader,
  MarkReadyInput,
  PurgeFile,
  SaveVariantInput,
  StoredFileSnapshot,
} from '../interfaces/index.js';
import { toPurgeFile, toStoredFileSnapshot } from '../mappers/index.js';
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
  /**
   * Never an expired file: the purge may already be deleting its objects, and
   * attaching it would leave an owner pointing at nothing.
   */
  async attach(id: string, now: Date): Promise<boolean> {
    const { count } = await this.prisma.db.storedFile.updateMany({
      where: {
        id,
        attachedAt: null,
        expiresAt: { gt: now },
        status: { in: [FileStatus.UPLOADED, FileStatus.READY] },
      },
      data: { attachedAt: now, expiresAt: null },
    });

    return count === 1;
  }

  /** Oldest first, so a backlog drains in the order it built up. */
  async findExpiredUnattached(now: Date, limit: number): Promise<PurgeFile[]> {
    const rows = await this.prisma.db.storedFile.findMany({
      where: { attachedAt: null, expiresAt: { lt: now } },
      select: PURGE_FILE_SELECT,
      orderBy: { expiresAt: 'asc' },
      take: limit,
    });

    return rows.map(toPurgeFile);
  }

  /** Naming `deletedAt` keeps the soft-delete extension from filtering these out. */
  async findReleasedBefore(cutoff: Date, limit: number): Promise<PurgeFile[]> {
    const rows = await this.prisma.db.storedFile.findMany({
      where: { deletedAt: { lt: cutoff } },
      select: PURGE_FILE_SELECT,
      orderBy: { deletedAt: 'asc' },
      take: limit,
    });

    return rows.map(toPurgeFile);
  }

  /**
   * Deletes those of `ids` still unattached and expired, and returns which.
   * The condition is checked again rather than trusted from the read, and the
   * ids returned are the only ones whose usage is given back — so two runs
   * that pick up the same rows cannot give it back twice.
   */
  async deleteExpiredUnattached(ids: readonly string[], now: Date): Promise<string[]> {
    const rows = await this.prisma.db.$queryRaw<{ id: string }[]>`
      DELETE FROM "files"
      WHERE "id" = ANY(${[...ids]}::uuid[])
        AND "attached_at" IS NULL
        AND "expires_at" < ${now}
      RETURNING "id"`;

    return rows.map((row) => row.id);
  }

  /** As `deleteExpiredUnattached`, for files released before `cutoff`. */
  async deleteReleased(ids: readonly string[], cutoff: Date): Promise<string[]> {
    const rows = await this.prisma.db.$queryRaw<{ id: string }[]>`
      DELETE FROM "files"
      WHERE "id" = ANY(${[...ids]}::uuid[])
        AND "deleted_at" < ${cutoff}
      RETURNING "id"`;

    return rows.map((row) => row.id);
  }

  /** A soft delete. Storage is purged after the grace period, by the purge. */
  async release(id: string, now: Date): Promise<void> {
    await this.prisma.db.storedFile.updateMany({
      where: { id },
      data: { deletedAt: now },
    });
  }
}
