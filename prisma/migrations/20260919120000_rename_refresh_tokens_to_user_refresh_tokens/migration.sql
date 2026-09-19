-- `refresh_tokens` becomes `user_refresh_tokens`, matching `admin_refresh_tokens`
-- and every other `user_*` table.
--
-- Written by hand. For a changed `@@map` Prisma generates DROP TABLE + CREATE
-- TABLE, which would destroy every live token and sign all users out. A rename
-- keeps the rows.
--
-- The constraints and indexes are renamed too, to the names Prisma derives
-- from the new table name. Left under their old names, the next
-- `migrate dev` would see drift and generate a migration to rename them.

-- RenameTable
ALTER TABLE "refresh_tokens" RENAME TO "user_refresh_tokens";

-- RenamePrimaryKey
ALTER TABLE "user_refresh_tokens" RENAME CONSTRAINT "refresh_tokens_pkey" TO "user_refresh_tokens_pkey";

-- RenameForeignKey
ALTER TABLE "user_refresh_tokens" RENAME CONSTRAINT "refresh_tokens_session_id_fkey" TO "user_refresh_tokens_session_id_fkey";

-- RenameForeignKey
ALTER TABLE "user_refresh_tokens" RENAME CONSTRAINT "refresh_tokens_user_id_fkey" TO "user_refresh_tokens_user_id_fkey";

-- RenameIndex
ALTER INDEX "refresh_tokens_token_hash_key" RENAME TO "user_refresh_tokens_token_hash_key";

-- RenameIndex
ALTER INDEX "refresh_tokens_session_id_idx" RENAME TO "user_refresh_tokens_session_id_idx";

-- RenameIndex
ALTER INDEX "refresh_tokens_user_id_idx" RENAME TO "user_refresh_tokens_user_id_idx";

-- RenameIndex
ALTER INDEX "refresh_tokens_expires_at_idx" RENAME TO "user_refresh_tokens_expires_at_idx";
