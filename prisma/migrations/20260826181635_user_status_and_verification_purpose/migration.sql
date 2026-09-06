-- ============================================================
-- 1. UserState → UserStatus   (PENDING removed, DEACTIVATED added)
-- ============================================================

-- PENDING users ACTIVE ban jaate hain. Safe hai: unka identity.verified_at
-- NULL hai, aur login usko alag se independently refuse karta hai.
UPDATE "users" SET "state" = 'ACTIVE' WHERE "state" = 'PENDING';

-- Default pehle hatana zaroori hai, warna type cast fail hoti hai
ALTER TABLE "users" ALTER COLUMN "state" DROP DEFAULT;

CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DEACTIVATED', 'SUSPENDED');

ALTER TABLE "users"
  ALTER COLUMN "state" TYPE "UserStatus" USING ("state"::text::"UserStatus");

ALTER TABLE "users" RENAME COLUMN "state" TO "status";

ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

DROP TYPE "UserState";

-- Column rename se index ka naam apne aap nahi badalta
ALTER INDEX "users_state_idx" RENAME TO "users_status_idx";


-- ============================================================
-- 2. VerificationPurpose — REGISTER removed
-- ============================================================

-- REGISTER ab identifier type ke hisaab se apne asli purpose me chala jaata hai
UPDATE "verification_codes" SET "purpose" = 'EMAIL_VERIFICATION'
  WHERE "purpose" = 'REGISTER' AND "identifier_type" = 'EMAIL';

UPDATE "verification_codes" SET "purpose" = 'PHONE_VERIFICATION'
  WHERE "purpose" = 'REGISTER' AND "identifier_type" = 'PHONE';

-- Naam wahi rehna hai, isliye "_new" wala pattern chahiye
CREATE TYPE "VerificationPurpose_new" AS ENUM
  ('EMAIL_VERIFICATION', 'PHONE_VERIFICATION', 'LOGIN', 'PASSWORD_RESET');

ALTER TABLE "verification_codes"
  ALTER COLUMN "purpose" TYPE "VerificationPurpose_new"
  USING ("purpose"::text::"VerificationPurpose_new");

ALTER TYPE "VerificationPurpose" RENAME TO "VerificationPurpose_old";
ALTER TYPE "VerificationPurpose_new" RENAME TO "VerificationPurpose";
DROP TYPE "VerificationPurpose_old";


-- ============================================================
-- 3. WorkspaceState → WorkspaceStatus
-- ============================================================

-- Type DB me maujood hai (init migration me bana tha) — sirf rename
ALTER TYPE "WorkspaceState" RENAME TO "WorkspaceStatus";
