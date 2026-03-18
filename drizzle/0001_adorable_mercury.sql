CREATE TABLE "aud"."model_voices" (
	"org_slug" varchar(100) NOT NULL,
	"model_name" varchar(100) NOT NULL,
	"voice_id" text NOT NULL,
	CONSTRAINT "model_voices_pkey" PRIMARY KEY("org_slug","model_name","voice_id")
);
--> statement-breakpoint
CREATE TABLE "aud"."models" (
	"org_slug" varchar(100) NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "models_pkey" PRIMARY KEY("org_slug","name")
);
--> statement-breakpoint
CREATE TABLE "aud"."organisations" (
	"slug" varchar(100) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "slug_is_kebab" CHECK ("aud"."organisations"."slug" ~ '^[a-z0-9-]+$')
);
--> statement-breakpoint
CREATE TABLE "aud"."voices" (
	"org_slug" varchar(100) NOT NULL,
	"voice_id" text NOT NULL,
	"voice_name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "voices_pkey" PRIMARY KEY("org_slug","voice_id")
);
--> statement-breakpoint
ALTER TABLE "aud"."model_voices" ADD CONSTRAINT "model_voices_model_fkey" FOREIGN KEY ("org_slug","model_name") REFERENCES "aud"."models"("org_slug","name") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aud"."model_voices" ADD CONSTRAINT "model_voices_voice_fkey" FOREIGN KEY ("org_slug","voice_id") REFERENCES "aud"."voices"("org_slug","voice_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aud"."models" ADD CONSTRAINT "models_org_slug_organisations_slug_fk" FOREIGN KEY ("org_slug") REFERENCES "aud"."organisations"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aud"."voices" ADD CONSTRAINT "voices_org_slug_organisations_slug_fk" FOREIGN KEY ("org_slug") REFERENCES "aud"."organisations"("slug") ON DELETE cascade ON UPDATE no action;