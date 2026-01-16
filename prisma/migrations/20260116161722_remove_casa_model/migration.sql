/*
  Warnings:

  - The values [CASA] on the enum `AndrologyTestType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `casa_analysis` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AndrologyTestType_new" AS ENUM ('SemenAnalysis', 'SpermDNAFragmentation', 'SpermFunctionTests', 'PostCoitalTest', 'SpermCryopreservation', 'SpermPreparation');
ALTER TABLE "test_templates" ALTER COLUMN "andrology_test_type" TYPE "AndrologyTestType_new" USING ("andrology_test_type"::text::"AndrologyTestType_new");
ALTER TABLE "tests" ALTER COLUMN "andrology_test_type" TYPE "AndrologyTestType_new" USING ("andrology_test_type"::text::"AndrologyTestType_new");
ALTER TYPE "AndrologyTestType" RENAME TO "AndrologyTestType_old";
ALTER TYPE "AndrologyTestType_new" RENAME TO "AndrologyTestType";
DROP TYPE "public"."AndrologyTestType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."casa_analysis" DROP CONSTRAINT "casa_analysis_test_id_fkey";

-- DropTable
DROP TABLE "public"."casa_analysis";
