import { Injectable, SetMetadata } from '@nestjs/common';

export const JOB_HANDLER_METADATA = 'leadflow:job-handler';

/**
 * Marks a class as the handler for one job name.
 *
 * Applies `@Injectable()` too, so a handler is a single decorator rather than
 * two that must both be remembered — forgetting the second would make it
 * invisible to dependency injection and fail confusingly at boot.
 *
 * The registry discovers these at startup, so adding a job never means editing
 * a central list.
 */
export function JobHandler(jobName: string): ClassDecorator {
  return (target) => {
    Injectable()(target);
    SetMetadata(JOB_HANDLER_METADATA, jobName)(target);
  };
}
