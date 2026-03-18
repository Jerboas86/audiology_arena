CREATE TABLE "aud"."comparisons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"list_id" text NOT NULL,
	"language" "aud"."lang_code" NOT NULL,
	"org_slug_a" varchar(100) NOT NULL,
	"model_name_a" varchar(100) NOT NULL,
	"voice_id_a" text NOT NULL,
	"org_slug_b" varchar(100) NOT NULL,
	"model_name_b" varchar(100) NOT NULL,
	"voice_id_b" text NOT NULL,
	"winner_org_slug" varchar(100) NOT NULL,
	"winner_model_name" varchar(100) NOT NULL,
	"winner_voice_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "winner_is_a_or_b" CHECK (("aud"."comparisons"."winner_org_slug", "aud"."comparisons"."winner_model_name", "aud"."comparisons"."winner_voice_id") = ("aud"."comparisons"."org_slug_a", "aud"."comparisons"."model_name_a", "aud"."comparisons"."voice_id_a") OR ("aud"."comparisons"."winner_org_slug", "aud"."comparisons"."winner_model_name", "aud"."comparisons"."winner_voice_id") = ("aud"."comparisons"."org_slug_b", "aud"."comparisons"."model_name_b", "aud"."comparisons"."voice_id_b"))
);
--> statement-breakpoint
ALTER TABLE "aud"."comparisons" ADD CONSTRAINT "comparisons_side_a_fkey" FOREIGN KEY ("org_slug_a","model_name_a","voice_id_a") REFERENCES "aud"."model_voices"("org_slug","model_name","voice_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aud"."comparisons" ADD CONSTRAINT "comparisons_side_b_fkey" FOREIGN KEY ("org_slug_b","model_name_b","voice_id_b") REFERENCES "aud"."model_voices"("org_slug","model_name","voice_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_comparisons_side_a" ON "aud"."comparisons" USING btree ("org_slug_a","model_name_a","voice_id_a");--> statement-breakpoint
CREATE INDEX "idx_comparisons_side_b" ON "aud"."comparisons" USING btree ("org_slug_b","model_name_b","voice_id_b");--> statement-breakpoint
CREATE INDEX "idx_comparisons_winner_org" ON "aud"."comparisons" USING btree ("winner_org_slug");--> statement-breakpoint
CREATE INDEX "idx_comparisons_winner_model" ON "aud"."comparisons" USING btree ("winner_org_slug","winner_model_name");--> statement-breakpoint
CREATE INDEX "idx_comparisons_winner_voice" ON "aud"."comparisons" USING btree ("winner_org_slug","winner_model_name","winner_voice_id");--> statement-breakpoint
CREATE INDEX "idx_comparisons_created_at" ON "aud"."comparisons" USING btree ("created_at");