import type { ExceptionDetails } from './exception-details.interface.js';

export interface ErrorResponseBuilderOptions {
  readonly path: string;

  readonly exception: ExceptionDetails;
}
