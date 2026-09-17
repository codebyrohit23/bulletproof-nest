export { MessageRecorder } from './ports/message-recorder.port.js';

export {
  MESSAGE_CATEGORY,
  MESSAGE_CHANNEL,
  type MessageCategory,
  type MessageChannel,
} from './constants/index.js';

export type {
  MessageFailure,
  MessageReceipt,
  MessageRecipient,
  RecordMessageInput,
} from './interfaces/index.js';
