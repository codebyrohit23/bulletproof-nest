import { Module } from '@nestjs/common';

import { MessageRecorder } from '#/core/communication/index.js';

import { OutboundMessageRepository } from './repositories/index.js';
import { OutboundMessageService } from './services/outbound-message.service.js';

/**
 * Owns what the platform has sent: `outbound_messages` today, delivery events,
 * suppressions and the admin read APIs later.
 *
 * Only `MessageRecorder` escapes. Callers send through `EmailService` and the
 * record follows from that; a module that could reach `OutboundMessageService`
 * directly could write a record for a message nobody sent, which is worse than
 * no record at all.
 *
 * Imported by `EmailModule.forRoot` in `AppModule` — the one place entitled to
 * know both that `core` needs a recorder and that this module is one.
 */
@Module({
  providers: [
    OutboundMessageRepository,
    OutboundMessageService,
    { provide: MessageRecorder, useExisting: OutboundMessageService },
  ],
  exports: [MessageRecorder],
})
export class CommunicationModule {}
