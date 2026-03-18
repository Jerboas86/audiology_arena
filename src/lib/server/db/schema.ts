import {
	pgSchema,
	pgEnum,
	text,
	varchar,
	integer,
	timestamp,
	boolean,
	primaryKey,
	unique,
	check,
	foreignKey,
	index,
	uuid
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const audSchema = pgSchema('aud');

export const langCodeEnum = audSchema.enum('lang_code', [
	'fr-FR',
	'en-US',
	'en-GB',
	'es-ES',
	'de-DE',
	'it-IT'
]);

export const wordLists = audSchema.table(
	'word_lists',
	{
		listId: text('list_id').primaryKey(),
		listName: varchar('list_name', { length: 100 }).notNull(),
		listType: varchar('list_type', { length: 100 }).notNull(),
		listNumber: integer('list_number').notNull(),
		language: langCodeEnum('language').notNull()
	},
	(t) => [
		unique('word_lists_list_name_list_number_language_key').on(t.listName, t.listNumber, t.language),
		check('list_name_is_lower_alpha', sql`${t.listName} ~ '[a-z]+'`),
		check('list_type_is_lower_alpha', sql`${t.listType} ~ '[a-z]+'`),
		check('non_negative_list_number', sql`${t.listNumber} >= 0`)
	]
);

export const tokens = audSchema.table(
	'tokens',
	{
		token: text('token').notNull(),
		listId: text('list_id')
			.notNull()
			.references(() => wordLists.listId, { onDelete: 'cascade' }),
		language: langCodeEnum('language').notNull(),
		homonyms: text('homonyms').array().notNull().default(sql`'{}'`),
		definiteArticle: text('definite_article').notNull().default(''),
		indefiniteArticle: text('indefinite_article').notNull().default(''),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [primaryKey({ name: 'tokens_pkey', columns: [t.token, t.listId, t.language] })]
);

export const organisations = audSchema.table(
	'organisations',
	{
		slug: varchar('slug', { length: 100 }).primaryKey(),
		name: text('name').notNull(),
		isActive: boolean('is_active').notNull().default(true),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [check('slug_is_kebab', sql`${t.slug} ~ '^[a-z0-9-]+$'`)]
);

export const models = audSchema.table(
	'models',
	{
		orgSlug: varchar('org_slug', { length: 100 })
			.notNull()
			.references(() => organisations.slug, { onDelete: 'cascade' }),
		name: varchar('name', { length: 100 }).notNull(),
		isActive: boolean('is_active').notNull().default(true),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [primaryKey({ name: 'models_pkey', columns: [t.orgSlug, t.name] })]
);

export const voices = audSchema.table(
	'voices',
	{
		orgSlug: varchar('org_slug', { length: 100 })
			.notNull()
			.references(() => organisations.slug, { onDelete: 'cascade' }),
		voiceId: text('voice_id').notNull(),
		voiceName: text('voice_name').notNull(),
		isActive: boolean('is_active').notNull().default(true),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [primaryKey({ name: 'voices_pkey', columns: [t.orgSlug, t.voiceId] })]
);

export const modelVoices = audSchema.table(
	'model_voices',
	{
		orgSlug: varchar('org_slug', { length: 100 }).notNull(),
		modelName: varchar('model_name', { length: 100 }).notNull(),
		voiceId: text('voice_id').notNull()
	},
	(t) => [
		primaryKey({ name: 'model_voices_pkey', columns: [t.orgSlug, t.modelName, t.voiceId] }),
		foreignKey({
			name: 'model_voices_model_fkey',
			columns: [t.orgSlug, t.modelName],
			foreignColumns: [models.orgSlug, models.name]
		}).onDelete('cascade'),
		foreignKey({
			name: 'model_voices_voice_fkey',
			columns: [t.orgSlug, t.voiceId],
			foreignColumns: [voices.orgSlug, voices.voiceId]
		}).onDelete('cascade')
	]
);

export const comparisons = audSchema.table(
	'comparisons',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		token: text('token').notNull(),
		listId: text('list_id').notNull(),
		language: langCodeEnum('language').notNull(),
		orgSlugA: varchar('org_slug_a', { length: 100 }).notNull(),
		modelNameA: varchar('model_name_a', { length: 100 }).notNull(),
		voiceIdA: text('voice_id_a').notNull(),
		orgSlugB: varchar('org_slug_b', { length: 100 }).notNull(),
		modelNameB: varchar('model_name_b', { length: 100 }).notNull(),
		voiceIdB: text('voice_id_b').notNull(),
		winnerOrgSlug: varchar('winner_org_slug', { length: 100 }).notNull(),
		winnerModelName: varchar('winner_model_name', { length: 100 }).notNull(),
		winnerVoiceId: text('winner_voice_id').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [
		foreignKey({
			name: 'comparisons_side_a_fkey',
			columns: [t.orgSlugA, t.modelNameA, t.voiceIdA],
			foreignColumns: [modelVoices.orgSlug, modelVoices.modelName, modelVoices.voiceId]
		}).onDelete('cascade'),
		foreignKey({
			name: 'comparisons_side_b_fkey',
			columns: [t.orgSlugB, t.modelNameB, t.voiceIdB],
			foreignColumns: [modelVoices.orgSlug, modelVoices.modelName, modelVoices.voiceId]
		}).onDelete('cascade'),
		check(
			'winner_is_a_or_b',
			sql`(${t.winnerOrgSlug}, ${t.winnerModelName}, ${t.winnerVoiceId}) = (${t.orgSlugA}, ${t.modelNameA}, ${t.voiceIdA}) OR (${t.winnerOrgSlug}, ${t.winnerModelName}, ${t.winnerVoiceId}) = (${t.orgSlugB}, ${t.modelNameB}, ${t.voiceIdB})`
		),
		index('idx_comparisons_side_a').on(t.orgSlugA, t.modelNameA, t.voiceIdA),
		index('idx_comparisons_side_b').on(t.orgSlugB, t.modelNameB, t.voiceIdB),
		index('idx_comparisons_winner_org').on(t.winnerOrgSlug),
		index('idx_comparisons_winner_model').on(t.winnerOrgSlug, t.winnerModelName),
		index('idx_comparisons_winner_voice').on(t.winnerOrgSlug, t.winnerModelName, t.winnerVoiceId),
		index('idx_comparisons_created_at').on(t.createdAt)
	]
);

export const eloLevelEnum = audSchema.enum('elo_level', ['voice', 'model', 'org']);

export const eloVoice = audSchema.table(
	'elo_voice',
	{
		orgSlug: varchar('org_slug', { length: 100 }).notNull(),
		modelName: varchar('model_name', { length: 100 }).notNull(),
		voiceId: text('voice_id').notNull(),
		language: langCodeEnum('language').notNull(),
		rating: integer('rating').notNull().default(1500),
		numComparisons: integer('num_comparisons').notNull().default(0),
		numWins: integer('num_wins').notNull().default(0),
		numLosses: integer('num_losses').notNull().default(0),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [
		primaryKey({
			name: 'elo_voice_pkey',
			columns: [t.orgSlug, t.modelName, t.voiceId, t.language]
		}),
		foreignKey({
			name: 'elo_voice_model_voice_fkey',
			columns: [t.orgSlug, t.modelName, t.voiceId],
			foreignColumns: [modelVoices.orgSlug, modelVoices.modelName, modelVoices.voiceId]
		}).onDelete('cascade'),
		index('idx_elo_voice_rating').on(t.language, t.rating)
	]
);

export const eloModel = audSchema.table(
	'elo_model',
	{
		orgSlug: varchar('org_slug', { length: 100 }).notNull(),
		modelName: varchar('model_name', { length: 100 }).notNull(),
		language: langCodeEnum('language').notNull(),
		rating: integer('rating').notNull().default(1500),
		numComparisons: integer('num_comparisons').notNull().default(0),
		numWins: integer('num_wins').notNull().default(0),
		numLosses: integer('num_losses').notNull().default(0),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [
		primaryKey({
			name: 'elo_model_pkey',
			columns: [t.orgSlug, t.modelName, t.language]
		}),
		foreignKey({
			name: 'elo_model_model_fkey',
			columns: [t.orgSlug, t.modelName],
			foreignColumns: [models.orgSlug, models.name]
		}).onDelete('cascade'),
		index('idx_elo_model_rating').on(t.language, t.rating)
	]
);

export const eloOrg = audSchema.table(
	'elo_org',
	{
		orgSlug: varchar('org_slug', { length: 100 })
			.notNull()
			.references(() => organisations.slug, { onDelete: 'cascade' }),
		language: langCodeEnum('language').notNull(),
		rating: integer('rating').notNull().default(1500),
		numComparisons: integer('num_comparisons').notNull().default(0),
		numWins: integer('num_wins').notNull().default(0),
		numLosses: integer('num_losses').notNull().default(0),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [
		primaryKey({ name: 'elo_org_pkey', columns: [t.orgSlug, t.language] }),
		index('idx_elo_org_rating').on(t.language, t.rating)
	]
);

export const eloHistory = audSchema.table(
	'elo_history',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		level: eloLevelEnum('level').notNull(),
		orgSlug: varchar('org_slug', { length: 100 }).notNull(),
		modelName: varchar('model_name', { length: 100 }),
		voiceId: text('voice_id'),
		language: langCodeEnum('language').notNull(),
		rating: integer('rating').notNull(),
		comparisonId: uuid('comparison_id')
			.notNull()
			.references(() => comparisons.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [
		index('idx_elo_history_entity').on(t.level, t.orgSlug, t.modelName, t.voiceId, t.language),
		index('idx_elo_history_comparison').on(t.comparisonId),
		index('idx_elo_history_created_at').on(t.createdAt)
	]
);

export const ttsJobs = audSchema.table(
	'tts_jobs',
	{
		token: text('token').notNull(),
		listId: text('list_id').notNull(),
		language: langCodeEnum('language').notNull(),
		orgSlug: varchar('org_slug', { length: 100 }).notNull(),
		modelName: varchar('model_name', { length: 100 }).notNull(),
		voiceId: text('voice_id').notNull(),
		status: varchar('status', { length: 20 }).notNull().default('pending'),
		s3Uri: text('s3_uri'),
		fileSizeBytes: integer('file_size_bytes'),
		errorMessage: text('error_message'),
		retryCount: integer('retry_count').notNull().default(0),
		processedAt: timestamp('processed_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [
		primaryKey({
			name: 'tts_jobs_pkey',
			columns: [t.token, t.listId, t.language, t.orgSlug, t.modelName, t.voiceId]
		}),
		foreignKey({
			name: 'tts_jobs_tokens_fkey',
			columns: [t.token, t.listId, t.language],
			foreignColumns: [tokens.token, tokens.listId, tokens.language]
		}).onDelete('cascade'),
		foreignKey({
			name: 'tts_jobs_model_voice_fkey',
			columns: [t.orgSlug, t.modelName, t.voiceId],
			foreignColumns: [modelVoices.orgSlug, modelVoices.modelName, modelVoices.voiceId]
		}).onDelete('cascade'),
		index('idx_tts_jobs_status').on(t.status),
		index('idx_tts_jobs_language').on(t.language),
		index('idx_tts_jobs_created_at').on(t.createdAt),
		index('idx_tts_jobs_model_voice').on(t.orgSlug, t.modelName, t.voiceId)
	]
);
