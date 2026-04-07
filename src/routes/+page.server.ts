import { fail } from '@sveltejs/kit';
import { and, eq, isNotNull } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { audioSamples } from '$lib/server/db/schema';
import { buildAudioProxyUrl, resolveS3AudioUrl } from '$lib/server/audio';

import { recordComparison } from '$lib/server/elo';
import type { ComparisonInput } from '$lib/server/elo';
import type { Actions, PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async () => {
	try {
		const matchup = await pickMatchup();
		return { matchup, matchupError: false };
	} catch (error) {
		console.error('Failed to load matchup', error);
		return { matchup: null, matchupError: true };
	}
};

async function pickMatchup() {
	const rows = await db
		.select({
			token: audioSamples.token,
			listId: audioSamples.listId,
			language: audioSamples.language,
			orgSlug: audioSamples.orgSlug,
			modelName: audioSamples.modelName,
			voiceId: audioSamples.voiceId,
			audioUri: audioSamples.audioUri
		})
		.from(audioSamples)
		.where(and(eq(audioSamples.status, 'completed'), isNotNull(audioSamples.audioUri)));

	if (rows.length < 2) return null;

	// Group by (token, listId, language)
	const groups = new Map<string, typeof rows>();
	for (const row of rows) {
		const key = `${row.token}|${row.listId}|${row.language}`;
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key)!.push(row);
	}

	// Filter to groups with at least 2 distinct (org, model, voice) entries
	const eligible = [...groups.entries()].filter(([, jobs]) => {
		const unique = new Set(jobs.map((j) => `${j.orgSlug}|${j.modelName}|${j.voiceId}`));
		return unique.size >= 2;
	});

	if (eligible.length === 0) return null;

	// Pick a random group
	const [, jobs] = eligible[Math.floor(Math.random() * eligible.length)];

	// Deduplicate by (org, model, voice)
	const seen = new Set<string>();
	const uniqueJobs = jobs.filter((j) => {
		const key = `${j.orgSlug}|${j.modelName}|${j.voiceId}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});

	// Pick 2 random distinct entries
	const shuffled = uniqueJobs.sort(() => Math.random() - 0.5);
	const [a, b] = shuffled;

	const bucketName = env.S3_BUCKET_NAME;
	const region = env.PRIVATE_AWS_REGION;

	const resolveAudioUrl = (job: (typeof uniqueJobs)[number]) => {
		const proxyUrl = buildAudioProxyUrl(job.audioUri);
		if (proxyUrl) return proxyUrl;

		if (!bucketName || !region) {
			console.error('S3 bucket configuration is incomplete');
			return null;
		}

		return resolveS3AudioUrl(
			{
				language: job.language,
				orgSlug: job.orgSlug,
				modelName: job.modelName,
				voiceId: job.voiceId,
				token: job.token
			},
			{ bucketName, region }
		);
	};

	const [audioUrlA, audioUrlB] = await Promise.all([resolveAudioUrl(a), resolveAudioUrl(b)]);

	if (!audioUrlA || !audioUrlB) return null;

	return {
		token: a.token,
		listId: a.listId,
		language: a.language,
		sideA: {
			orgSlug: a.orgSlug,
			modelName: a.modelName,
			voiceId: a.voiceId,
			audioUrl: audioUrlA
		},
		sideB: {
			orgSlug: b.orgSlug,
			modelName: b.modelName,
			voiceId: b.voiceId,
			audioUrl: audioUrlB
		}
	};
}

export const actions: Actions = {
	vote: async ({ request }) => {
		const data = await request.formData();
		const winner = data.get('winner') as string;
		const token = data.get('token') as string;
		const listId = data.get('listId') as string;
		const language = data.get('language') as string;
		const orgSlugA = data.get('orgSlugA') as string;
		const modelNameA = data.get('modelNameA') as string;
		const voiceIdA = data.get('voiceIdA') as string;
		const orgSlugB = data.get('orgSlugB') as string;
		const modelNameB = data.get('modelNameB') as string;
		const voiceIdB = data.get('voiceIdB') as string;

		if (!winner || !['a', 'b'].includes(winner)) {
			return fail(400, { error: 'Invalid winner' });
		}
		if (!token || !listId || !language) {
			return fail(400, { error: 'Missing comparison data' });
		}

		const input: ComparisonInput = {
			token,
			listId,
			language: language as ComparisonInput['language'],
			sideA: { orgSlug: orgSlugA, modelName: modelNameA, voiceId: voiceIdA },
			sideB: { orgSlug: orgSlugB, modelName: modelNameB, voiceId: voiceIdB },
			winner: winner as 'a' | 'b'
		};

		const result = await recordComparison(db, input);
		return { success: true, comparisonId: result.comparisonId };
	}
};
