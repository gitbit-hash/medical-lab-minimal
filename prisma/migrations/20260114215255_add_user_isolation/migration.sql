-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "user_id" TEXT;

-- CreateIndex
CREATE INDEX "patients_user_id_idx" ON "patients"("user_id");

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
