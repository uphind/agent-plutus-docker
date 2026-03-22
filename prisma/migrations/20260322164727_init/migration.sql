-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('anthropic', 'openai', 'cursor', 'vertex', 'n8n', 'lovable');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "api_key_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_users" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "team" TEXT,
    "job_title" TEXT,
    "employee_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "org_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_credentials" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "provider" "Provider" NOT NULL,
    "encrypted_api_key" TEXT NOT NULL,
    "label" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_records" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "user_id" TEXT,
    "provider" "Provider" NOT NULL,
    "model" TEXT,
    "date" DATE NOT NULL,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "cached_tokens" INTEGER NOT NULL DEFAULT 0,
    "requests_count" INTEGER NOT NULL DEFAULT 0,
    "cost_usd" DECIMAL(12,6) NOT NULL DEFAULT 0,
    "lines_accepted" INTEGER,
    "lines_suggested" INTEGER,
    "accept_rate" DECIMAL(5,4),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "provider" "Provider" NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "org_users_org_id_idx" ON "org_users"("org_id");

-- CreateIndex
CREATE INDEX "org_users_department_idx" ON "org_users"("department");

-- CreateIndex
CREATE INDEX "org_users_team_idx" ON "org_users"("team");

-- CreateIndex
CREATE UNIQUE INDEX "org_users_org_id_email_key" ON "org_users"("org_id", "email");

-- CreateIndex
CREATE INDEX "provider_credentials_org_id_idx" ON "provider_credentials"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "provider_credentials_org_id_provider_key" ON "provider_credentials"("org_id", "provider");

-- CreateIndex
CREATE INDEX "usage_records_org_id_date_idx" ON "usage_records"("org_id", "date");

-- CreateIndex
CREATE INDEX "usage_records_org_id_provider_idx" ON "usage_records"("org_id", "provider");

-- CreateIndex
CREATE INDEX "usage_records_org_id_user_id_idx" ON "usage_records"("org_id", "user_id");

-- CreateIndex
CREATE INDEX "usage_records_provider_date_idx" ON "usage_records"("provider", "date");

-- CreateIndex
CREATE INDEX "sync_logs_org_id_provider_idx" ON "sync_logs"("org_id", "provider");

-- AddForeignKey
ALTER TABLE "org_users" ADD CONSTRAINT "org_users_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_credentials" ADD CONSTRAINT "provider_credentials_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "org_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
