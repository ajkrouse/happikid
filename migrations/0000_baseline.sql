CREATE TYPE "public"."claim_request_status" AS ENUM('initiated', 'awaiting_admin_review', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."claim_status" AS ENUM('unclaimed', 'pending_review', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."verification_method" AS ENUM('email_domain', 'doc_upload');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" varchar,
	"action" varchar NOT NULL,
	"target_type" varchar NOT NULL,
	"target_id" varchar NOT NULL,
	"meta" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"status" "claim_request_status" DEFAULT 'initiated' NOT NULL,
	"verification_method" "verification_method" NOT NULL,
	"verification_payload" jsonb,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"children_ages" jsonb DEFAULT '[]'::jsonb,
	"preferred_borough" varchar,
	"preferred_city" varchar,
	"preferred_zip_code" varchar,
	"max_distance_miles" integer DEFAULT 5,
	"schedule_type" varchar,
	"preferred_days" jsonb DEFAULT '[]'::jsonb,
	"preferred_start_time" varchar,
	"preferred_end_time" varchar,
	"budget_min" integer,
	"budget_max" integer,
	"needs_subsidy" boolean DEFAULT false,
	"must_have_features" jsonb DEFAULT '[]'::jsonb,
	"special_needs" jsonb DEFAULT '[]'::jsonb,
	"preferred_languages" jsonb DEFAULT '[]'::jsonb,
	"nice_to_have_features" jsonb DEFAULT '[]'::jsonb,
	"preferred_provider_types" jsonb DEFAULT '[]'::jsonb,
	"is_complete" boolean DEFAULT false,
	"completed_steps" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "family_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"user_id" varchar NOT NULL,
	"provider_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "favorites_user_id_provider_id_pk" PRIMARY KEY("user_id","provider_id")
);
--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"parent_name" varchar NOT NULL,
	"parent_email" varchar NOT NULL,
	"parent_phone" varchar,
	"child_age" varchar,
	"message" text,
	"inquiry_type" varchar DEFAULT 'info',
	"status" varchar DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inquiry_replies" (
	"id" serial PRIMARY KEY NOT NULL,
	"inquiry_id" integer NOT NULL,
	"sender_id" varchar NOT NULL,
	"sender_role" varchar NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_amenities" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_id" integer NOT NULL,
	"name" varchar NOT NULL,
	"category" varchar,
	"is_structured" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "provider_badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_id" integer NOT NULL,
	"badge_type" varchar NOT NULL,
	"earned_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "provider_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_id" integer NOT NULL,
	"image_url" varchar NOT NULL,
	"caption" varchar,
	"is_primary" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "provider_inquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_id" integer NOT NULL,
	"parent_id" varchar NOT NULL,
	"subject" varchar(255),
	"message" text NOT NULL,
	"message_type" varchar DEFAULT 'general',
	"status" varchar DEFAULT 'sent',
	"parent_email" varchar,
	"parent_phone" varchar,
	"child_age" varchar,
	"preferred_start_date" date,
	"created_at" timestamp DEFAULT now(),
	"read_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "provider_locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_id" integer NOT NULL,
	"name" varchar,
	"address" text NOT NULL,
	"borough" varchar NOT NULL,
	"city" varchar NOT NULL,
	"state" varchar NOT NULL,
	"zip_code" varchar NOT NULL,
	"phone" varchar,
	"capacity" integer,
	"hours_open" varchar,
	"hours_close" varchar,
	"is_primary" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "provider_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"provider_id" integer NOT NULL,
	"image_url" varchar NOT NULL,
	"caption" text,
	"photo_type" varchar DEFAULT 'other',
	"status" varchar DEFAULT 'pending',
	"moderator_id" varchar,
	"moderator_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "provider_programs" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_id" integer NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"age_range_min" integer NOT NULL,
	"age_range_max" integer NOT NULL,
	"price_type" varchar NOT NULL,
	"price" numeric(8, 2) NOT NULL,
	"show_exact_price" boolean DEFAULT true,
	"capacity" integer,
	"schedule" jsonb,
	"features" text[],
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "provider_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_id" integer NOT NULL,
	"overall_score" integer DEFAULT 0 NOT NULL,
	"completeness_score" integer DEFAULT 0 NOT NULL,
	"engagement_score" integer DEFAULT 0 NOT NULL,
	"verification_score" integer DEFAULT 0 NOT NULL,
	"freshness_score" integer DEFAULT 0 NOT NULL,
	"score_breakdown" jsonb DEFAULT '{}'::jsonb,
	"badges" text[] DEFAULT '{}'::text[],
	"rank_in_category" integer,
	"category_average" integer,
	"improvement_suggestions" jsonb DEFAULT '[]'::jsonb,
	"last_calculated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "provider_updates" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"provider_id" integer NOT NULL,
	"update_type" varchar NOT NULL,
	"field" varchar NOT NULL,
	"old_value" text,
	"new_value" text NOT NULL,
	"reason" text,
	"status" varchar DEFAULT 'pending',
	"moderator_id" varchar,
	"moderator_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "providers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"name" varchar NOT NULL,
	"description" text,
	"address" text NOT NULL,
	"borough" varchar NOT NULL,
	"city" varchar NOT NULL,
	"state" varchar NOT NULL,
	"zip_code" varchar NOT NULL,
	"phone" varchar,
	"email" varchar,
	"website" varchar,
	"type" varchar NOT NULL,
	"age_range_min" integer NOT NULL,
	"age_range_max" integer NOT NULL,
	"capacity" integer,
	"monthly_price" numeric(8, 2) NOT NULL,
	"monthly_price_min" numeric(8, 2),
	"monthly_price_max" numeric(8, 2),
	"show_exact_price" boolean DEFAULT true,
	"hours_open" varchar,
	"hours_close" varchar,
	"schedule" jsonb,
	"features" text[],
	"min_age_months" integer,
	"max_age_months" integer,
	"total_capacity" integer,
	"features_new" jsonb DEFAULT '[]'::jsonb,
	"features_custom" jsonb DEFAULT '[]'::jsonb,
	"details" jsonb DEFAULT '{}'::jsonb,
	"is_verified" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"rating" numeric(3, 2) DEFAULT '0',
	"review_count" integer DEFAULT 0,
	"profile_completeness" integer DEFAULT 0,
	"onboarding_step" varchar DEFAULT 'basic_info',
	"is_profile_visible" boolean DEFAULT false,
	"license_number" varchar,
	"license_status" varchar DEFAULT 'pending',
	"license_confirmed_at" timestamp,
	"accreditation_details" text,
	"program_highlights" text[],
	"unique_selling_points" text[],
	"faqs" jsonb,
	"profile_views" integer DEFAULT 0,
	"profile_clicks" integer DEFAULT 0,
	"inquiry_count" integer DEFAULT 0,
	"comparison_adds" integer DEFAULT 0,
	"favorite_adds" integer DEFAULT 0,
	"is_premium" boolean DEFAULT false,
	"premium_expires_at" timestamp,
	"owner_user_id" varchar,
	"claim_status" "claim_status" DEFAULT 'unclaimed',
	"verification_method" "verification_method",
	"verification_payload" jsonb,
	"claimed_at" timestamp,
	"source" varchar(64) DEFAULT 'manual',
	"source_url" text,
	"source_as_of_date" date,
	"county" text,
	"ages_served_raw" text,
	"age_min_months" integer,
	"age_max_months" integer,
	"lat" double precision,
	"lng" double precision,
	"geocode_status" text,
	"slug" text,
	"is_verified_by_gov" boolean DEFAULT false,
	"is_profile_public" boolean DEFAULT true,
	"accepts_subsidies" boolean DEFAULT false,
	"camp_id" text,
	"doh_inspection_year" integer,
	"doh_report_url" text,
	"camp_owner" text,
	"camp_director" text,
	"health_director" text,
	"evaluation" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "review_votes" (
	"user_id" varchar NOT NULL,
	"review_id" integer NOT NULL,
	"vote_type" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "review_votes_user_id_review_id_pk" PRIMARY KEY("user_id","review_id")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"rating" integer NOT NULL,
	"title" varchar,
	"content" text,
	"is_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"role" varchar DEFAULT 'parent' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_profiles" ADD CONSTRAINT "family_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiry_replies" ADD CONSTRAINT "inquiry_replies_inquiry_id_provider_inquiries_id_fk" FOREIGN KEY ("inquiry_id") REFERENCES "public"."provider_inquiries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiry_replies" ADD CONSTRAINT "inquiry_replies_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_amenities" ADD CONSTRAINT "provider_amenities_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_badges" ADD CONSTRAINT "provider_badges_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_images" ADD CONSTRAINT "provider_images_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_inquiries" ADD CONSTRAINT "provider_inquiries_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_inquiries" ADD CONSTRAINT "provider_inquiries_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_locations" ADD CONSTRAINT "provider_locations_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_photos" ADD CONSTRAINT "provider_photos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_photos" ADD CONSTRAINT "provider_photos_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_photos" ADD CONSTRAINT "provider_photos_moderator_id_users_id_fk" FOREIGN KEY ("moderator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_programs" ADD CONSTRAINT "provider_programs_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_scores" ADD CONSTRAINT "provider_scores_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_updates" ADD CONSTRAINT "provider_updates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_updates" ADD CONSTRAINT "provider_updates_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_updates" ADD CONSTRAINT "provider_updates_moderator_id_users_id_fk" FOREIGN KEY ("moderator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "providers" ADD CONSTRAINT "providers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "providers" ADD CONSTRAINT "providers_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");