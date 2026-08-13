/**
 * How stale `lastActiveAt` may become before it is written again.
 *
 * Recording activity on every authenticated request would make this the
 * busiest write in the system — one row update per user per page load — and
 * fill the table with dead tuples for a column nothing reads in real time.
 *
 * Five minutes is precise enough for "last seen" and turns thousands of writes
 * per user per day into a handful. A constant rather than configuration: it is
 * a storage trade-off with no operational reason to differ between
 * environments.
 */
export const LAST_ACTIVE_THROTTLE_MS = 5 * 60 * 1000;

export const USER_AUTH_LOG_CONTEXT = 'UserAuth';
