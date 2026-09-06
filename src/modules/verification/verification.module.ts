import { Module } from '@nestjs/common';

import { VerificationCodeRepository } from './repositories/index.js';
import { VerificationCodeService } from './services/verification-code.service.js';

/**
 * Proof of possession of an identifier, for whoever needs to ask for it.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS IS NOT PART OF USER-AUTH
 * ---------------------------------------------------------------------------
 * `verification_codes` has no `user_id`. It is keyed on
 * `(identifier_type, identifier_value, purpose)` and nothing else, because the
 * question it answers — did whoever holds this mailbox or this handset read
 * what we sent there — is asked before there is a user to attach it to, and is
 * asked again by flows that have nothing to do with signing up.
 *
 * End-user registration is only the first caller. Admin authentication, and
 * `PASSWORD_RESET` for an account with no live session, ask exactly the same
 * question of exactly the same table. Leaving this inside `user-auth` would
 * mean the second and third of those either import a peer feature module or
 * grow their own copy — and a second copy of `retireActive` is a second answer
 * to "which code is the live one", which is the one thing this table's partial
 * unique index exists to prevent.
 *
 * ---------------------------------------------------------------------------
 * WHAT ESCAPES, AND WHAT DOES NOT
 * ---------------------------------------------------------------------------
 * `VerificationCodeService` only. `VerificationCodeRepository` stays a private
 * provider on purpose: `retireActive` supersedes whatever code is currently
 * live for an identifier, and a caller who reaches it directly can invalidate
 * a code that is already sitting in someone's inbox without issuing a
 * replacement. Going through the service is what keeps rotation and delivery
 * from being two decisions.
 *
 * ---------------------------------------------------------------------------
 * NOT `@Global()`, AND NOT IN `AppModule`
 * ---------------------------------------------------------------------------
 * Consumers import it — `UserAuthModule` today, an admin module later. Only
 * `core/*` and `infrastructure/*` are global here, and a domain module joining
 * that list is how a dependency graph stops being reviewable.
 *
 * There is deliberately no port and no `useExisting` alias, unlike
 * `SessionValidator`. That indirection exists because `core/auth` has to call
 * *into* `user-auth`, which would otherwise be a cycle. Here the arrow runs one
 * way only — this module has never heard of a user — so a direct import is
 * correct, and an interface in between would be ceremony that hides nothing.
 *
 * No controller, by design. The routes that issue and answer codes live with
 * the flow that owns the surrounding policy: whether the identifier is already
 * verified, whether the account is suspended, whether proving it earns a
 * session. None of that is this module's business.
 */
@Module({
  providers: [VerificationCodeRepository, VerificationCodeService],
  exports: [VerificationCodeService],
})
export class VerificationModule {}
