import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { EmailDriver } from './email.constants.js';
import type { EmailConfig, EmailSenderConfig, ResendConfig } from './email.interface.js';

@Injectable()
export class EmailConfigService {
  private readonly email: EmailConfig;

  constructor(config: ConfigService) {
    this.email = config.getOrThrow<EmailConfig>('email');
  }

  get driver(): EmailDriver {
    return this.email.driver;
  }

  get timeoutMs(): number {
    return this.email.timeoutMs;
  }

  get from(): EmailSenderConfig {
    return this.email.from;
  }

  get replyTo(): string | undefined {
    return this.email.replyTo;
  }

  get testRedirectTo(): string | undefined {
    return this.email.testRedirectTo;
  }

  get resend(): ResendConfig {
    return this.email.resend;
  }
}
