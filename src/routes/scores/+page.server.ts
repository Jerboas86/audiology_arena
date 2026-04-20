import { db } from '$lib/server/db';
import { getEloLeaderboards, type EloLanguage, type EloLeaderboardGroup } from '$lib/server/elo';
import type { PageServerLoad } from './$types';

const leaderboardGroups = [
	'org',
	'model',
	'voice'
] as const satisfies readonly EloLeaderboardGroup[];

export const load: PageServerLoad = async ({ parent, url }) => {
	const { availableLanguages, selectedLanguage } = await parent();
	const groupParam = url.searchParams.get('group');
	const languageParam = url.searchParams.get('language');

	const group = leaderboardGroups.includes(groupParam as EloLeaderboardGroup)
		? (groupParam as EloLeaderboardGroup)
		: 'org';
	const language = availableLanguages.includes(languageParam as EloLanguage)
		? (languageParam as EloLanguage)
		: selectedLanguage;

	const leaderboards = await getEloLeaderboards(db, language ?? undefined);

	return {
		group,
		language,
		languages: availableLanguages,
		leaderboards
	};
};
