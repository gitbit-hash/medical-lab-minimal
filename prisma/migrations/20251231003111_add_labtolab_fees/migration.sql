-- AlterTable
ALTER TABLE "tests" ADD COLUMN     "outsourcing_cost" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "external_lab_test_prices" (
    "id" TEXT NOT NULL,
    "external_lab_id" TEXT NOT NULL,
    "test_template_id" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_lab_test_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "external_lab_test_prices_external_lab_id_test_template_id_key" ON "external_lab_test_prices"("external_lab_id", "test_template_id");

-- AddForeignKey
ALTER TABLE "external_lab_test_prices" ADD CONSTRAINT "external_lab_test_prices_external_lab_id_fkey" FOREIGN KEY ("external_lab_id") REFERENCES "external_labs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_lab_test_prices" ADD CONSTRAINT "external_lab_test_prices_test_template_id_fkey" FOREIGN KEY ("test_template_id") REFERENCES "test_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
