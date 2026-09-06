-- One live session per device, enforced by the database rather than by a read.
--
-- `UserSessionService.startForDevice` looks for an existing live session before
-- inserting, and that read cannot be the guarantee: two logins from the same
-- device can both miss it and both insert, leaving one handset with two live
-- sessions. Revoking "that iPad" would then retire one of them and the other
-- would carry on authenticating — which is the precise failure this index
-- exists to make impossible.
--
-- Partial on `revoked_at IS NULL` so the constraint applies to *live* rows
-- only. A revoked session must stay in the table — it is the record of when and
-- why a device was signed out — and a total unique index would make signing
-- back in on that device fail forever.
--
-- Expiry is deliberately not part of the predicate. An expired session is still
-- the row that should be reused at the next login; excluding it here would let
-- a second row be inserted for a device that already has one.
--
-- Rows with a NULL `device_id` are unaffected: Postgres treats NULLs as
-- distinct in a unique index, so any pre-existing unbound session is left alone
-- rather than colliding with every other unbound session.
--
-- Prisma's schema language cannot express a partial unique index, so this
-- migration owns it and `schema.prisma` carries a comment pointing here — the
-- same arrangement as `verification_codes_active_key`.

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_live_device_key"
    ON "user_sessions" ("user_id", "device_id")
    WHERE "revoked_at" IS NULL;
