CREATE OR REPLACE FUNCTION "provider_features_search_text"(input_features text[])
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT array_to_string(input_features, ' ')
$$;--> statement-breakpoint
CREATE INDEX "providers_public_features_trgm_idx" ON "providers" USING gin (("provider_features_search_text"("features")) gin_trgm_ops) WHERE "is_active" = true AND "license_status" = 'confirmed' AND "is_profile_visible" = true AND "is_profile_public" = true;