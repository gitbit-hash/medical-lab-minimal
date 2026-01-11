-- Create error_logs table if it doesn't exist (handles existing table)
CREATE TABLE IF NOT EXISTS "error_logs" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "error" TEXT,
    "stack" TEXT,
    "context" JSONB,
    "user_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for error_logs if they don't exist
CREATE INDEX IF NOT EXISTS "error_logs_category_idx" ON "error_logs"("category");
CREATE INDEX IF NOT EXISTS "error_logs_severity_idx" ON "error_logs"("severity");
CREATE INDEX IF NOT EXISTS "error_logs_created_at_idx" ON "error_logs"("created_at");

-- Add machine_id to licenses table (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'licenses' AND column_name = 'machine_id'
    ) THEN
        ALTER TABLE "licenses" ADD COLUMN "machine_id" TEXT;
    END IF;
END $$;

-- Create index for machine_id if it doesn't exist
CREATE INDEX IF NOT EXISTS "licenses_machine_id_idx" ON "licenses"("machine_id");


