import { and, asc, desc, eq, sql } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import {
	comparisons,
	eloVoice,
	eloModel,
	eloOrg,
	eloHistory,
	langCodeEnum,
	models,
	organisations,
	voices
} from './db/schema';
import type * as schema from './db/schema';

const K = 32;
const DEFAULT_RATING = 1500;

export function expectedScore(ratingA: number, ratingB: number): number {
	return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export function newRating(rating: number, expected: number, actual: number, k: number = K): number {
	return Math.round(rating + k * (actual - expected));
}

export type ComparisonInput = {
	token: string;
	listId: string;
	language: (typeof langCodeEnum.enumValues)[number];
	sideA: { orgSlug: string; modelName: string; voiceId: string };
	sideB: { orgSlug: string; modelName: string; voiceId: string };
	winner: 'a' | 'b';
};

type DB = NeonHttpDatabase<typeof schema>;

export type EloLanguage = (typeof langCodeEnum.enumValues)[number];
export type EloLeaderboardGroup = 'org' | 'model' | 'voice';

export type EloOrgLeaderboardRow = {
	orgSlug: string;
	orgName: string;
	language: EloLanguage;
	rating: number;
	numComparisons: number;
	numWins: number;
	numLosses: number;
	updatedAt: Date;
};

export type EloModelLeaderboardRow = {
	orgSlug: string;
	orgName: string;
	modelName: string;
	language: EloLanguage;
	rating: number;
	numComparisons: number;
	numWins: number;
	numLosses: number;
	updatedAt: Date;
};

export type EloVoiceLeaderboardRow = {
	orgSlug: string;
	orgName: string;
	modelName: string;
	voiceId: string;
	voiceName: string;
	language: EloLanguage;
	rating: number;
	numComparisons: number;
	numWins: number;
	numLosses: number;
	updatedAt: Date;
};

export type EloLeaderboards = {
	orgs: EloOrgLeaderboardRow[];
	models: EloModelLeaderboardRow[];
	voices: EloVoiceLeaderboardRow[];
};

export async function recordComparison(db: DB, input: ComparisonInput) {
	const { sideA, sideB, winner, token, listId, language } = input;

	const winnerSide = winner === 'a' ? sideA : sideB;
	const loserSide = winner === 'a' ? sideB : sideA;

	// 1. Insert comparison
	const [comp] = await db
		.insert(comparisons)
		.values({
			token,
			listId,
			language,
			orgSlugA: sideA.orgSlug,
			modelNameA: sideA.modelName,
			voiceIdA: sideA.voiceId,
			orgSlugB: sideB.orgSlug,
			modelNameB: sideB.modelName,
			voiceIdB: sideB.voiceId,
			winnerOrgSlug: winnerSide.orgSlug,
			winnerModelName: winnerSide.modelName,
			winnerVoiceId: winnerSide.voiceId
		})
		.returning({ id: comparisons.id });

	const comparisonId = comp.id;
	const historyEntries: (typeof eloHistory.$inferInsert)[] = [];

	// 2. Update voice-level ELO
	const voiceRatings = await updateVoiceElo(db, winnerSide, loserSide, language);
	historyEntries.push(
		{
			level: 'voice',
			orgSlug: winnerSide.orgSlug,
			modelName: winnerSide.modelName,
			voiceId: winnerSide.voiceId,
			language,
			rating: voiceRatings.winnerRating,
			comparisonId
		},
		{
			level: 'voice',
			orgSlug: loserSide.orgSlug,
			modelName: loserSide.modelName,
			voiceId: loserSide.voiceId,
			language,
			rating: voiceRatings.loserRating,
			comparisonId
		}
	);

	// 3. Update model-level ELO (skip if same model)
	const sameModel = sideA.orgSlug === sideB.orgSlug && sideA.modelName === sideB.modelName;
	if (!sameModel) {
		const modelRatings = await updateModelElo(db, winnerSide, loserSide, language);
		historyEntries.push(
			{
				level: 'model',
				orgSlug: winnerSide.orgSlug,
				modelName: winnerSide.modelName,
				language,
				rating: modelRatings.winnerRating,
				comparisonId
			},
			{
				level: 'model',
				orgSlug: loserSide.orgSlug,
				modelName: loserSide.modelName,
				language,
				rating: modelRatings.loserRating,
				comparisonId
			}
		);
	}

	// 4. Update org-level ELO (skip if same org)
	const sameOrg = sideA.orgSlug === sideB.orgSlug;
	if (!sameOrg) {
		const orgRatings = await updateOrgElo(db, winnerSide, loserSide, language);
		historyEntries.push(
			{
				level: 'org',
				orgSlug: winnerSide.orgSlug,
				language,
				rating: orgRatings.winnerRating,
				comparisonId
			},
			{
				level: 'org',
				orgSlug: loserSide.orgSlug,
				language,
				rating: orgRatings.loserRating,
				comparisonId
			}
		);
	}

	// 5. Insert ELO history entries
	if (historyEntries.length > 0) {
		await db.insert(eloHistory).values(historyEntries);
	}

	return { comparisonId };
}

export async function getEloLeaderboards(db: DB, language?: EloLanguage): Promise<EloLeaderboards> {
	const orgBaseQuery = db
		.select({
			orgSlug: eloOrg.orgSlug,
			orgName: organisations.name,
			language: eloOrg.language,
			rating: eloOrg.rating,
			numComparisons: eloOrg.numComparisons,
			numWins: eloOrg.numWins,
			numLosses: eloOrg.numLosses,
			updatedAt: eloOrg.updatedAt
		})
		.from(eloOrg)
		.innerJoin(organisations, eq(organisations.slug, eloOrg.orgSlug));

	const modelBaseQuery = db
		.select({
			orgSlug: eloModel.orgSlug,
			orgName: organisations.name,
			modelName: eloModel.modelName,
			language: eloModel.language,
			rating: eloModel.rating,
			numComparisons: eloModel.numComparisons,
			numWins: eloModel.numWins,
			numLosses: eloModel.numLosses,
			updatedAt: eloModel.updatedAt
		})
		.from(eloModel)
		.innerJoin(organisations, eq(organisations.slug, eloModel.orgSlug))
		.innerJoin(
			models,
			and(eq(models.orgSlug, eloModel.orgSlug), eq(models.name, eloModel.modelName))
		);

	const voiceBaseQuery = db
		.select({
			orgSlug: eloVoice.orgSlug,
			orgName: organisations.name,
			modelName: eloVoice.modelName,
			voiceId: eloVoice.voiceId,
			voiceName: voices.voiceName,
			language: eloVoice.language,
			rating: eloVoice.rating,
			numComparisons: eloVoice.numComparisons,
			numWins: eloVoice.numWins,
			numLosses: eloVoice.numLosses,
			updatedAt: eloVoice.updatedAt
		})
		.from(eloVoice)
		.innerJoin(organisations, eq(organisations.slug, eloVoice.orgSlug))
		.innerJoin(voices, and(eq(voices.orgSlug, eloVoice.orgSlug), eq(voices.voiceId, eloVoice.voiceId)));

	const [orgs, modelsBoard, voicesBoard] = await Promise.all([
		(language ? orgBaseQuery.where(eq(eloOrg.language, language)) : orgBaseQuery).orderBy(
			desc(eloOrg.rating),
			desc(eloOrg.numComparisons),
			asc(organisations.name)
		),
		(language
			? modelBaseQuery.where(eq(eloModel.language, language))
			: modelBaseQuery
		).orderBy(
			desc(eloModel.rating),
			desc(eloModel.numComparisons),
			asc(organisations.name),
			asc(eloModel.modelName)
		),
		(language
			? voiceBaseQuery.where(eq(eloVoice.language, language))
			: voiceBaseQuery
		).orderBy(
			desc(eloVoice.rating),
			desc(eloVoice.numComparisons),
			asc(organisations.name),
			asc(eloVoice.modelName),
			asc(voices.voiceName)
		)
	]);

	return {
		orgs,
		models: modelsBoard,
		voices: voicesBoard
	};
}

async function updateVoiceElo(
	db: DB,
	winner: ComparisonInput['sideA'],
	loser: ComparisonInput['sideA'],
	language: ComparisonInput['language']
) {
	// Get current ratings
	const [winnerRow] = await db
		.select({ rating: eloVoice.rating })
		.from(eloVoice)
		.where(
			sql`${eloVoice.orgSlug} = ${winner.orgSlug} AND ${eloVoice.modelName} = ${winner.modelName} AND ${eloVoice.voiceId} = ${winner.voiceId} AND ${eloVoice.language} = ${language}`
		);
	const [loserRow] = await db
		.select({ rating: eloVoice.rating })
		.from(eloVoice)
		.where(
			sql`${eloVoice.orgSlug} = ${loser.orgSlug} AND ${eloVoice.modelName} = ${loser.modelName} AND ${eloVoice.voiceId} = ${loser.voiceId} AND ${eloVoice.language} = ${language}`
		);

	const winnerCurrent = winnerRow?.rating ?? DEFAULT_RATING;
	const loserCurrent = loserRow?.rating ?? DEFAULT_RATING;

	const expectedW = expectedScore(winnerCurrent, loserCurrent);
	const expectedL = expectedScore(loserCurrent, winnerCurrent);

	const winnerRating = newRating(winnerCurrent, expectedW, 1);
	const loserRating = newRating(loserCurrent, expectedL, 0);

	// Upsert winner
	await db
		.insert(eloVoice)
		.values({
			orgSlug: winner.orgSlug,
			modelName: winner.modelName,
			voiceId: winner.voiceId,
			language,
			rating: winnerRating,
			numComparisons: 1,
			numWins: 1,
			numLosses: 0
		})
		.onConflictDoUpdate({
			target: [eloVoice.orgSlug, eloVoice.modelName, eloVoice.voiceId, eloVoice.language],
			set: {
				rating: sql`${winnerRating}`,
				numComparisons: sql`${eloVoice.numComparisons} + 1`,
				numWins: sql`${eloVoice.numWins} + 1`,
				updatedAt: sql`now()`
			}
		});

	// Upsert loser
	await db
		.insert(eloVoice)
		.values({
			orgSlug: loser.orgSlug,
			modelName: loser.modelName,
			voiceId: loser.voiceId,
			language,
			rating: loserRating,
			numComparisons: 1,
			numWins: 0,
			numLosses: 1
		})
		.onConflictDoUpdate({
			target: [eloVoice.orgSlug, eloVoice.modelName, eloVoice.voiceId, eloVoice.language],
			set: {
				rating: sql`${loserRating}`,
				numComparisons: sql`${eloVoice.numComparisons} + 1`,
				numLosses: sql`${eloVoice.numLosses} + 1`,
				updatedAt: sql`now()`
			}
		});

	return { winnerRating, loserRating };
}

async function updateModelElo(
	db: DB,
	winner: ComparisonInput['sideA'],
	loser: ComparisonInput['sideA'],
	language: ComparisonInput['language']
) {
	const [winnerRow] = await db
		.select({ rating: eloModel.rating })
		.from(eloModel)
		.where(
			sql`${eloModel.orgSlug} = ${winner.orgSlug} AND ${eloModel.modelName} = ${winner.modelName} AND ${eloModel.language} = ${language}`
		);
	const [loserRow] = await db
		.select({ rating: eloModel.rating })
		.from(eloModel)
		.where(
			sql`${eloModel.orgSlug} = ${loser.orgSlug} AND ${eloModel.modelName} = ${loser.modelName} AND ${eloModel.language} = ${language}`
		);

	const winnerCurrent = winnerRow?.rating ?? DEFAULT_RATING;
	const loserCurrent = loserRow?.rating ?? DEFAULT_RATING;

	const expectedW = expectedScore(winnerCurrent, loserCurrent);
	const expectedL = expectedScore(loserCurrent, winnerCurrent);

	const winnerRating = newRating(winnerCurrent, expectedW, 1);
	const loserRating = newRating(loserCurrent, expectedL, 0);

	await db
		.insert(eloModel)
		.values({
			orgSlug: winner.orgSlug,
			modelName: winner.modelName,
			language,
			rating: winnerRating,
			numComparisons: 1,
			numWins: 1,
			numLosses: 0
		})
		.onConflictDoUpdate({
			target: [eloModel.orgSlug, eloModel.modelName, eloModel.language],
			set: {
				rating: sql`${winnerRating}`,
				numComparisons: sql`${eloModel.numComparisons} + 1`,
				numWins: sql`${eloModel.numWins} + 1`,
				updatedAt: sql`now()`
			}
		});

	await db
		.insert(eloModel)
		.values({
			orgSlug: loser.orgSlug,
			modelName: loser.modelName,
			language,
			rating: loserRating,
			numComparisons: 1,
			numWins: 0,
			numLosses: 1
		})
		.onConflictDoUpdate({
			target: [eloModel.orgSlug, eloModel.modelName, eloModel.language],
			set: {
				rating: sql`${loserRating}`,
				numComparisons: sql`${eloModel.numComparisons} + 1`,
				numLosses: sql`${eloModel.numLosses} + 1`,
				updatedAt: sql`now()`
			}
		});

	return { winnerRating, loserRating };
}

async function updateOrgElo(
	db: DB,
	winner: ComparisonInput['sideA'],
	loser: ComparisonInput['sideA'],
	language: ComparisonInput['language']
) {
	const [winnerRow] = await db
		.select({ rating: eloOrg.rating })
		.from(eloOrg)
		.where(sql`${eloOrg.orgSlug} = ${winner.orgSlug} AND ${eloOrg.language} = ${language}`);
	const [loserRow] = await db
		.select({ rating: eloOrg.rating })
		.from(eloOrg)
		.where(sql`${eloOrg.orgSlug} = ${loser.orgSlug} AND ${eloOrg.language} = ${language}`);

	const winnerCurrent = winnerRow?.rating ?? DEFAULT_RATING;
	const loserCurrent = loserRow?.rating ?? DEFAULT_RATING;

	const expectedW = expectedScore(winnerCurrent, loserCurrent);
	const expectedL = expectedScore(loserCurrent, winnerCurrent);

	const winnerRating = newRating(winnerCurrent, expectedW, 1);
	const loserRating = newRating(loserCurrent, expectedL, 0);

	await db
		.insert(eloOrg)
		.values({
			orgSlug: winner.orgSlug,
			language,
			rating: winnerRating,
			numComparisons: 1,
			numWins: 1,
			numLosses: 0
		})
		.onConflictDoUpdate({
			target: [eloOrg.orgSlug, eloOrg.language],
			set: {
				rating: sql`${winnerRating}`,
				numComparisons: sql`${eloOrg.numComparisons} + 1`,
				numWins: sql`${eloOrg.numWins} + 1`,
				updatedAt: sql`now()`
			}
		});

	await db
		.insert(eloOrg)
		.values({
			orgSlug: loser.orgSlug,
			language,
			rating: loserRating,
			numComparisons: 1,
			numWins: 0,
			numLosses: 1
		})
		.onConflictDoUpdate({
			target: [eloOrg.orgSlug, eloOrg.language],
			set: {
				rating: sql`${loserRating}`,
				numComparisons: sql`${eloOrg.numComparisons} + 1`,
				numLosses: sql`${eloOrg.numLosses} + 1`,
				updatedAt: sql`now()`
			}
		});

	return { winnerRating, loserRating };
}
