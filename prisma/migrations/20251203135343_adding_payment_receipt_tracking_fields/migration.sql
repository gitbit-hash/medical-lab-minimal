/*
  Warnings:

  - A unique constraint covering the columns `[receipt_number]` on the table `patients` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('Unpaid', 'PartiallyPaid', 'Paid', 'Insurance');

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "amount_due" DOUBLE PRECISION,
ADD COLUMN     "amount_paid" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "partial_payments" JSONB,
ADD COLUMN     "payment_method" TEXT,
ADD COLUMN     "payment_notes" TEXT,
ADD COLUMN     "payment_status" "PaymentStatus" NOT NULL DEFAULT 'Unpaid',
ADD COLUMN     "receipt_number" TEXT,
ADD COLUMN     "receipt_printed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "receipt_printed_at" TIMESTAMP(3),
ADD COLUMN     "receipt_printed_by" TEXT,
ADD COLUMN     "total_amount" DOUBLE PRECISION;

-- CreateIndex
CREATE UNIQUE INDEX "patients_receipt_number_key" ON "patients"("receipt_number");
