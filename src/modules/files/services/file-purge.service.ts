import { Injectable } from '@nestjs/common';

import { TransactionService } from '#/infrastructure/database/prisma/index.js';
import { ObjectStorageService } from '#/infrastructure/storage/index.js';

import { FILE_PURGE } from '../constants/index.js';
import type { PurgeFile, PurgeResult, PurgeRunSummary } from '../interfaces/index.js';
import { StorageUsageRepository, StoredFileRepository } from '../repositories/index.js';
import { groupByBucket, objectKeysOf, releasedUsage } from '../utils/index.js';

@Injectable()
export class FilePurgeService {
  constructor(
    private readonly files: StoredFileRepository,

    private readonly usage: StorageUsageRepository,

    private readonly storage: ObjectStorageService,

    private readonly transaction: TransactionService,
  ) {}

  /** Uploads never attached, expired by `now`. */
  purgeAllExpiredUnattached(now: Date): Promise<PurgeRunSummary> {
    return this.drain(
      (limit) => this.files.findExpiredUnattached(now, limit),
      (files) => this.purge(files, (ids) => this.files.deleteExpiredUnattached(ids, now)),
    );
  }

  /** Files replaced or removed longer ago than the grace period. */
  purgeAllReleased(now: Date): Promise<PurgeRunSummary> {
    const cutoff = new Date(now.getTime() - FILE_PURGE.RELEASED_FILE_GRACE_MS);

    return this.drain(
      (limit) => this.files.findReleasedBefore(cutoff, limit),
      (files) => this.purge(files, (ids) => this.files.deleteReleased(ids, cutoff)),
    );
  }

  /**
   * Batch after batch until none is due, the batch limit is reached, or a
   * batch deletes nothing. The caller fixes `now` once, so a run's scope is
   * set when it starts: files that fall due during it wait for the next.
   *
   * A batch that deletes none of its rows would be read again unchanged, so it
   * ends the run instead of spending the remaining batches on the same rows.
   */
  private async drain(
    find: (limit: number) => Promise<PurgeFile[]>,
    purgeBatch: (files: readonly PurgeFile[]) => Promise<PurgeResult>,
  ): Promise<PurgeRunSummary> {
    let files = 0;
    let bytes = 0;
    let batches = 0;

    while (batches < FILE_PURGE.MAX_BATCHES_PER_RUN) {
      const batch = await find(FILE_PURGE.BATCH_SIZE);

      if (batch.length === 0) {
        return { files, bytes, batches, reachedLimit: false, stalled: false };
      }

      const result = await purgeBatch(batch);

      batches += 1;
      files += result.files;
      bytes += result.bytes;

      if (result.files === 0) {
        return { files, bytes, batches, reachedLimit: false, stalled: true };
      }

      if (batch.length < FILE_PURGE.BATCH_SIZE) {
        return { files, bytes, batches, reachedLimit: false, stalled: false };
      }
    }

    return { files, bytes, batches, reachedLimit: true, stalled: false };
  }

  private async purge(
    files: readonly PurgeFile[],
    deleteRows: (ids: readonly string[]) => Promise<string[]>,
  ): Promise<PurgeResult> {
    for (const [bucket, keys] of groupByBucket(files.flatMap(objectKeysOf))) {
      await this.storage.deleteMany(bucket, keys);
    }

    return this.transaction.run(async () => {
      // Only the rows this run deleted give back usage, so two runs that read
      // the same files cannot give it back twice.
      const deleted = new Set(await deleteRows(files.map((file) => file.id)));
      const usage = releasedUsage(files, deleted);

      await this.usage.subtract(usage.bytesByWorkspace);

      return { files: deleted.size, bytes: usage.bytes };
    });
  }
}
