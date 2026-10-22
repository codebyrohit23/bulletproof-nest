const DAY_MS = 24 * 60 * 60 * 1000;

/** Cron patterns, in UTC. */
export const FILE_SCHEDULE = {
  /** Five past the hour, clear of whatever else runs on the hour. */
  PURGE_UNATTACHED: '5 * * * *',

  /** 21:30 UTC — 03:00 in India, when traffic is lowest. */
  PURGE_DELETED: '30 21 * * *',
} as const;

export const FILE_PURGE = {
  /** One query and a couple of storage calls per batch; a short transaction. */
  BATCH_SIZE: 500,

  /**
   * At most 10 000 files a run, so one run never holds the queue for long. A
   * larger backlog clears over the next runs.
   */
  MAX_BATCHES_PER_RUN: 20,

  /**
   * How long a replaced or removed file is kept before storage is purged —
   * time to restore one removed by mistake, since storage keeps no versions.
   */
  RELEASED_FILE_GRACE_MS: 30 * DAY_MS,
} as const;
