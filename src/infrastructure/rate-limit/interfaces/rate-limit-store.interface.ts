export interface RateLimitWindow {
  readonly allowed: boolean;

  readonly remaining: number;

  readonly resetInMs: number;
}

export abstract class RateLimitStore {
  abstract consume(key: string, limit: number, windowMs: number): Promise<RateLimitWindow>;
  abstract peek(key: string, limit: number, windowMs: number): Promise<RateLimitWindow>;
  abstract refund(key: string, limit: number, windowMs: number): Promise<void>;
}
