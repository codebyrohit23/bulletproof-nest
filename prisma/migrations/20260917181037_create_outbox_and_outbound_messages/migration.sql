-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'DISPATCHED', 'EXPIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "MessageCategory" AS ENUM ('TRANSACTIONAL', 'MARKETING');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'BOUNCED', 'COMPLAINED', 'FAILED', 'SUPPRESSED', 'EXPIRED');

-- CreateTable
CREATE TABLE "outbox_messages" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "queue" VARCHAR(64) NOT NULL,
    "job_name" VARCHAR(100) NOT NULL,
    "payload" JSONB,
    "options" JSONB,
    "idempotency_key" VARCHAR(200) NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" VARCHAR(1000),
    "available_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dispatched_at" TIMESTAMPTZ(6),

    CONSTRAINT "outbox_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbound_messages" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "channel" "MessageChannel" NOT NULL,
    "category" "MessageCategory" NOT NULL,
    "template_key" VARCHAR(100) NOT NULL,
    "recipient" VARCHAR(320) NOT NULL,
    "recipient_user_id" UUID,
    "recipient_admin_id" UUID,
    "status" "MessageStatus" NOT NULL DEFAULT 'QUEUED',
    "provider" VARCHAR(32),
    "provider_message_id" VARCHAR(255),
    "idempotency_key" VARCHAR(200) NOT NULL,
    "subject" VARCHAR(998),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error_code" VARCHAR(100),
    "error_message" VARCHAR(1000),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "sent_at" TIMESTAMPTZ(6),
    "delivered_at" TIMESTAMPTZ(6),
    "failed_at" TIMESTAMPTZ(6),

    CONSTRAINT "outbound_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "outbox_messages_idempotency_key_key" ON "outbox_messages"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "outbound_messages_idempotency_key_key" ON "outbound_messages"("idempotency_key");

-- CreateIndex
CREATE INDEX "outbound_messages_created_at_idx" ON "outbound_messages"("created_at" DESC);

-- CreateIndex
CREATE INDEX "outbound_messages_recipient_created_at_idx" ON "outbound_messages"("recipient", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "outbound_messages_provider_provider_message_id_key" ON "outbound_messages"("provider", "provider_message_id");

-- AddForeignKey
ALTER TABLE "outbound_messages" ADD CONSTRAINT "outbound_messages_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbound_messages" ADD CONSTRAINT "outbound_messages_recipient_admin_id_fkey" FOREIGN KEY ("recipient_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
