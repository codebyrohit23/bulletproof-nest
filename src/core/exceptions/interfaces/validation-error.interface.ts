export interface ValidationError {
  readonly field: string;

  readonly message: string;

  readonly code?: string;
}
