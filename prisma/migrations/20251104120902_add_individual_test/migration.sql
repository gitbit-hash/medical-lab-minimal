/*
  Warnings:

  - A unique constraint covering the columns `[individual_test_code]` on the table `test_parameters` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "test_parameters" ADD COLUMN     "can_be_ordered_individual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "individual_fees" DOUBLE PRECISION,
ADD COLUMN     "individual_test_code" TEXT,
ADD COLUMN     "individual_test_name" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "test_parameters_individual_test_code_key" ON "test_parameters"("individual_test_code");
