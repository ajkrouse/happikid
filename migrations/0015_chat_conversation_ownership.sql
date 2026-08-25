ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "user_id" varchar;
--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conversations_user_created_idx" ON "conversations" USING btree ("user_id","created_at");