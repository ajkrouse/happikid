CREATE TABLE "saved_provider_group_items" (
	"group_id" uuid NOT NULL,
	"provider_id" integer NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "saved_provider_group_items_group_id_provider_id_pk" PRIMARY KEY("group_id","provider_id"),
	CONSTRAINT "saved_provider_group_items_group_position_uniq" UNIQUE("group_id","position")
);
--> statement-breakpoint
CREATE TABLE "saved_provider_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" varchar(80) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "saved_provider_groups_user_name_uniq" UNIQUE("user_id","name")
);
--> statement-breakpoint
ALTER TABLE "saved_provider_group_items" ADD CONSTRAINT "saved_provider_group_items_group_id_saved_provider_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."saved_provider_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_provider_group_items" ADD CONSTRAINT "saved_provider_group_items_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_provider_groups" ADD CONSTRAINT "saved_provider_groups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "saved_provider_groups_user_updated_idx" ON "saved_provider_groups" USING btree ("user_id","updated_at");