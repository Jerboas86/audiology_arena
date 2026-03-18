CREATE TYPE "aud"."elo_level" AS ENUM('voice', 'model', 'org');--> statement-breakpoint
CREATE TABLE "aud"."elo_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"level" "aud"."elo_level" NOT NULL,
	"org_slug" varchar(100) NOT NULL,
	"model_name" varchar(100),
	"voice_id" text,
	"language" "aud"."lang_code" NOT NULL,
	"rating" integer NOT NULL,
	"comparison_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "aud"."elo_model" (
	"org_slug" varchar(100) NOT NULL,
	"model_name" varchar(100) NOT NULL,
	"language" "aud"."lang_code" NOT NULL,
	"rating" integer DEFAULT 1500 NOT NULL,
	"num_comparisons" integer DEFAULT 0 NOT NULL,
	"num_wins" integer DEFAULT 0 NOT NULL,
	"num_losses" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "elo_model_pkey" PRIMARY KEY("org_slug","model_name","language")
);
--> statement-breakpoint
CREATE TABLE "aud"."elo_org" (
	"org_slug" varchar(100) NOT NULL,
	"language" "aud"."lang_code" NOT NULL,
	"rating" integer DEFAULT 1500 NOT NULL,
	"num_comparisons" integer DEFAULT 0 NOT NULL,
	"num_wins" integer DEFAULT 0 NOT NULL,
	"num_losses" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "elo_org_pkey" PRIMARY KEY("org_slug","language")
);
--> statement-breakpoint
CREATE TABLE "aud"."elo_voice" (
	"org_slug" varchar(100) NOT NULL,
	"model_name" varchar(100) NOT NULL,
	"voice_id" text NOT NULL,
	"language" "aud"."lang_code" NOT NULL,
	"rating" integer DEFAULT 1500 NOT NULL,
	"num_comparisons" integer DEFAULT 0 NOT NULL,
	"num_wins" integer DEFAULT 0 NOT NULL,
	"num_losses" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "elo_voice_pkey" PRIMARY KEY("org_slug","model_name","voice_id","language")
);
--> statement-breakpoint
ALTER TABLE "aud"."elo_history" ADD CONSTRAINT "elo_history_comparison_id_comparisons_id_fk" FOREIGN KEY ("comparison_id") REFERENCES "aud"."comparisons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aud"."elo_model" ADD CONSTRAINT "elo_model_model_fkey" FOREIGN KEY ("org_slug","model_name") REFERENCES "aud"."models"("org_slug","name") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aud"."elo_org" ADD CONSTRAINT "elo_org_org_slug_organisations_slug_fk" FOREIGN KEY ("org_slug") REFERENCES "aud"."organisations"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aud"."elo_voice" ADD CONSTRAINT "elo_voice_model_voice_fkey" FOREIGN KEY ("org_slug","model_name","voice_id") REFERENCES "aud"."model_voices"("org_slug","model_name","voice_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_elo_history_entity" ON "aud"."elo_history" USING btree ("level","org_slug","model_name","voice_id","language");--> statement-breakpoint
CREATE INDEX "idx_elo_history_comparison" ON "aud"."elo_history" USING btree ("comparison_id");--> statement-breakpoint
CREATE INDEX "idx_elo_history_created_at" ON "aud"."elo_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_elo_model_rating" ON "aud"."elo_model" USING btree ("language","rating");--> statement-breakpoint
CREATE INDEX "idx_elo_org_rating" ON "aud"."elo_org" USING btree ("language","rating");--> statement-breakpoint
CREATE INDEX "idx_elo_voice_rating" ON "aud"."elo_voice" USING btree ("language","rating");