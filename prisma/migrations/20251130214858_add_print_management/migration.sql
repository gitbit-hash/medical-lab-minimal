-- AlterTable
ALTER TABLE "tests" ADD COLUMN     "is_printed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "print_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "printed_at" TIMESTAMP(3),
ADD COLUMN     "printed_by" TEXT;

-- CreateIndex
CREATE INDEX "tests_is_printed_idx" ON "tests"("is_printed");

-- CreateIndex
CREATE INDEX "tests_printed_at_idx" ON "tests"("printed_at");
