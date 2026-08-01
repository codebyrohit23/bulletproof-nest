-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- ============================================================
-- UUID v7 primary key generator
-- ============================================================
--
-- Every table defaults its primary key to uuidv7(). Postgres 18 ships this
-- function natively; on 17 and below it does not exist, so it is defined here.
-- Creating it in the "public" schema works on both versions: an unqualified
-- uuidv7() call resolves to this one, and once you are on PG 18 you may drop
-- it and inherit the built-in without touching schema.prisma.
--
-- v7 is time-ordered, so inserts land at the right edge of the primary key
-- index instead of scattering across it the way v4 does.
--
-- Note: a v7 UUID encodes its creation time. Never use one as a secret --
-- tokens, verification codes and API keys must stay cryptographically random.

CREATE OR REPLACE FUNCTION public.uuidv7() RETURNS uuid AS $$
  SELECT encode(
    substring(int8send(floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint) FROM 3)
      || substring(gen_random_bytes(10) FROM 1 FOR 10),
    'hex'
  )::uuid;
$$ LANGUAGE sql VOLATILE;

-- CreateEnum
CREATE TYPE "UserState" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "IdentifierType" AS ENUM ('EMAIL', 'PHONE');

-- CreateEnum
CREATE TYPE "VerificationPurpose" AS ENUM ('EMAIL_VERIFICATION', 'PHONE_VERIFICATION', 'PASSWORD_RESET', 'LOGIN');

-- CreateEnum
CREATE TYPE "UserAuthProvider" AS ENUM ('PASSWORD', 'GOOGLE', 'APPLE', 'FACEBOOK');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'LOGGED_OUT', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('DESKTOP', 'LAPTOP', 'TABLET', 'MOBILE', 'OTHER');

-- CreateEnum
CREATE TYPE "DevicePlatform" AS ENUM ('WEB', 'ANDROID', 'IOS');

-- CreateEnum
CREATE TYPE "OrganizationState" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'LEFT', 'REMOVED');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('CREATED', 'SENT', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "RoleSource" AS ENUM ('SYSTEM', 'CUSTOM');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100),
    "display_name" VARCHAR(150) NOT NULL,
    "avatar_file_id" UUID,
    "state" "UserState" NOT NULL DEFAULT 'PENDING',
    "last_active_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_identities" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "identifier_type" "IdentifierType" NOT NULL,
    "identifier_value" VARCHAR(320) NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_credentials" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "password_changed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_auth_accounts" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "provider" "UserAuthProvider" NOT NULL,
    "provider_account_id" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_auth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "device_id" VARCHAR(255),
    "device_name" VARCHAR(255),
    "device_type" "DeviceType",
    "platform" "DevicePlatform",
    "browser_name" VARCHAR(100),
    "browser_version" VARCHAR(50),
    "os_name" VARCHAR(100),
    "os_version" VARCHAR(100),
    "user_agent" TEXT,
    "fcm_token" TEXT,
    "push_enabled" BOOLEAN NOT NULL DEFAULT true,
    "ip_address" INET,
    "country_code" CHAR(2),
    "country_name" VARCHAR(100),
    "region" VARCHAR(100),
    "city" VARCHAR(100),
    "last_activity_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "session_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "token_family" UUID NOT NULL,
    "jti" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "replaced_by_token_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_codes" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "identifier_type" "IdentifierType" NOT NULL,
    "identifier_value" VARCHAR(320) NOT NULL,
    "purpose" "VerificationPurpose" NOT NULL,
    "code_hash" VARCHAR(255) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "verified_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "users_state_idx" ON "users"("state");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE INDEX "user_identities_identifier_value_idx" ON "user_identities"("identifier_value");

-- CreateIndex
CREATE INDEX "user_identities_is_verified_idx" ON "user_identities"("is_verified");

-- CreateIndex
CREATE UNIQUE INDEX "user_identities_user_id_identifier_type_key" ON "user_identities"("user_id", "identifier_type");

-- CreateIndex
CREATE UNIQUE INDEX "user_identities_identifier_type_identifier_value_key" ON "user_identities"("identifier_type", "identifier_value");

-- CreateIndex
CREATE UNIQUE INDEX "user_credentials_user_id_key" ON "user_credentials"("user_id");

-- CreateIndex
CREATE INDEX "user_auth_accounts_user_id_idx" ON "user_auth_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_auth_accounts_provider_provider_account_id_key" ON "user_auth_accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "user_sessions_status_idx" ON "user_sessions"("status");

-- CreateIndex
CREATE INDEX "user_sessions_expires_at_idx" ON "user_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "user_sessions_last_activity_at_idx" ON "user_sessions"("last_activity_at");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_jti_key" ON "refresh_tokens"("jti");

-- CreateIndex
CREATE INDEX "refresh_tokens_session_id_idx" ON "refresh_tokens"("session_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "verification_codes_identifier_type_identifier_value_idx" ON "verification_codes"("identifier_type", "identifier_value");

-- CreateIndex
CREATE INDEX "verification_codes_expires_at_idx" ON "verification_codes"("expires_at");

-- CreateIndex
CREATE INDEX "verification_codes_purpose_idx" ON "verification_codes"("purpose");

-- AddForeignKey
ALTER TABLE "user_identities" ADD CONSTRAINT "user_identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_credentials" ADD CONSTRAINT "user_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_auth_accounts" ADD CONSTRAINT "user_auth_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "user_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

