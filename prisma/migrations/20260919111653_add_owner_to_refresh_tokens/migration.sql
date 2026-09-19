-- Each token now names its owner directly instead of only through its session.
--
-- Prisma generated a bare `ADD COLUMN ... NOT NULL`, which fails on any table
-- that already has rows. So: add nullable, backfill the owner from the session
-- the token already belongs to, then tighten. Every token has a session (the
-- FK is NOT NULL), so the backfill leaves no row behind and SET NOT NULL holds.

-- AlterTable
ALTER TABLE "admin_refresh_tokens" ADD COLUMN "admin_id" UUID;

UPDATE "admin_refresh_tokens" AS t
SET "admin_id" = s."admin_id"
FROM "admin_sessions" AS s
WHERE s."id" = t."session_id";

ALTER TABLE "admin_refresh_tokens" ALTER COLUMN "admin_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "refresh_tokens" ADD COLUMN "user_id" UUID;

UPDATE "refresh_tokens" AS t
SET "user_id" = s."user_id"
FROM "user_sessions" AS s
WHERE s."id" = t."session_id";

ALTER TABLE "refresh_tokens" ALTER COLUMN "user_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "admin_refresh_tokens_admin_id_idx" ON "admin_refresh_tokens"("admin_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_refresh_tokens" ADD CONSTRAINT "admin_refresh_tokens_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
