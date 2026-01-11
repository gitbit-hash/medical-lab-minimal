-- AlterTable
ALTER TABLE "users" ADD COLUMN     "can_archive_test_templates" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "can_create_test_templates" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "can_delete_test_templates" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "can_edit_fees" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "can_edit_reference_ranges" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "can_edit_test_templates" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "can_view_test_templates" BOOLEAN NOT NULL DEFAULT true;
