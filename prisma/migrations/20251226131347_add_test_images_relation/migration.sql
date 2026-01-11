-- CreateEnum
CREATE TYPE "TestImageType" AS ENUM ('Motility', 'Morphology', 'Agglutination', 'Viability', 'Concentration', 'Other');

-- CreateTable
CREATE TABLE "test_images" (
    "id" TEXT NOT NULL,
    "test_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "caption" TEXT,
    "image_type" "TestImageType",
    "magnification" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "test_images_test_id_idx" ON "test_images"("test_id");

-- AddForeignKey
ALTER TABLE "test_images" ADD CONSTRAINT "test_images_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
