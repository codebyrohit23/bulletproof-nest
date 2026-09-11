import { z } from 'zod';

import { EMAIL_DRIVER } from '#/config/email/index.js';

import { EMAIL_TRANSPORT_ERROR_CODE, type EmailTransportErrorCode } from '../constants/index.js';
import { EmailTransportError } from '../errors/index.js';
import type { EmailAddress, EmailAttachment, OutboundEmail } from '../interfaces/index.js';

import { RESEND_ERROR_NAME } from './resend.constants.js';
import type { ResendAttachment, ResendErrorBody, ResendSendEmailRequest } from './resend.types.js';

const sendEmailResponseSchema = z.object({
  id: z.string().min(1),
});

export function toResendRequest(email: OutboundEmail): ResendSendEmailRequest {
  return {
    from: formatAddress(email.from),

    to: email.to.map(formatAddress),

    subject: email.subject,

    html: email.html,

    text: email.text,

    ...(email.replyTo !== undefined ? { reply_to: formatAddress(email.replyTo) } : {}),

    ...(email.headers !== undefined ? { headers: email.headers } : {}),

    ...(email.attachments !== undefined
      ? { attachments: email.attachments.map(toResendAttachment) }
      : {}),
  };
}

export function readMessageId(body: unknown): string {
  const parsed = sendEmailResponseSchema.safeParse(body);

  if (!parsed.success) {
    throw new EmailTransportError(
      EMAIL_TRANSPORT_ERROR_CODE.UNKNOWN,
      EMAIL_DRIVER.RESEND,
      'Resend accepted the message but returned no id.',
    );
  }

  return parsed.data.id;
}

export function toTransportError(status: number, body: unknown): EmailTransportError {
  const errorBody = asErrorBody(body);

  return new EmailTransportError(
    toErrorCode(status, errorBody),
    EMAIL_DRIVER.RESEND,
    errorBody.message ?? `Resend responded with status ${String(status)}.`,
  );
}

export function toNetworkTransportError(error: unknown): EmailTransportError {
  const timedOut = error instanceof Error && error.name === 'TimeoutError';

  return new EmailTransportError(
    timedOut ? EMAIL_TRANSPORT_ERROR_CODE.TIMEOUT : EMAIL_TRANSPORT_ERROR_CODE.PROVIDER_UNAVAILABLE,
    EMAIL_DRIVER.RESEND,
    timedOut ? 'Resend did not respond in time.' : 'Resend could not be reached.',
    { cause: error },
  );
}

function toErrorCode(status: number, body: ResendErrorBody): EmailTransportErrorCode {
  if (status === 401 || status === 403) {
    return EMAIL_TRANSPORT_ERROR_CODE.AUTHENTICATION_FAILED;
  }

  if (status === 408) {
    return EMAIL_TRANSPORT_ERROR_CODE.TIMEOUT;
  }

  if (status === 429) {
    return EMAIL_TRANSPORT_ERROR_CODE.RATE_LIMITED;
  }

  if (status >= 500) {
    return EMAIL_TRANSPORT_ERROR_CODE.PROVIDER_UNAVAILABLE;
  }

  if (status >= 400) {
    if (body.name === RESEND_ERROR_NAME.INVALID_FROM_ADDRESS) {
      return EMAIL_TRANSPORT_ERROR_CODE.INVALID_SENDER;
    }

    if (body.name === RESEND_ERROR_NAME.INVALID_TO_ADDRESS) {
      return EMAIL_TRANSPORT_ERROR_CODE.INVALID_RECIPIENT;
    }

    return EMAIL_TRANSPORT_ERROR_CODE.MESSAGE_REJECTED;
  }

  return EMAIL_TRANSPORT_ERROR_CODE.UNKNOWN;
}

function asErrorBody(body: unknown): ResendErrorBody {
  return typeof body === 'object' && body !== null ? body : {};
}

function toResendAttachment(attachment: EmailAttachment): ResendAttachment {
  return {
    filename: attachment.filename,

    content: attachment.content.toString('base64'),

    ...(attachment.contentType !== undefined ? { content_type: attachment.contentType } : {}),
  };
}

function formatAddress(address: EmailAddress): string {
  if (address.name === undefined) {
    return address.address;
  }

  const escaped = address.name.replace(/["\\]/gu, '\\$&');

  return `"${escaped}" <${address.address}>`;
}
