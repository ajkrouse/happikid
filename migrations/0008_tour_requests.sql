CREATE TYPE "public"."tour_request_status" AS ENUM('pending', 'scheduled', 'cancelled');--> statement-breakpoint
CREATE TABLE "tour_requests" (
"id" serial PRIMARY KEY NOT NULL,
"parent_user_id" varchar NOT NULL,
"provider_id" integer NOT NULL,
"preferred_dates" jsonb NOT NULL,
"preferred_time" varchar NOT NULL,
"note" text,
"status" "tour_request_status" DEFAULT 'pending' NOT NULL,
"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "tour_requests" ADD CONSTRAINT "tour_requests_parent_user_id_users_id_fk" FOREIGN KEY ("parent_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tour_requests" ADD CONSTRAINT "tour_requests_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tour_requests_parent_idx" ON "tour_requests" USING btree ("parent_user_id");--> statement-breakpoint
CREATE INDEX "tour_requests_provider_idx" ON "tour_requests" USING btree ("provider_id");
