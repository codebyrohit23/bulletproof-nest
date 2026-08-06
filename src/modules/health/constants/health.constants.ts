/**
 * This module's Swagger group.
 *
 * The name lives with the module that owns it, never hard-coded in a
 * controller decorator and never invented in a central list. Only the *order*
 * of tags is decided centrally, in `bootstrap/swagger/swagger.constants.ts`.
 */
export const HEALTH_API_TAG = {
  name: 'Health',
  description: 'Liveness and readiness probes. Not part of the versioned API.',
} as const;
