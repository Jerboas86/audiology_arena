CREATE TABLE "aud"."voice_languages" (
	"org_slug" varchar(100) NOT NULL,
	"voice_id" text NOT NULL,
	"language" "aud"."lang_code" NOT NULL,
	CONSTRAINT "voice_languages_pkey" PRIMARY KEY("org_slug","voice_id","language")
);
--> statement-breakpoint
ALTER TABLE "aud"."voice_languages" ADD CONSTRAINT "voice_languages_voice_fkey" FOREIGN KEY ("org_slug","voice_id") REFERENCES "aud"."voices"("org_slug","voice_id") ON DELETE cascade ON UPDATE no action;