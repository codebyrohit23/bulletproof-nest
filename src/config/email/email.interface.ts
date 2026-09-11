import type { EmailDriver } from './email.constants.js';

export interface EmailConfig {
  readonly driver: EmailDriver;

  readonly timeoutMs: number;

  readonly from: EmailSenderConfig;

  readonly replyTo?: string;

  readonly testRedirectTo?: string;

  readonly resend: ResendConfig;
}

export interface EmailSenderConfig {
  readonly address: string;

  readonly name: string;
}

export interface ResendConfig {
  readonly apiKey: string;

  readonly baseUrl: string;

  readonly webhookSecret?: string;
}
