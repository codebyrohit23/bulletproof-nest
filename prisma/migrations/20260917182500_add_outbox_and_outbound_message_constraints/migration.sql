-- Not expressible in schema.prisma (see the model comments).
-- Split from create_outbox_and_outbound_messages because that migration was
-- already applied.

-- outbox_messages ------------------------------------------------------

-- The relay's query. Stays tiny: dispatched rows leave the predicate.
CREATE INDEX "outbox_messages_pending_idx"
    ON "outbox_messages" ("available_at")
    WHERE "status" = 'PENDING';

-- The nightly cleanup of dispatched and expired rows.
CREATE INDEX "outbox_messages_cleanup_idx"
    ON "outbox_messages" ("created_at")
    WHERE "status" <> 'PENDING';

ALTER TABLE "outbox_messages"
    ADD CONSTRAINT "chk_outbox_messages_dispatched"
        CHECK ("status" <> 'DISPATCHED' OR "dispatched_at" IS NOT NULL),
    ADD CONSTRAINT "chk_outbox_messages_pending_payload"
        CHECK ("status" <> 'PENDING' OR "payload" IS NOT NULL);

-- High churn: vacuum at 1% dead rows rather than the default 20%.
ALTER TABLE "outbox_messages"
    SET (autovacuum_vacuum_scale_factor = 0.01, autovacuum_vacuum_threshold = 1000);

-- outbound_messages ----------------------------------------------------

CREATE INDEX "outbound_messages_recipient_user_id_created_at_idx"
    ON "outbound_messages" ("recipient_user_id", "created_at" DESC)
    WHERE "recipient_user_id" IS NOT NULL;

CREATE INDEX "outbound_messages_recipient_admin_id_created_at_idx"
    ON "outbound_messages" ("recipient_admin_id", "created_at" DESC)
    WHERE "recipient_admin_id" IS NOT NULL;

-- The "what broke" dashboard.
CREATE INDEX "outbound_messages_problems_idx"
    ON "outbound_messages" ("created_at" DESC)
    WHERE "status" IN ('FAILED', 'BOUNCED', 'COMPLAINED');

-- A message belongs to a user or an admin, never both.
ALTER TABLE "outbound_messages"
    ADD CONSTRAINT "chk_outbound_messages_single_recipient"
        CHECK ("recipient_user_id" IS NULL OR "recipient_admin_id" IS NULL);
