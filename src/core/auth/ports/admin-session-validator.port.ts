import type { AdminSessionValidationResult } from '../interfaces/index.js';

export abstract class AdminSessionValidator {
  abstract validate(sessionId: string, deviceId: string): Promise<AdminSessionValidationResult>;
}
