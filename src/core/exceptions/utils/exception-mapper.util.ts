// import { HttpException, HttpStatus } from '@nestjs/common';

// import { ERROR_CODE, ERROR_MESSAGE } from '../constants/exception.constants.js';
// import type { ExceptionDetails } from '../interfaces/exception-details.interface.js';

// /**
//  * Converts any exception into
//  * a standardized ExceptionDetails object.
//  */
// export abstract class ExceptionMapper {
//   static map(exception: unknown): ExceptionDetails {
//     if (exception instanceof HttpException) {
//       return this.mapHttpException(exception);
//     }

//     return this.mapUnknownException(exception);
//   }

//   /**
//    * NestJS HttpException
//    */
//   private static mapHttpException(exception: HttpException): ExceptionDetails {
//     const status = exception.getStatus();

//     const response = exception.getResponse();

//     let message = ERROR_MESSAGE.INTERNAL_SERVER_ERROR;

//     if (typeof response === 'string') {
//       message = response;
//     }

//     if (typeof response === 'object' && response !== null && 'message' in response) {
//       const value = response.message;

//       if (typeof value === 'string') {
//         message = value;
//       }

//       if (Array.isArray(value) && value.length > 0) {
//         message = value[0];
//       }
//     }

//     return {
//       statusCode: status,

//       message,

//       error: {
//         code: this.mapStatusCode(status),
//         name: exception.name,
//         stack: exception.stack,
//         details: response,
//       },
//     };
//   }

//   /**
//    * Unknown exception.
//    */
//   private static mapUnknownException(exception: unknown): ExceptionDetails {
//     const error = exception instanceof Error ? exception : new Error(String(exception));

//     return {
//       statusCode: HttpStatus.INTERNAL_SERVER_ERROR,

//       message: ERROR_MESSAGE.INTERNAL_SERVER_ERROR,

//       error: {
//         code: ERROR_CODE.INTERNAL_SERVER_ERROR,

//         name: error.name,

//         details: error.message,

//         stack: error.stack,
//       },
//     };
//   }

//   /**
//    * Maps HTTP status to application code.
//    */
//   private static mapStatusCode(status: number) {
//     switch (status) {
//       case HttpStatus.BAD_REQUEST:
//         return ERROR_CODE.BAD_REQUEST;

//       case HttpStatus.UNAUTHORIZED:
//         return ERROR_CODE.UNAUTHORIZED;

//       case HttpStatus.FORBIDDEN:
//         return ERROR_CODE.FORBIDDEN;

//       case HttpStatus.NOT_FOUND:
//         return ERROR_CODE.NOT_FOUND;

//       case HttpStatus.CONFLICT:
//         return ERROR_CODE.CONFLICT;

//       case HttpStatus.UNPROCESSABLE_ENTITY:
//         return ERROR_CODE.UNPROCESSABLE_ENTITY;

//       case HttpStatus.TOO_MANY_REQUESTS:
//         return ERROR_CODE.TOO_MANY_REQUESTS;

//       case HttpStatus.SERVICE_UNAVAILABLE:
//         return ERROR_CODE.SERVICE_UNAVAILABLE;

//       case HttpStatus.GATEWAY_TIMEOUT:
//         return ERROR_CODE.GATEWAY_TIMEOUT;

//       default:
//         return ERROR_CODE.INTERNAL_SERVER_ERROR;
//     }
//   }
// }
