-- NJ DCF Provider Import Schema Extensions
-- This extends the existing providers table with NJ-specific fields

-- Add new columns to existing providers table for NJ import
ALTER TABLE providers ADD COLUMN IF NOT EXISTS license_number TEXT UNIQUE;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS source VARCHAR(64) DEFAULT 'manual';
ALTER TABLE providers ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS source_as_of_date DATE;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS county TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS ages_served_raw TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS age_min_months INT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS age_max_months INT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS geocode_status TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS is_verified_by_gov BOOLEAN DEFAULT FALSE;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS is_profile_public BOOLEAN DEFAULT TRUE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_providers_license ON providers (license_number);
CREATE INDEX IF NOT EXISTS idx_providers_geom ON providers (lat, lng);
CREATE INDEX IF NOT EXISTS idx_providers_zip ON providers (zip_code);
CREATE INDEX IF NOT EXISTS idx_providers_name ON providers (name);
CREATE INDEX IF NOT EXISTS idx_providers_source ON providers (source);
CREATE INDEX IF NOT EXISTS idx_providers_slug ON providers (slug);
CREATE INDEX IF NOT EXISTS idx_providers_verified ON providers (is_verified_by_gov);

-- Ensure slug uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_providers_slug_unique ON providers (slug);

-- Add constraint for geocode status
ALTER TABLE providers ADD CONSTRAINT IF NOT EXISTS chk_geocode_status 
  CHECK (geocode_status IN ('OK', 'PARTIAL', 'NONE') OR geocode_status IS NULL);