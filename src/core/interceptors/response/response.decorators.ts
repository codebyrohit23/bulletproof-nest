import { SetMetadata } from '@nestjs/common';

import { RAW_RESPONSE_KEY, RESPONSE_MESSAGE_KEY } from './response.constants.js';

/**
 * Sets the `message` field for a handler.
 *
 * Without it the envelope falls back to a status-derived default, which is
 * fine for most reads. Use it where the message is part of the product copy:
 * `@ResponseMessage('Invitation sent.')`
 */
export const ResponseMessage = (message: string): MethodDecorator => SetMetadata(RESPONSE_MESSAGE_KEY, message);

/**
 * Opts a handler out of the envelope entirely.
 *
 * Required for anything whose body is not ours to shape:
 * - file downloads and streams
 * - webhook acknowledgements a third party expects verbatim (Stripe, Meta)
 * - redirects and empty `204` responses
 *
 * Wrapping those breaks the consumer, so this is not a convenience — it is the
 * escape hatch that makes a global interceptor safe to apply everywhere else.
 */
export const RawResponse = (): MethodDecorator => SetMetadata(RAW_RESPONSE_KEY, true);
