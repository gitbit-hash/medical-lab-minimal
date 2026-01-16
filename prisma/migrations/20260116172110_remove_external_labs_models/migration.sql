/*
  Warnings:

  - You are about to drop the column `external_lab_id` on the `tests` table. All the data in the column will be lost.
  - You are about to drop the column `outsourcing_cost` on the `tests` table. All the data in the column will be lost.
  - You are about to drop the `external_lab_test_prices` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `external_labs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."external_lab_test_prices" DROP CONSTRAINT "external_lab_test_prices_external_lab_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."external_lab_test_prices" DROP CONSTRAINT "external_lab_test_prices_test_template_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."tests" DROP CONSTRAINT "tests_external_lab_id_fkey";

-- AlterTable
ALTER TABLE "tests" DROP COLUMN "external_lab_id",
DROP COLUMN "outsourcing_cost";

-- DropTable
DROP TABLE "public"."external_lab_test_prices";

-- DropTable
DROP TABLE "public"."external_labs";
