/*
  Warnings:

  - A unique constraint covering the columns `[avatar_file_id]` on the table `admins` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[avatar_file_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[logo_file_id]` on the table `workspaces` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "FilePurpose" AS ENUM ('USER_AVATAR', 'ADMIN_AVATAR', 'WORKSPACE_LOGO');

-- CreateEnum
CREATE TYPE "FileVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('PENDING', 'UPLOADED', 'READY', 'REJECTED');

-- CreateEnum
CREATE TYPE "FileRejectReason" AS ENUM ('SIZE_MISMATCH', 'TYPE_NOT_ALLOWED', 'TYPE_MISMATCH', 'UNREADABLE');

-- CreateEnum
CREATE TYPE "FileVariantKind" AS ENUM ('THUMBNAIL');

-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "avatar_file_id" UUID;

-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN     "logo_file_id" UUID;

-- CreateTable
CREATE TABLE "files" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "workspace_id" UUID,
    "uploaded_by_user_id" UUID,
    "uploaded_by_admin_id" UUID,
    "purpose" "FilePurpose" NOT NULL,
    "visibility" "FileVisibility" NOT NULL,
    "status" "FileStatus" NOT NULL DEFAULT 'PENDING',
    "reject_reason" "FileRejectReason",
    "object_key" VARCHAR(512) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "declared_mime_type" VARCHAR(255) NOT NULL,
    "detected_mime_type" VARCHAR(255),
    "size_bytes" BIGINT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "duration_ms" INTEGER,
    "metadata" JSONB,
    "expires_at" TIMESTAMPTZ(6),
    "uploaded_at" TIMESTAMPTZ(6),
    "processed_at" TIMESTAMPTZ(6),
    "claimed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_variants" (
    "file_id" UUID NOT NULL,
    "kind" "FileVariantKind" NOT NULL,
    "object_key" VARCHAR(512) NOT NULL,
    "mime_type" VARCHAR(255) NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_variants_pkey" PRIMARY KEY ("file_id","kind")
);

-- CreateTable
CREATE TABLE "workspace_storage_usage" (
    "workspace_id" UUID NOT NULL,
    "used_bytes" BIGINT NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "workspace_storage_usage_pkey" PRIMARY KEY ("workspace_id")
);

-- CreateIndex
CREATE INDEX "files_workspace_id_created_at_idx" ON "files"("workspace_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "files_uploaded_by_user_id_status_idx" ON "files"("uploaded_by_user_id", "status");

-- CreateIndex
CREATE INDEX "files_uploaded_by_admin_id_idx" ON "files"("uploaded_by_admin_id");

-- CreateIndex
CREATE UNIQUE INDEX "admins_avatar_file_id_key" ON "admins"("avatar_file_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_avatar_file_id_key" ON "users"("avatar_file_id");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_logo_file_id_key" ON "workspaces"("logo_file_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_avatar_file_id_fkey" FOREIGN KEY ("avatar_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_logo_file_id_fkey" FOREIGN KEY ("logo_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admins" ADD CONSTRAINT "admins_avatar_file_id_fkey" FOREIGN KEY ("avatar_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_uploaded_by_admin_id_fkey" FOREIGN KEY ("uploaded_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_variants" ADD CONSTRAINT "file_variants_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_storage_usage" ADD CONSTRAINT "workspace_storage_usage_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Not expressible in schema.prisma (see the model comments). ---------------

-- files ----------------------------------------------------------------

-- The purge of unclaimed uploads. Stays tiny: a claim clears expires_at.
CREATE INDEX "files_unclaimed_expiry_idx"
    ON "files" ("expires_at")
    WHERE "expires_at" IS NOT NULL;

-- The purge of soft-deleted files past the grace period.
CREATE INDEX "files_deleted_idx"
    ON "files" ("deleted_at")
    WHERE "deleted_at" IS NOT NULL;

ALTER TABLE "files"
    ADD CONSTRAINT "chk_files_single_uploader"
        CHECK ("uploaded_by_user_id" IS NULL OR "uploaded_by_admin_id" IS NULL),
    ADD CONSTRAINT "chk_files_size_positive"
        CHECK ("size_bytes" > 0);

-- workspace_storage_usage ----------------------------------------------

ALTER TABLE "workspace_storage_usage"
    ADD CONSTRAINT "chk_workspace_storage_usage_non_negative"
        CHECK ("used_bytes" >= 0);
