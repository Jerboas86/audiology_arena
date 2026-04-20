import { db } from '$lib/server/db';
import { getEloLeaderboards, type EloLeaderboardGroup } from '$lib/server/elo';
import type { PageServerLoad } from './$types';

const leaderboardGroups = [
	'org',
	'model',
	'voice'
] as const satisfies readonly EloLeaderboardGroup[];

export const load: PageServerLoad = async ({ parent, url }) => {
	const { selectedLanguage } = await parent();
	const groupParam = url.searchParams.get('group');

	const group = leaderboardGroups.includes(groupParam as EloLeaderboardGroup)
		? (groupParam as EloLeaderboardGroup)
		: 'org';

	const leaderboards = await getEloLeaderboards(db, selectedLanguage ?? undefined);

	return {
		group,
		language: selectedLanguage,
		leaderboards
	};
};
