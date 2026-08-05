/**
 * Health endpoints.
 *
 *   GET /health        readiness — the conventional default, for uptime monitors
 *   GET /health/live   liveness  — process only, checks nothing external
 *   GET /health/ready  readiness — Postgres + Redis
 *
 * ---------------------------------------------------------------------------
 * THE RULE THAT MATTERS
 * ---------------------------------------------------------------------------
 * **Liveness must never check a dependency.** A failing liveness probe means
 * "restart this container", and restarting cannot fix an unreachable database.
 * Wire Postgres into liveness and a brief database blip restarts every replica
 * simultaneously — turning a recoverable hiccup into a full outage.
 *
 * Readiness is the opposite: it means "stop sending me traffic", the instance
 * keeps running, and it rejoins the pool by itself once its dependencies
 * recover.
 *
 * ---------------------------------------------------------------------------
 * WHY THERE ARE NO INDICATORS HERE
 * ---------------------------------------------------------------------------
 * Each infrastructure module owns its own probe — only it knows what healthy
 * means for its connection, and only it can bound the check correctly. This
 * module decides which probes constitute readiness and nothing more.
 *
 * Adding a dependency later means writing an indicator in *that* module and
 * adding one line to the controller.
 *
 * Responses use `@RawResponse()`. Probes and uptime monitors expect Terminus's
 * shape verbatim; wrapping it in the API envelope would break standard tooling
 * for no benefit.
 *
 * ---------------------------------------------------------------------------
 * PLANNED — deliberately not built yet
 * ---------------------------------------------------------------------------
 *   queue depth indicator          WITH real job volume
 *     A growing backlog is a monitoring signal, not a readiness one — an
 *     instance with a deep queue is still perfectly able to serve HTTP. It
 *     belongs on a dashboard and an alert, not on this endpoint.
 *
 *   /health/startup                WITH slow migrations on boot
 *     Kubernetes startup probes exist so a slow first boot is not mistaken for
 *     a liveness failure. Only needed once boot time is genuinely long.
 */

export { HealthModule } from './health.module.js';

export type { LivenessResult } from './interfaces/index.js';
