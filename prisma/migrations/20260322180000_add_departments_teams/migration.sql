-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monthly_budget" DECIMAL(12,2),
    "alert_threshold" INTEGER NOT NULL DEFAULT 80,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monthly_budget" DECIMAL(12,2),
    "alert_threshold" INTEGER NOT NULL DEFAULT 80,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- AlterTable OrgUser - add FK columns
ALTER TABLE "org_users" ADD COLUMN "department_id" TEXT;
ALTER TABLE "org_users" ADD COLUMN "team_id" TEXT;

-- CreateIndex
CREATE INDEX "departments_org_id_idx" ON "departments"("org_id");
CREATE UNIQUE INDEX "departments_org_id_name_key" ON "departments"("org_id", "name");

CREATE INDEX "teams_org_id_idx" ON "teams"("org_id");
CREATE INDEX "teams_department_id_idx" ON "teams"("department_id");
CREATE UNIQUE INDEX "teams_org_id_department_id_name_key" ON "teams"("org_id", "department_id", "name");

CREATE INDEX "org_users_department_id_idx" ON "org_users"("department_id");
CREATE INDEX "org_users_team_id_idx" ON "org_users"("team_id");

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "teams" ADD CONSTRAINT "teams_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "teams" ADD CONSTRAINT "teams_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "org_users" ADD CONSTRAINT "org_users_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "org_users" ADD CONSTRAINT "org_users_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
