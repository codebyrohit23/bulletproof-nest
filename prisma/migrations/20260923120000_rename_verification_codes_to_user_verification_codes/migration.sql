-- `verification_codes` becomes `user_verification_codes`, keyed by the identity
-- the code proves rather than by an address string.
--
-- Written by hand. For a changed `@@map` Prisma generates DROP TABLE + CREATE
-- TABLE; a rename keeps the rows. The constraints and indexes are renamed to
-- the names Prisma derives from the new table, or the next `migrate dev` would
-- see drift and generate a migration to rename them.
--
-- Why a separate table rather than an audience column: admin codes get their
-- own table, as every other admin auth table already is, so no query here can
-- ever read an admin's code — there is no filter to forget.

-- RenameTable
ALTER TABLE "verification_codes" RENAME TO "user_verification_codes";

-- RenamePrimaryKey
ALTER TABLE "user_verification_codes" RENAME CONSTRAINT "verification_codes_pkey" TO "user_verification_codes_pkey";

-- AddColumn — nullable until backfilled
ALTER TABLE "user_verification_codes" ADD COLUMN "user_identity_id" UUID;

-- Backfill. `user_identities` is unique on (identifier_value, identifier_type)
-- and both sides store the normalised value, so each code matches at most one.
UPDATE "user_verification_codes" AS c
SET "user_identity_id" = i."id"
FROM "user_identities" AS i
WHERE i."identifier_type" = c."identifier_type"
  AND i."identifier_value" = c."identifier_value";

-- A code whose identity no longer exists was already unanswerable: every flow
-- finds the identity before it looks at a code. It has nothing to point at.
DELETE FROM "user_verification_codes" WHERE "user_identity_id" IS NULL;

ALTER TABLE "user_verification_codes" ALTER COLUMN "user_identity_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "user_verification_codes"
  ADD CONSTRAINT "user_verification_codes_user_identity_id_fkey"
  FOREIGN KEY ("user_identity_id") REFERENCES "user_identities"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- DropIndex — both were keyed on the address columns being removed
DROP INDEX "verification_codes_active_key";
DROP INDEX "verification_codes_lookup_idx";

-- DropColumn
ALTER TABLE "user_verification_codes"
  DROP COLUMN "identifier_type",
  DROP COLUMN "identifier_value";

-- CreateIndex — also serves the foreign key on cascade
CREATE INDEX "user_verification_codes_lookup_idx"
  ON "user_verification_codes" ("user_identity_id", "purpose", "created_at" DESC);

-- Not expressible in schema.prisma (see the model comment). One live code per
-- identity and purpose, so two concurrent requests cannot leave two valid codes.
CREATE UNIQUE INDEX "user_verification_codes_active_key"
  ON "user_verification_codes" ("user_identity_id", "purpose")
  WHERE "status" = 'ACTIVE';
