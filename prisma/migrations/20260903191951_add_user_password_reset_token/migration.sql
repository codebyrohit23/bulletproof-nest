-- CreateEnum
CREATE TYPE "PasswordResetTokenStatus" AS ENUM ('ACTIVE', 'CONSUMED', 'SUPERSEDED', 'EXPIRED');

-- CreateTable
CREATE TABLE "user_password_reset_tokens" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "status" "PasswordResetTokenStatus" NOT NULL DEFAULT 'ACTIVE',
    "resolved_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_password_reset_tokens_token_hash_key" ON "user_password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "user_password_reset_tokens_user_id_status_idx" ON "user_password_reset_tokens"("user_id", "status");

-- CreateIndex
CREATE INDEX "user_password_reset_tokens_expires_at_idx" ON "user_password_reset_tokens"("expires_at");

-- AddForeignKey
ALTER TABLE "user_password_reset_tokens" ADD CONSTRAINT "user_password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
