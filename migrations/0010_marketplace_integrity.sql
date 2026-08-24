DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "reviews"
    GROUP BY "provider_id", "user_id"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot add reviews_provider_user_uniq: duplicate reviews exist. Resolve duplicate provider/user review pairs before retrying.' USING ERRCODE = '23505';
  END IF;

  IF EXISTS (SELECT 1 FROM "reviews" WHERE "rating" < 1 OR "rating" > 5) THEN
    RAISE EXCEPTION 'Cannot add reviews_rating_bounds: ratings outside 1 through 5 exist. Correct invalid ratings before retrying.' USING ERRCODE = '23514';
  END IF;

  IF EXISTS (SELECT 1 FROM "provider_profile_views" WHERE "count" <= 0) THEN
    RAISE EXCEPTION 'Cannot add ppv_count_positive: non-positive profile-view counts exist. Correct invalid counts before retrying.' USING ERRCODE = '23514';
  END IF;
END;
$$;--> statement-breakpoint
ALTER TABLE "provider_profile_views" ADD COLUMN "viewer_key" varchar(64);--> statement-breakpoint
UPDATE "provider_profile_views" SET "viewer_key" = 'legacy-' || "id"::text WHERE "viewer_key" IS NULL;--> statement-breakpoint
ALTER TABLE "provider_profile_views" ALTER COLUMN "viewer_key" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "providers_public_search_filters_idx" ON "providers" USING btree ("city","borough","type","enrollment_status","accepts_subsidies") WHERE "providers"."is_active" = true AND "providers"."license_status" = 'confirmed' AND "providers"."is_profile_visible" = true AND "providers"."is_profile_public" = true;--> statement-breakpoint
ALTER TABLE "provider_profile_views" ADD CONSTRAINT "ppv_provider_viewer_date_uniq" UNIQUE("provider_id","viewer_key","viewed_date");--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_provider_user_uniq" UNIQUE("provider_id","user_id");--> statement-breakpoint
ALTER TABLE "provider_profile_views" ADD CONSTRAINT "ppv_count_positive" CHECK ("provider_profile_views"."count" > 0);--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_rating_bounds" CHECK ("reviews"."rating" BETWEEN 1 AND 5);--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX "providers_public_name_trgm_idx" ON "providers" USING gin ("name" gin_trgm_ops) WHERE "is_active" = true AND "license_status" = 'confirmed' AND "is_profile_visible" = true AND "is_profile_public" = true;--> statement-breakpoint
CREATE INDEX "providers_public_description_trgm_idx" ON "providers" USING gin ("description" gin_trgm_ops) WHERE "is_active" = true AND "license_status" = 'confirmed' AND "is_profile_visible" = true AND "is_profile_public" = true;--> statement-breakpoint
CREATE INDEX "providers_public_address_trgm_idx" ON "providers" USING gin ("address" gin_trgm_ops) WHERE "is_active" = true AND "license_status" = 'confirmed' AND "is_profile_visible" = true AND "is_profile_public" = true;--> statement-breakpoint
CREATE INDEX "providers_public_city_trgm_idx" ON "providers" USING gin ("city" gin_trgm_ops) WHERE "is_active" = true AND "license_status" = 'confirmed' AND "is_profile_visible" = true AND "is_profile_public" = true;--> statement-breakpoint
CREATE OR REPLACE FUNCTION "validate_provider_closed_dates_value"(input_closed_dates jsonb)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  entry jsonb;
  other_entry jsonb;
  from_date date;
  to_date date;
  other_from_date date;
  other_to_date date;
BEGIN
  IF input_closed_dates IS NULL THEN
    RETURN;
  END IF;

  IF jsonb_typeof(input_closed_dates) <> 'array' THEN
    RAISE EXCEPTION 'closed_dates must be a JSON array' USING ERRCODE = '23514';
  END IF;

  FOR entry IN SELECT value FROM jsonb_array_elements(input_closed_dates)
  LOOP
    IF jsonb_typeof(entry) <> 'object'
      OR entry->>'from' IS NULL
      OR entry->>'to' IS NULL
      OR entry->>'from' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
      OR entry->>'to' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN
      RAISE EXCEPTION 'each closed_dates entry must contain ISO from and to dates' USING ERRCODE = '23514';
    END IF;

    IF entry ? 'reason' AND (
      jsonb_typeof(entry->'reason') <> 'string'
      OR length(entry->>'reason') > 200
    ) THEN
      RAISE EXCEPTION 'closed_dates reason must be a string of 200 characters or fewer' USING ERRCODE = '23514';
    END IF;

    BEGIN
      from_date := (entry->>'from')::date;
      to_date := (entry->>'to')::date;
    EXCEPTION WHEN others THEN
      RAISE EXCEPTION 'closed_dates must contain valid calendar dates' USING ERRCODE = '23514';
    END;

    IF to_date < from_date THEN
      RAISE EXCEPTION 'closed_dates to date must be on or after from date' USING ERRCODE = '23514';
    END IF;
  END LOOP;

  FOR entry, other_entry IN
    SELECT first_range.value, second_range.value
    FROM jsonb_array_elements(input_closed_dates) WITH ORDINALITY AS first_range(value, position)
    JOIN jsonb_array_elements(input_closed_dates) WITH ORDINALITY AS second_range(value, position)
      ON first_range.position < second_range.position
  LOOP
    from_date := (entry->>'from')::date;
    to_date := (entry->>'to')::date;
    other_from_date := (other_entry->>'from')::date;
    other_to_date := (other_entry->>'to')::date;

    IF from_date <= other_to_date AND other_from_date <= to_date THEN
      RAISE EXCEPTION 'closed_dates ranges cannot overlap' USING ERRCODE = '23514';
    END IF;
  END LOOP;

  RETURN;
END;
$$;--> statement-breakpoint
DO $$
DECLARE
  provider_row record;
BEGIN
  FOR provider_row IN SELECT "id", "closed_dates" FROM "providers"
  LOOP
    BEGIN
      PERFORM "validate_provider_closed_dates_value"(provider_row.closed_dates);
    EXCEPTION WHEN check_violation THEN
      RAISE EXCEPTION 'Cannot enforce closure-range integrity: provider % has invalid closed_dates (%). Correct the schedule before retrying.', provider_row.id, SQLERRM USING ERRCODE = '23514';
    END;
  END LOOP;
END;
$$;--> statement-breakpoint
CREATE OR REPLACE FUNCTION "validate_provider_closed_dates"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM "validate_provider_closed_dates_value"(NEW.closed_dates);
  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER "providers_closed_dates_guard"
BEFORE INSERT OR UPDATE ON "providers"
FOR EACH ROW EXECUTE FUNCTION "validate_provider_closed_dates"();