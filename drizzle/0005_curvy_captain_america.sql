ALTER TABLE "aud"."word_lists" DROP CONSTRAINT "word_lists_list_name_list_number_key";--> statement-breakpoint
ALTER TABLE "aud"."word_lists" ADD COLUMN "language" "aud"."lang_code" NOT NULL;--> statement-breakpoint
ALTER TABLE "aud"."word_lists" ADD CONSTRAINT "word_lists_list_name_list_number_language_key" UNIQUE("list_name","list_number","language");