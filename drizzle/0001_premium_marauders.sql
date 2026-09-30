CREATE TABLE "upload_intent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"key" text NOT NULL,
	"purpose" text NOT NULL,
	"size" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"confirmed_at" timestamp,
	CONSTRAINT "upload_intent_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "upload_intent" ADD CONSTRAINT "upload_intent_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "upload_intent_user_created_idx" ON "upload_intent" USING btree ("user_id","created_at");