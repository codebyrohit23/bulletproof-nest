// import type { ValidationError } from '../interfaces/validation-error.interface.js';

// /**
//  * Utility methods for creating validation errors.
//  */
// export abstract class ValidationErrorUtil {
//   static create(field: string, message: string, code?: string): ValidationError {
//     return {
//       field,
//       message,
//       ...(code && { code }),
//     };
//   }

//   static createMany(errors: readonly ValidationError[]): readonly ValidationError[] {
//     return [...errors];
//   }
// }
