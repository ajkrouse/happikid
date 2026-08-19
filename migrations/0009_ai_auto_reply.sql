ALTER TABLE "providers" ADD COLUMN "ai_auto_reply_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "ai_draft_body" text;--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "ai_draft_message_id" integer;