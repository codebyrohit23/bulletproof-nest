import { Module } from '@nestjs/common';

import { MessageRecorder } from '#/core/communication/index.js';

import { OutboundMessageRepository } from './repositories/index.js';
import { OutboundMessageService } from './services/outbound-message.service.js';

@Module({
  providers: [
    OutboundMessageRepository,
    OutboundMessageService,
    { provide: MessageRecorder, useExisting: OutboundMessageService },
  ],
  exports: [MessageRecorder],
})
export class CommunicationModule {}
