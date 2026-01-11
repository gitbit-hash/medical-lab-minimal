-- CreateTable
CREATE TABLE "visit_doctors" (
    "id" TEXT NOT NULL,
    "visit_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "sync_status" TEXT NOT NULL DEFAULT 'Pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visit_doctors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "visit_doctors_visit_id_doctor_id_key" ON "visit_doctors"("visit_id", "doctor_id");

-- AddForeignKey
ALTER TABLE "visit_doctors" ADD CONSTRAINT "visit_doctors_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "patient_visits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_doctors" ADD CONSTRAINT "visit_doctors_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
