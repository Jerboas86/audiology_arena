import { db } from '$lib/server/db';
import { getEloLeaderboards, type EloLanguage, type EloLeaderboardGroup } from '$lib/server/elo';
import { langCodeEnum } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

const leaderboardGroups = [
	'org',
	'model',
	'voice'
] as const satisfies readonly EloLeaderboardGroup[];
const languages = langCodeEnum.enumValues;

export const load: PageServerLoad = async ({ url }) => {
	const groupParam = url.searchParams.get('group');
	const languageParam = url.searchParams.get('language');

	const group = leaderboardGroups.includes(groupParam as EloLeaderboardGroup)
		? (groupParam as EloLeaderboardGroup)
		: 'org';
	const language = languages.includes(languageParam as EloLanguage)
		? (languageParam as EloLanguage)
		: null;

	const leaderboards = await getEloLeaderboards(db, language ?? undefined);

	return {
		group,
		language,
		languages,
		leaderboards
	};
};
