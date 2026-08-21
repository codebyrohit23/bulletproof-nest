-- CreateEnum
CREATE TYPE "VerificationCodeStatus" AS ENUM ('ACTIVE', 'CONSUMED', 'SUPERSEDED', 'BLOCKED', 'EXPIRED');

-- DropIndex
DROP INDEX "verification_codes_expires_at_idx";

-- DropIndex
DROP INDEX "verification_codes_identifier_value_identifier_type_purpose_key";

-- AlterTable
ALTER TABLE "verification_codes" ADD COLUMN     "resolved_at" TIMESTAMPTZ(6),
ADD COLUMN     "status" "VerificationCodeStatus" NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "code_hash" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "verification_codes_lookup_idx" ON "verification_codes"("identifier_value", "identifier_type", "purpose", "created_at" DESC);

UPDATE "verification_codes"
SET "status" = 'EXPIRED',
    "resolved_at" = "expires_at",
    "code_hash" = NULL
WHERE "expires_at" <= CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "verification_codes_active_key"
    ON "verification_codes" ("identifier_value", "identifier_type", "purpose")
    WHERE "status" = 'ACTIVE';
