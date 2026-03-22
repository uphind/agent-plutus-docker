-- AlterEnum
ALTER TYPE "Provider" RENAME TO "Provider_old";
CREATE TYPE "Provider" AS ENUM ('anthropic', 'openai', 'gemini', 'cursor', 'vertex');
ALTER TABLE "provider_credentials" ALTER COLUMN "provider" TYPE "Provider" USING ("provider"::text::"Provider");
ALTER TABLE "usage_records" ALTER COLUMN "provider" TYPE "Provider" USING ("provider"::text::"Provider");
ALTER TABLE "sync_logs" ALTER COLUMN "provider" TYPE "Provider" USING ("provider"::text::"Provider");
DROP TYPE "Provider_old";
