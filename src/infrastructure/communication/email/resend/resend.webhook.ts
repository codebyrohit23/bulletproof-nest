/*
 * TODO: verify + normalise Resend's delivery, bounce and complaint callbacks.
 *
 * Use the `svix` package (pnpm add svix) with RESEND_WEBHOOK_SECRET — never a
 * hand-rolled HMAC check. A bug when sending throws and you see it; a bug here
 * silently accepts a forged bounce and suppresses a paying customer.
 *
 * Needs the raw request body, so it depends on the raw-body hook in bootstrap.
 */
