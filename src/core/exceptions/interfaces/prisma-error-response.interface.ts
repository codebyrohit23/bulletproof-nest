import type { HttpStatus } from '@nestjs/common';

export interface PrismaErrorResponse {
  readonly statusCode: HttpStatus;

  readonly message: string;
}
