import type { SessionValidationResult } from '../interfaces/index.js';

export abstract class SessionValidator {
  abstract validate(sessionId: string, deviceId: string): Promise<SessionValidationResult>;
}
