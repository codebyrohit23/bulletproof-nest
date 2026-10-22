import type { FileVisibility } from '@prisma/client';

import type { StorageBucket } from '#/infrastructure/storage/index.js';

/** A file the purge is about to remove, with what it needs to remove it. */
export interface PurgeFile {
  readonly id: string;

  readonly visibility: FileVisibility;

  readonly objectKey: string;

  readonly workspaceId: string | null;

  /** Set once `complete` succeeded — the point from which usage counted it. */
  readonly uploadedAt: Date | null;

  readonly sizeBytes: number;

  readonly variants: readonly PurgeFileVariant[];
}

export interface PurgeFileVariant {
  readonly objectKey: string;

  readonly sizeBytes: number;
}

/** One object in storage. */
export interface StorageObjectRef {
  readonly bucket: StorageBucket;

  readonly key: string;
}

/** The usage deleted files held, in total and per workspace. */
export interface ReleasedUsage {
  readonly bytes: number;

  readonly bytesByWorkspace: ReadonlyMap<string, number>;
}

/** What one batch removed. */
export interface PurgeResult {
  readonly files: number;

  readonly bytes: number;
}

export interface PurgeRunSummary extends PurgeResult {
  readonly batches: number;

  readonly reachedLimit: boolean;

  readonly stalled: boolean;
}
