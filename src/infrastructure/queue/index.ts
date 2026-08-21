/**
 * Background jobs, on BullMQ.
 *
 * Owns: queue definitions, dispatch, worker lifecycle, context propagation
 * across the process boundary, and the handler registry.
 *
 * Does NOT own: Redis connections (`infrastructure/redis`), or what any
 * individual job does — that belongs to the module that owns the work.
 *
 * ---------------------------------------------------------------------------
 * HOW A MODULE ADDS A JOB — three small files, no platform change
 * ---------------------------------------------------------------------------
 *     modules/users/jobs/welcome-email.job.ts
 *       export const USER_WELCOME_EMAIL = 'user.welcome-email';
 *       export interface WelcomeEmailPayload { userId: string }
 *
 *     modules/users/jobs/user.producer.ts
 *       @Injectable()
 *       export class UserJobProducer {
 *         constructor(private readonly jobs: JobDispatcher) {}
 *         sendWelcomeEmail(userId: string) {
 *           return this.jobs.dispatch(QUEUE.MAIL, USER_WELCOME_EMAIL, { userId }, {
 *             jobId: `welcome:${userId}`,
 *           });
 *         }
 *       }
 *
 *     modules/users/jobs/welcome-email.handler.ts
 *       @JobHandler(USER_WELCOME_EMAIL)
 *       export class WelcomeEmailHandler implements JobHandler<WelcomeEmailPayload> {
 *         async handle({ userId }: WelcomeEmailPayload) { ... }
 *       }
 *
 * Register the handler and producer in the module's `providers`. Nothing here
 * changes — the registry discovers the handler at boot.
 *
 * ---------------------------------------------------------------------------
 * TWO RULES THAT ARE NOT OPTIONAL
 * ---------------------------------------------------------------------------
 * **Handlers must be idempotent.** Delivery is at-least-once by design: a
 * process killed mid-job, a stalled worker, or a retry all re-run it. Send the
 * email, *then* record it; on the next attempt, check the record first.
 *
 * **Payloads carry ids, not documents.** A payload is a snapshot taken at
 * dispatch; by the time it runs the row may have changed. Passing `{ userId }`
 * and re-reading is correct. Passing `{ user }` means acting on stale data —
 * and it bloats every job in Redis.
 *
 * ---------------------------------------------------------------------------
 * PLANNED — deliberately not built yet
 * ---------------------------------------------------------------------------
 *   worker.ts + worker.module.ts       WHEN the API gets slow under job load
 *     A second process running only `QueueWorkerModule`, with no HTTP layer.
 *     Until then one process does both, which is correct for a single service.
 *
 *   failed_jobs table + modules/job-admin   WITH the first real jobs
 *     BullMQ's failed set already retains payload, error and stack, and Bull
 *     Board can retry from it. A Postgres record adds what Redis cannot: it is
 *     queryable ("every failed import for this org last week"), durable beyond
 *     eviction, and joinable for a tenant-scoped support view.
 *
 *   Bull Board                          WITH auth
 *     Mounts in a few lines and gives list, inspect, retry and delete for free.
 *     It exposes every payload, so it must sit behind authentication first.
 *
 *   repeatable jobs (cron)              WITH the first scheduled task
 *     BullMQ handles these natively. On more than one process they also need
 *     the Redis lock in `infrastructure/redis` so the tick runs once.
 */

export { QueueModule } from './queue.module.js';

export { QueueWorkerModule } from './queue-worker.module.js';

export { JobDispatcher } from './services/job-dispatcher.service.js';

export { JobHandler } from './decorators/job-handler.decorator.js';

export { QUEUE, QUEUE_NAMES, type QueueName } from './constants/queue.constants.js';

export type {
  DispatchOptions,
  JobHandler as JobHandlerContract,
  JobMeta,
} from './interfaces/index.js';
