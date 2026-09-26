-- One verification-purpose enum per audience, as every other auth table is.
--
-- The shared type let an admin row hold EMAIL_VERIFICATION or
-- PHONE_VERIFICATION, which no admin flow issues; only a TypeScript narrowing
-- in modules/admin-auth kept them out. Now the column refuses them.
--
-- Hand-written: Prisma would drop and recreate the user type, rewriting a
-- table that only needs its type renamed.

-- User side: same values, new name. A rename rewrites nothing.
ALTER TYPE "VerificationPurpose" RENAME TO "UserVerificationPurpose";

-- Admin side: only what a flow issues today. No flow has ever issued anything
-- but PASSWORD_RESET for an admin, so the cast cannot meet another value; if
-- it does, it fails and rolls the migration back rather than dropping a row.
CREATE TYPE "AdminVerificationPurpose" AS ENUM ('PASSWORD_RESET');

-- Rebuilds admin_verification_codes_lookup_idx and
-- admin_verification_codes_active_key along with the column.
ALTER TABLE "admin_verification_codes"
    ALTER COLUMN "purpose" TYPE "AdminVerificationPurpose"
    USING ("purpose"::text::"AdminVerificationPurpose");
