import { IdentifierType, VerificationPurpose } from '@prisma/client';

/**
 * Which kind of proof a code is asking for, decided by the identifier itself.
 *
 * There is no separate "registration" purpose. Registering and later proving an
 * address you added are the same act — a code sent to a mailbox, answered from
 * that mailbox — and giving them two names bought nothing while costing
 * something real: `user_verification_codes_active_key` is unique per identity
 * *and purpose*, so two names meant two codes could be live for one address at
 * once, both valid, and a user reading their inbox had no way to tell which was
 * which.
 *
 * Derived rather than passed in, because every caller would otherwise have to
 * remember the mapping, and the one that got it wrong would issue a code the
 * lookup could never find — an endpoint that sends mail and then rejects every
 * answer to it.
 *
 * `LOGIN` and `PASSWORD_RESET` are not reachable from here on purpose. Those are
 * chosen by the flow, not by the identifier: an email address can carry any of
 * the three, and only the caller knows which question it is asking.
 */
export function verificationPurposeFor(identifierType: IdentifierType): VerificationPurpose {
  return identifierType === IdentifierType.EMAIL
    ? VerificationPurpose.EMAIL_VERIFICATION
    : VerificationPurpose.PHONE_VERIFICATION;
}
