/*
  Warnings:

  - Added the required column `entity_type` to the `audit_logs` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."audit_logs" DROP CONSTRAINT "audit_logs_user_id_fkey";

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "description" TEXT,
ADD COLUMN     "entity_id" TEXT,
ADD COLUMN     "entity_type" TEXT NOT NULL,
ADD COLUMN     "ip_address" TEXT,
ADD COLUMN     "new_values" JSONB,
ADD COLUMN     "old_values" JSONB,
ADD COLUMN     "user_agent" TEXT;

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "doctors_is_deleted_idx" ON "doctors"("is_deleted");

-- CreateIndex
CREATE INDEX "doctors_sync_status_idx" ON "doctors"("sync_status");

-- CreateIndex
CREATE INDEX "patients_is_deleted_idx" ON "patients"("is_deleted");

-- CreateIndex
CREATE INDEX "patients_sync_status_idx" ON "patients"("sync_status");

-- CreateIndex
CREATE INDEX "test_categories_is_active_idx" ON "test_categories"("is_active");

-- CreateIndex
CREATE INDEX "test_templates_is_active_idx" ON "test_templates"("is_active");

-- CreateIndex
CREATE INDEX "test_templates_category_id_idx" ON "test_templates"("category_id");

-- CreateIndex
CREATE INDEX "test_templates_name_idx" ON "test_templates"("name");

-- CreateIndex
CREATE INDEX "tests_is_deleted_idx" ON "tests"("is_deleted");

-- CreateIndex
CREATE INDEX "tests_sync_status_idx" ON "tests"("sync_status");

-- CreateIndex
CREATE INDEX "tests_status_idx" ON "tests"("status");

-- CreateIndex
CREATE INDEX "tests_created_at_idx" ON "tests"("created_at");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
