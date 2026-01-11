-- AlterTable
ALTER TABLE "tests" ADD COLUMN     "external_lab_id" TEXT;

-- CreateTable
CREATE TABLE "external_labs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact_number" TEXT,
    "address" TEXT,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_labs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_external_lab_id_fkey" FOREIGN KEY ("external_lab_id") REFERENCES "external_labs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
