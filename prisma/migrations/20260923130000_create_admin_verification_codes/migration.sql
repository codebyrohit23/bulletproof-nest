-- One-time codes for the admin console, in their own table beside every other
-- admin auth table. A user's code can never answer an admin flow: there is no
-- shared row for a query to reach, and no audience filter to forget.
--
-- Keyed by admin_id — the admin row is the identity, since an admin has one
-- address and it lives on `admins`.

-- CreateTable
CREATE TABLE "admin_verification_codes" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "admin_id" UUID NOT NULL,
    "purpose" "VerificationPurpose" NOT NULL,
    "code_hash" VARCHAR(64),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "status" "VerificationCodeStatus" NOT NULL DEFAULT 'ACTIVE',
    "resolved_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex — also serves the foreign key on cascade
CREATE INDEX "admin_verification_codes_lookup_idx" ON "admin_verification_codes"("admin_id", "purpose", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "admin_verification_codes" ADD CONSTRAINT "admin_verification_codes_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Not expressible in schema.prisma (see the model comment). One live code per
-- admin and purpose, so two concurrent requests cannot leave two valid codes.
CREATE UNIQUE INDEX "admin_verification_codes_active_key"
    ON "admin_verification_codes" ("admin_id", "purpose")
    WHERE "status" = 'ACTIVE';
