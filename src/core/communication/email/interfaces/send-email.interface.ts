import type { MessageCategory } from '../../constants/index.js';
import type { MessageRecipient } from '../../interfaces/index.js';
import type { EmailTemplateId } from '../constants/index.js';

/**
 * What a caller hands to `EmailService.send`, minus the template itself.
 *
 * The template is a separate argument so TypeScript can infer it first and then
 * check `data` against that template's schema. Folded into this object, the two
 * would be inferred together and a mismatched payload would slip through.
 *
 * There is no `from`: the sender is resolved from configuration, and later from
 * the workspace. A caller that could choose its own sender could send from a
 * domain this service has no right to use.
 */
export interface SendEmailInput<TData> {
  /**
   * Plain addresses, not `{ address, name }`.
   *
   * Transactional mail addresses a person the system already knows, and a
   * display name on the recipient changes nothing about where it lands — so
   * requiring an object would be ceremony at every call site for a field
   * nobody fills in.
   */
  readonly to: string | readonly string[];

  readonly data: TData;

  /**
   * Deduplicates the send end to end: it becomes the BullMQ job id, so a
   * repeated dispatch is dropped before it is queued, and the provider's
   * idempotency key, so a retried request after a timeout is dropped there too.
   *
   * Must be derived from what the message is about — `otp:<codeId>` — never
   * from a timestamp or a random value, which would make every attempt unique
   * and defeat both checks.
   */
  readonly idempotencyKey: string;

  /** Overrides the configured reply address for this one message. */
  readonly replyTo?: string;

  /**
   * Who the message is for in this system's terms, so support can answer "was
   * anything sent to this account" without matching on an address someone has
   * since changed. Left out when the caller has no account to point at.
   */
  readonly recipientRef?: MessageRecipient;

  /** Defaults to transactional. Campaigns say so explicitly. */
  readonly category?: MessageCategory;
}

/**
 * What a `SendEmailInput` becomes once it crosses the queue boundary.
 *
 * Carries the template id and its raw data, never rendered HTML. Two reasons:
 * the Redis payload stays small — a rendered email is tens of kilobytes — and a
 * template fix reaches jobs that were queued before it was deployed.
 *
 * `data` is `unknown` on purpose. It has been through `JSON.stringify` and back,
 * so nothing about its shape is guaranteed any more; the worker re-validates it
 * against the template's own schema before rendering. Typing it as anything
 * narrower here would be a claim this side cannot back up.
 */
export interface EmailDeliveryPayload {
  readonly template: EmailTemplateId;

  /** The `outbound_messages` row to report the outcome against. */
  readonly messageId: string;

  readonly to: readonly string[];

  readonly data: unknown;

  readonly idempotencyKey: string;

  readonly replyTo?: string;
}
