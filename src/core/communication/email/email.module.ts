import { type DynamicModule, Module } from '@nestjs/common';

import { EmailTransportModule } from '#/infrastructure/communication/email/index.js';

import type { EmailModuleOptions } from './interfaces/index.js';
import { EmailDeliveryJob } from './jobs/email-delivery.job.js';
import { EmailService } from './services/email.service.js';

@Module({})
export class EmailModule {
  static forRoot(options: EmailModuleOptions): DynamicModule {
    return {
      module: EmailModule,
      global: true,
      imports: [EmailTransportModule, ...options.imports],
      providers: [EmailService, EmailDeliveryJob],
      exports: [EmailService],
    };
  }
}
