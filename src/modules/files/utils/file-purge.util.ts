import { FileVisibility } from '@prisma/client';

import { STORAGE_BUCKET, type StorageBucket } from '#/infrastructure/storage/index.js';

import type { PurgeFile, ReleasedUsage, StorageObjectRef } from '../interfaces/index.js';

import { incomingObjectKey, storedBucket } from './object-key.util.js';

/**
 * Every object a file may have left in storage. Some may not exist — a file
 * that was never uploaded has none — and deleting a missing key is not an
 * error, so they are listed rather than looked up first.
 */
export function objectKeysOf(file: PurgeFile): StorageObjectRef[] {
  const bucket = storedBucket(file.visibility);

  const refs: StorageObjectRef[] = [
    { bucket, key: file.objectKey },
    ...file.variants.map((variant) => ({ bucket, key: variant.objectKey })),
  ];

  // A public file is uploaded to `incoming/` and moved on processing; one
  // purged before it was processed is still there.
  if (file.visibility === FileVisibility.PUBLIC) {
    refs.push({ bucket: STORAGE_BUCKET.PRIVATE, key: incomingObjectKey(file.id) });
  }

  return refs;
}

/** The keys, one list per bucket — `DeleteObjects` works on one bucket at a time. */
export function groupByBucket(refs: readonly StorageObjectRef[]): Map<StorageBucket, string[]> {
  const groups = new Map<StorageBucket, string[]>();

  for (const ref of refs) {
    const keys = groups.get(ref.bucket) ?? [];

    keys.push(ref.key);
    groups.set(ref.bucket, keys);
  }

  return groups;
}

/**
 * How much of a workspace's usage this file still holds, to give back when it
 * goes. Usage is added on `complete` — so a file never completed holds none,
 * nor does one outside a workspace — and corrected to the stored copy and its
 * variants once processed, which is what `sizeBytes` and the variants now say.
 */
export function countedBytes(file: PurgeFile): number {
  if (file.workspaceId === null || file.uploadedAt === null) {
    return 0;
  }

  return file.variants.reduce((total, variant) => total + variant.sizeBytes, file.sizeBytes);
}

/**
 * The usage to give back for the files that were deleted — only those whose
 * id is in `deletedIds`, so a file another run already removed gives back
 * nothing here.
 */
export function releasedUsage(
  files: readonly PurgeFile[],
  deletedIds: ReadonlySet<string>,
): ReleasedUsage {
  const bytesByWorkspace = new Map<string, number>();
  let bytes = 0;

  for (const file of files) {
    const counted = deletedIds.has(file.id) ? countedBytes(file) : 0;

    if (file.workspaceId === null || counted === 0) {
      continue;
    }

    bytes += counted;
    bytesByWorkspace.set(file.workspaceId, (bytesByWorkspace.get(file.workspaceId) ?? 0) + counted);
  }

  return { bytes, bytesByWorkspace };
}
