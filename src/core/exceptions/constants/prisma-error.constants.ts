import { HttpStatus } from '@nestjs/common';

import type { PrismaErrorResponse } from '../interfaces/index.js';

import { EXCEPTION_MESSAGE } from './exception.constants.js';

export const PRISMA_ERROR_RESPONSES: Readonly<Record<string, PrismaErrorResponse>> = {
  P2002: {
    statusCode: HttpStatus.CONFLICT,
    message: 'A record with the same unique value already exists.',
  },

  P2003: {
    statusCode: HttpStatus.CONFLICT,
    message: 'A referenced record does not exist.',
  },

  P2014: {
    statusCode: HttpStatus.CONFLICT,
    message: 'This change would break a required link to another record.',
  },

  P2001: {
    statusCode: HttpStatus.NOT_FOUND,
    message: EXCEPTION_MESSAGE.NOT_FOUND,
  },

  P2025: {
    statusCode: HttpStatus.NOT_FOUND,
    message: EXCEPTION_MESSAGE.NOT_FOUND,
  },

  /** Connection pool exhausted — our capacity, not the caller's timing. */
  P2024: {
    statusCode: HttpStatus.SERVICE_UNAVAILABLE,
    message: EXCEPTION_MESSAGE.SERVICE_UNAVAILABLE,
  },
};

export const UNMAPPED_PRISMA_ERROR_RESPONSE: PrismaErrorResponse = {
  statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  message: EXCEPTION_MESSAGE.INTERNAL_SERVER_ERROR,
};
