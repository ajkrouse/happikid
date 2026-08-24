CREATE TABLE "provider_image_cleanup_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"object_path" varchar NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	CONSTRAINT "provider_image_cleanup_jobs_object_path_unique" UNIQUE("object_path")
);
