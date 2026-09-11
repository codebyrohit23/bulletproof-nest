import type { AppConfigService } from '#/config/app/index.js';
import { EMAIL_DRIVER, type EmailConfigService } from '#/config/email/index.js';
import type { AppLoggerService } from '#/core/logger/index.js';

import { EMAIL_TRANSPORT_LOG_CONTEXT } from '../constants/index.js';
import { RedirectRecipientTransport } from '../decorators/redirect-recipient.transport.js';
import type { EmailTransport } from '../interfaces/index.js';
import { LogEmailAdapter } from '../log/log-email.adapter.js';
import { ResendEmailAdapter } from '../resend/resend-email.adapter.js';
import type { ResendClient } from '../resend/resend.client.js';

export function createEmailTransport(
  config: EmailConfigService,
  app: AppConfigService,
  resend: ResendClient,
  logger: AppLoggerService,
): EmailTransport {
  return applyTestRedirect(selectAdapter(config, resend, logger), config, app, logger);
}

function selectAdapter(
  config: EmailConfigService,
  resend: ResendClient,
  logger: AppLoggerService,
): EmailTransport {
  switch (config.driver) {
    case EMAIL_DRIVER.RESEND:
      return new ResendEmailAdapter(resend, logger);

    case EMAIL_DRIVER.LOG:
      return new LogEmailAdapter(logger);
    default: {
      const unsupported: never = config.driver;

      throw new Error(`No email transport is bound for driver "${String(unsupported)}".`);
    }
  }
}

function applyTestRedirect(
  transport: EmailTransport,
  config: EmailConfigService,
  app: AppConfigService,
  logger: AppLoggerService,
): EmailTransport {
  const { testRedirectTo } = config;

  if (testRedirectTo === undefined) {
    return transport;
  }

  if (app.isProduction) {
    throw new Error('EMAIL_TEST_REDIRECT_TO must not be set in production.');
  }

  logger.warn(`Email redirect active — every message goes to ${testRedirectTo}`, {
    context: EMAIL_TRANSPORT_LOG_CONTEXT,
    operation: 'applyTestRedirect',
    metadata: { testRedirectTo, driver: config.driver },
  });

  return new RedirectRecipientTransport(transport, { address: testRedirectTo }, logger);
}
