import type { UserSessionValidationResult } from '../interfaces/index.js';

export abstract class UserSessionValidator {
  abstract validate(sessionId: string, deviceId: string): Promise<UserSessionValidationResult>;
}
