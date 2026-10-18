-- A rename, not the drop-and-add Prisma generates: that would discard the data.
ALTER TABLE "files" RENAME COLUMN "claimed_at" TO "attached_at";

-- Hand-written in add_stored_files, so Prisma does not know to rename it.
ALTER INDEX "files_unclaimed_expiry_idx" RENAME TO "files_unattached_expiry_idx";
