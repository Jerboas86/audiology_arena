ALTER TABLE "aud"."tts_jobs" RENAME COLUMN "provider" TO "org_slug";--> statement-breakpoint
DROP INDEX "aud"."idx_tts_jobs_provider_voice";--> statement-breakpoint
ALTER TABLE "aud"."tts_jobs" ALTER COLUMN "voice_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "aud"."tts_jobs" ADD COLUMN "model_name" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "aud"."tts_jobs" ADD CONSTRAINT "tts_jobs_model_voice_fkey" FOREIGN KEY ("org_slug","model_name","voice_id") REFERENCES "aud"."model_voices"("org_slug","model_name","voice_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_tts_jobs_model_voice" ON "aud"."tts_jobs" USING btree ("org_slug","model_name","voice_id");--> statement-breakpoint
ALTER TABLE "aud"."tts_jobs" DROP CONSTRAINT "tts_jobs_pkey";
--> statement-breakpoint
ALTER TABLE "aud"."tts_jobs" ADD CONSTRAINT "tts_jobs_pkey" PRIMARY KEY("token","list_id","language","org_slug","model_name","voice_id");