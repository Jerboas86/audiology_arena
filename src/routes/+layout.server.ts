import { getLocale } from '$lib/paraglide/runtime';
import {
	getAvailableAudioLanguages,
	resolveSelectedAudioLanguage,
	type AudioLanguage
} from '$lib/server/audio-languages';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url }) => {
	let availableLanguages: AudioLanguage[] = [];

	try {
		availableLanguages = await getAvailableAudioLanguages();
	} catch (error) {
		console.error('Failed to load audio languages', error);
	}

	const selectedLanguage = resolveSelectedAudioLanguage({
		availableLanguages,
		requestedLanguage: url.searchParams.get('language'),
		contentLocale: getLocale()
	});

	return {
		availableLanguages,
		selectedLanguage
	};
};
