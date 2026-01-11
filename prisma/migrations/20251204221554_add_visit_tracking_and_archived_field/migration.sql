-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "current_visit_number" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "tests" ADD COLUMN     "visit_id" TEXT;

-- CreateTable
CREATE TABLE "patient_visits" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "visit_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visit_number" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "total_amount" DOUBLE PRECISION,
    "discount_amount" DOUBLE PRECISION,
    "discount_percentage" DOUBLE PRECISION,
    "discount_type" "DiscountType",
    "discount_reason" TEXT,
    "amount_paid" DOUBLE PRECISION DEFAULT 0,
    "amount_due" DOUBLE PRECISION,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'Unpaid',
    "payment_method" TEXT,
    "receipt_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "patient_visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patient_visits_receipt_number_key" ON "patient_visits"("receipt_number");

-- CreateIndex
CREATE INDEX "patient_visits_patient_id_idx" ON "patient_visits"("patient_id");

-- CreateIndex
CREATE INDEX "patient_visits_visit_number_idx" ON "patient_visits"("visit_number");

-- CreateIndex
CREATE INDEX "tests_visit_id_idx" ON "tests"("visit_id");

-- AddForeignKey
ALTER TABLE "patient_visits" ADD CONSTRAINT "patient_visits_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "patient_visits"("id") ON DELETE SET NULL ON UPDATE CASCADE;
