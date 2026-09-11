export { EmailTransportModule } from './email-transport.module.js';

export { EmailTransport } from './interfaces/index.js';

export type {
  EmailAddress,
  EmailAttachment,
  EmailReceipt,
  OutboundEmail,
} from './interfaces/index.js';

export { EmailTransportError } from './errors/index.js';

export { EMAIL_TRANSPORT_ERROR_CODE, type EmailTransportErrorCode } from './constants/index.js';
