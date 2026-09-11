import { Injectable } from '@nestjs/common';

import { EmailConfigService } from '#/config/email/index.js';

import { RESEND_ENDPOINT, RESEND_HEADER } from './resend.constants.js';
import { toNetworkTransportError } from './resend.mapper.js';
import type { ResendHttpResult, ResendSendEmailRequest } from './resend.types.js';
import { readResponseBody } from './resend.utils.js';

@Injectable()
export class ResendClient {
  constructor(private readonly config: EmailConfigService) {}

  async sendEmail(
    request: ResendSendEmailRequest,
    idempotencyKey: string,
  ): Promise<ResendHttpResult> {
    const url = new URL(RESEND_ENDPOINT.EMAILS, this.config.resend.baseUrl);

    let response: Response;

    try {
      response = await fetch(url, {
        method: 'POST',

        headers: {
          authorization: `Bearer ${this.config.resend.apiKey}`,
          'content-type': 'application/json',

          /*
           * Makes a repeat of the same message a no-op at Resend. The queue
           * retries on timeout, and without this a request that was accepted
           * after the client stopped listening sends the mail twice.
           */
          [RESEND_HEADER.IDEMPOTENCY_KEY]: idempotencyKey,
        },

        body: JSON.stringify(request),

        /*
         * Aborts the body read as well as the connection, so a provider that
         * accepts and then stalls cannot hold a mail worker open indefinitely.
         */
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch (error) {
      throw toNetworkTransportError(error);
    }

    return { status: response.status, body: await readResponseBody(response) };
  }
}
