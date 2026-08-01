export interface ErrorPayload {
  name: string;

  message: string;

  stack?: string;

  code?: string | number;

  cause?: unknown;
}
