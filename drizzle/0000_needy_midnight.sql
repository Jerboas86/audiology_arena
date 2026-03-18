CREATE SCHEMA "aud";
--> statement-breakpoint
CREATE TYPE "aud"."lang_code" AS ENUM('fr-FR', 'en-US', 'en-GB', 'es-ES', 'de-DE', 'it-IT');--> statement-breakpoint
CREATE TABLE "aud"."tokens" (
	"token" text NOT NULL,
	"list_id" text NOT NULL,
	"language" "aud"."lang_code" NOT NULL,
	"homonyms" text[] DEFAULT '{}' NOT NULL,
	"definite_article" text DEFAULT '' NOT NULL,
	"indefinite_article" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tokens_pkey" PRIMARY KEY("token","list_id","language")
);
--> statement-breakpoint
CREATE TABLE "aud"."word_lists" (
	"list_id" text PRIMARY KEY NOT NULL,
	"list_name" varchar(100) NOT NULL,
	"list_type" varchar(100) NOT NULL,
	"list_number" integer NOT NULL,
	CONSTRAINT "word_lists_list_name_list_number_key" UNIQUE("list_name","list_number"),
	CONSTRAINT "list_name_is_lower_alpha" CHECK ("aud"."word_lists"."list_name" ~ '[a-z]+'),
	CONSTRAINT "list_type_is_lower_alpha" CHECK ("aud"."word_lists"."list_type" ~ '[a-z]+'),
	CONSTRAINT "non_negative_list_number" CHECK ("aud"."word_lists"."list_number" >= 0)
);
--> statement-breakpoint
ALTER TABLE "aud"."tokens" ADD CONSTRAINT "tokens_list_id_word_lists_list_id_fk" FOREIGN KEY ("list_id") REFERENCES "aud"."word_lists"("list_id") ON DELETE cascade ON UPDATE no action;