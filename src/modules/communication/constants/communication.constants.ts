import { MessageCategory, MessageChannel, MessageStatus } from '@prisma/client';

import {
  MESSAGE_CATEGORY,
  MESSAGE_CHANNEL,
  type MessageCategory as CoreMessageCategory,
  type MessageChannel as CoreMessageChannel,
} from '#/core/communication/index.js';

export const COMMUNICATION_LOG_CONTEXT = 'Communication';

export const MESSAGE_CHANNEL_COLUMN = {
  [MESSAGE_CHANNEL.EMAIL]: MessageChannel.EMAIL,
  [MESSAGE_CHANNEL.SMS]: MessageChannel.SMS,
} as const satisfies Record<CoreMessageChannel, MessageChannel>;

export const MESSAGE_CATEGORY_COLUMN = {
  [MESSAGE_CATEGORY.TRANSACTIONAL]: MessageCategory.TRANSACTIONAL,
  [MESSAGE_CATEGORY.MARKETING]: MessageCategory.MARKETING,
} as const satisfies Record<CoreMessageCategory, MessageCategory>;

export const MESSAGE_STATUS_RANK = {
  [MessageStatus.QUEUED]: 0,
  [MessageStatus.SUPPRESSED]: 1,
  [MessageStatus.EXPIRED]: 1,
  [MessageStatus.FAILED]: 1,
  [MessageStatus.SENT]: 2,
  [MessageStatus.DELIVERED]: 3,
  [MessageStatus.BOUNCED]: 4,
  [MessageStatus.COMPLAINED]: 5,
} as const satisfies Record<MessageStatus, number>;

export const MESSAGE_ERROR_MESSAGE_MAX_LENGTH = 1000;

export const MESSAGE_ERROR_CODE_MAX_LENGTH = 100;
