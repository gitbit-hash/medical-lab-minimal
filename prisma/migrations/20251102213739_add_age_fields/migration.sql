/*
  Warnings:

  - You are about to drop the column `date_of_birth` on the `patients` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "patients" DROP COLUMN "date_of_birth",
ADD COLUMN     "age_unit" TEXT,
ADD COLUMN     "age_value" DOUBLE PRECISION;
