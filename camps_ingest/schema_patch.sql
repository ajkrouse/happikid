-- Schema patch for NJ Summer Youth Camps
-- Adds camp-specific fields to existing providers table

ALTER TABLE providers
  ADD COLUMN IF NOT EXISTS camp_id TEXT,
  ADD COLUMN IF NOT EXISTS doh_inspection_year INT,
  ADD COLUMN IF NOT EXISTS doh_report_url TEXT,
  ADD COLUMN IF NOT EXISTS camp_owner TEXT,
  ADD COLUMN IF NOT EXISTS camp_director TEXT,
  ADD COLUMN IF NOT EXISTS health_director TEXT,
  ADD COLUMN IF NOT EXISTS evaluation TEXT;

CREATE INDEX IF NOT EXISTS idx_providers_campid ON providers (camp_id);
CREATE INDEX IF NOT EXISTS idx_providers_source ON providers (source);