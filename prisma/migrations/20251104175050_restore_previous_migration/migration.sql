/*
  Warnings:

  - You are about to drop the column `can_be_ordered_individual` on the `test_parameters` table. All the data in the column will be lost.
  - You are about to drop the column `individual_fees` on the `test_parameters` table. All the data in the column will be lost.
  - You are about to drop the column `individual_test_code` on the `test_parameters` table. All the data in the column will be lost.
  - You are about to drop the column `individual_test_name` on the `test_parameters` table. All the data in the column will be lost.
  - You are about to drop the column `test_parameter_id` on the `tests` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."tests" DROP CONSTRAINT "tests_test_parameter_id_fkey";

-- DropIndex
DROP INDEX "public"."test_parameters_individual_test_code_key";

-- AlterTable
ALTER TABLE "test_parameters" DROP COLUMN "can_be_ordered_individual",
DROP COLUMN "individual_fees",
DROP COLUMN "individual_test_code",
DROP COLUMN "individual_test_name";

-- AlterTable
ALTER TABLE "tests" DROP COLUMN "test_parameter_id";
