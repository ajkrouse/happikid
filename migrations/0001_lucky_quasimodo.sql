CREATE TABLE "provider_profile_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_id" integer NOT NULL,
	"viewed_date" date NOT NULL,
	"count" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inquiries" ADD COLUMN "provider_reply" text;--> statement-breakpoint
ALTER TABLE "inquiries" ADD COLUMN "replied_at" timestamp;--> statement-breakpoint
ALTER TABLE "provider_profile_views" ADD CONSTRAINT "provider_profile_views_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ppv_provider_date_idx" ON "provider_profile_views" USING btree ("provider_id","viewed_date");