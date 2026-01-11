-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('Percentage', 'Fixed');

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "discount_amount" DOUBLE PRECISION,
ADD COLUMN     "discount_approved_by" TEXT,
ADD COLUMN     "discount_percentage" DOUBLE PRECISION,
ADD COLUMN     "discount_reason" TEXT,
ADD COLUMN     "discount_type" "DiscountType";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "can_give_discount" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "discount_type" "DiscountType" DEFAULT 'Percentage',
ADD COLUMN     "max_discount_amount" DOUBLE PRECISION,
ADD COLUMN     "max_discount_percentage" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "discount_audits" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "original_total" DOUBLE PRECISION NOT NULL,
    "discount_amount" DOUBLE PRECISION NOT NULL,
    "discount_percentage" DOUBLE PRECISION,
    "discount_type" "DiscountType" NOT NULL,
    "discount_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discount_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "discount_audits_patient_id_idx" ON "discount_audits"("patient_id");

-- CreateIndex
CREATE INDEX "discount_audits_user_id_idx" ON "discount_audits"("user_id");

-- CreateIndex
CREATE INDEX "discount_audits_created_at_idx" ON "discount_audits"("created_at");

-- AddForeignKey
ALTER TABLE "discount_audits" ADD CONSTRAINT "discount_audits_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_audits" ADD CONSTRAINT "discount_audits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
