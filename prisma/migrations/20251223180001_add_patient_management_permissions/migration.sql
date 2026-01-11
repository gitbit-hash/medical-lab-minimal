-- AlterTable
ALTER TABLE "users" ADD COLUMN     "can_access_medical_history" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "can_create_patients" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "can_delete_patients" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "can_edit_patients" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "can_view_all_patients" BOOLEAN NOT NULL DEFAULT false;
