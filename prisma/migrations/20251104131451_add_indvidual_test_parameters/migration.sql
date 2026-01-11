-- AlterTable
ALTER TABLE "tests" ADD COLUMN     "test_parameter_id" TEXT;

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_test_parameter_id_fkey" FOREIGN KEY ("test_parameter_id") REFERENCES "test_parameters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
