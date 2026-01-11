-- AlterTable
ALTER TABLE "tests" ADD COLUMN     "is_archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "visit_number" INTEGER NOT NULL DEFAULT 1;
