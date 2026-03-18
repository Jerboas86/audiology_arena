CREATE TABLE "aud"."tts_jobs" (
	"token" text NOT NULL,
	"list_id" text NOT NULL,
	"language" "aud"."lang_code" NOT NULL,
	"provider" varchar(50) NOT NULL,
	"voice_id" varchar(100) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"s3_uri" text,
	"file_size_bytes" integer,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tts_jobs_pkey" PRIMARY KEY("token","list_id","language","provider","voice_id")
);
--> statement-breakpoint
ALTER TABLE "aud"."tts_jobs" ADD CONSTRAINT "tts_jobs_tokens_fkey" FOREIGN KEY ("token","list_id","language") REFERENCES "aud"."tokens"("token","list_id","language") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_tts_jobs_status" ON "aud"."tts_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_tts_jobs_language" ON "aud"."tts_jobs" USING btree ("language");--> statement-breakpoint
CREATE INDEX "idx_tts_jobs_created_at" ON "aud"."tts_jobs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_tts_jobs_provider_voice" ON "aud"."tts_jobs" USING btree ("provider","voice_id");