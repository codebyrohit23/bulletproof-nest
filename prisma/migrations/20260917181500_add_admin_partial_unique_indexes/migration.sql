-- Partial unique indexes: not expressible in schema.prisma (see the model comments).
-- Split from create_admin_tables because that migration was already applied.

-- A removed admin's email can be reused.
CREATE UNIQUE INDEX "admins_email_key"
    ON "admins" ("email")
    WHERE "deleted_at" IS NULL;

-- One live session per device, as user_sessions_live_device_key.
CREATE UNIQUE INDEX "admin_sessions_live_device_key"
    ON "admin_sessions" ("admin_id", "device_id")
    WHERE "revoked_at" IS NULL;
