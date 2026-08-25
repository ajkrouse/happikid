CREATE TABLE "notification_outbox" (
  "id" serial PRIMARY KEY NOT NULL,
  "event_type" varchar(64) NOT NULL,
  "payload" jsonb NOT NULL,
  "idempotency_key" varchar(200) NOT NULL,
  "status" varchar NOT NULL DEFAULT 'pending',
  "attempts" integer NOT NULL DEFAULT 0,
  "available_at" timestamp NOT NULL DEFAULT now(),
  "locked_at" timestamp,
  "locked_by" varchar(128),
  "delivered_at" timestamp,
  "last_error" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "notification_outbox_idempotency_key_unique" UNIQUE("idempotency_key"),
  CONSTRAINT "notification_outbox_status_check" CHECK ("status" IN ('pending', 'processing', 'delivered', 'failed')),
  CONSTRAINT "notification_outbox_attempts_check" CHECK ("attempts" >= 0)
);
--> statement-breakpoint
CREATE INDEX "notification_outbox_due_idx" ON "notification_outbox" USING btree ("status", "available_at");
--> statement-breakpoint
CREATE INDEX "notification_outbox_lease_idx" ON "notification_outbox" USING btree ("status", "locked_at");