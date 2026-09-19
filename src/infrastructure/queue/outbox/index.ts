export { OutboxRepository } from './repositories/index.js';

export { OutboxRelay } from './services/outbox-relay.service.js';

export { OutboxHealthIndicator } from './indicators/outbox-health.indicator.js';

export {
  OUTBOX_HEALTH_KEY,
  OUTBOX_LAST_ERROR_MAX_LENGTH,
  OUTBOX_LOG_CONTEXT,
  OUTBOX_RELAY,
  OUTBOX_RETENTION,
} from './constants/index.js';

export type { ClaimedOutboxEntry, NewOutboxEntry, OutboxBacklog } from './interfaces/index.js';
