import type { MessageFailure, MessageReceipt, RecordMessageInput } from '../interfaces/index.js';

export abstract class MessageRecorder {
  abstract record(input: RecordMessageInput): Promise<string>;

  abstract markSent(id: string, receipt: MessageReceipt): Promise<void>;

  abstract markFailed(id: string, failure: MessageFailure): Promise<void>;
}
