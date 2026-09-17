import { MessageCategory, MessageChannel, MessageStatus } from '@prisma/client';

import {
  MESSAGE_CATEGORY,
  MESSAGE_CHANNEL,
  type MessageCategory as CoreMessageCategory,
  type MessageChannel as CoreMessageChannel,
} from '#/core/communication/index.js';

export const COMMUNICATION_LOG_CONTEXT = 'Communication';

/**
 * `core` names a channel, this table stores one. The `satisfies` is the point:
 * adding a channel to the port without a column value for it fails the build.
 */
export const MESSAGE_CHANNEL_COLUMN = {
  [MESSAGE_CHANNEL.EMAIL]: MessageChannel.EMAIL,
  [MESSAGE_CHANNEL.SMS]: MessageChannel.SMS,
} as const satisfies Record<CoreMessageChannel, MessageChannel>;

export const MESSAGE_CATEGORY_COLUMN = {
  [MESSAGE_CATEGORY.TRANSACTIONAL]: MessageCategory.TRANSACTIONAL,
  [MESSAGE_CATEGORY.MARKETING]: MessageCategory.MARKETING,
} as const satisfies Record<CoreMessageCategory, MessageCategory>;

/**
 * How far along the delivery a status is. A write only lands on a row whose
 * status ranks lower, so an update never walks the lifecycle backwards.
 *
 * Providers deliver webhooks out of order — a `delivered` callback regularly
 * arrives before the `sent` one — and without this the later, staler message
 * would win. The three that rank below `SENT` are the ways a message ends
 * before anything is handed to a provider.
 */
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

/** Provider messages can run to kilobytes; the column holds 1000. */
export const MESSAGE_ERROR_MESSAGE_MAX_LENGTH = 1000;

export const MESSAGE_ERROR_CODE_MAX_LENGTH = 100;
