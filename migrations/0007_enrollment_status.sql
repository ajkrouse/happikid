ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "enrollment_status" varchar DEFAULT 'accepting';
