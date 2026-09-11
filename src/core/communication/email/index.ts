export { EmailModule } from './email.module.js';

export { EmailService } from './services/email.service.js';

export { EMAIL_TEMPLATE, type EmailTemplateId } from './constants/index.js';

export {
  EmailTemplateError,
  InvalidTemplateDataError,
  UnknownEmailTemplateError,
} from './errors/index.js';
