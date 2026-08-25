CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "providers_public_name_trgm_idx" ON "providers" USING gin ("name" gin_trgm_ops) WHERE "is_active" = true AND "license_status" = 'confirmed' AND "is_profile_visible" = true AND "is_profile_public" = true;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "providers_public_description_trgm_idx" ON "providers" USING gin ("description" gin_trgm_ops) WHERE "is_active" = true AND "license_status" = 'confirmed' AND "is_profile_visible" = true AND "is_profile_public" = true;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "providers_public_address_trgm_idx" ON "providers" USING gin ("address" gin_trgm_ops) WHERE "is_active" = true AND "license_status" = 'confirmed' AND "is_profile_visible" = true AND "is_profile_public" = true;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "providers_public_city_trgm_idx" ON "providers" USING gin ("city" gin_trgm_ops) WHERE "is_active" = true AND "license_status" = 'confirmed' AND "is_profile_visible" = true AND "is_profile_public" = true;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION "provider_features_search_text"(input_features text[])
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT array_to_string(input_features, ' ')
$$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "providers_public_features_trgm_idx" ON "providers" USING gin (("provider_features_search_text"("features")) gin_trgm_ops) WHERE "is_active" = true AND "license_status" = 'confirmed' AND "is_profile_visible" = true AND "is_profile_public" = true;