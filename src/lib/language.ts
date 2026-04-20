import { baseLocale, locales } from '$lib/paraglide/runtime';

export type ContentLocale = (typeof locales)[number];

export function contentLocaleForAudioLanguage(language: string | null | undefined) {
	const primaryLanguage = language?.split('-')[0];

	return locales.includes(primaryLanguage as ContentLocale)
		? (primaryLanguage as ContentLocale)
		: baseLocale;
}

export function audioLanguageLabel(language: string, displayLocale: ContentLocale) {
	const [languageCode, regionCode] = language.split('-');

	try {
		const languageNames = new Intl.DisplayNames([displayLocale], { type: 'language' });
		const regionNames = new Intl.DisplayNames([displayLocale], { type: 'region' });
		const languageName = languageNames.of(languageCode);
		const regionName = regionCode ? regionNames.of(regionCode) : null;

		return regionName ? `${languageName} (${regionName})` : (languageName ?? language);
	} catch {
		return language;
	}
}

export function audioLanguageFlag(language: string) {
	const regionCode = language.split('-')[1]?.toUpperCase();

	if (!regionCode || !/^[A-Z]{2}$/.test(regionCode)) {
		return language;
	}

	return String.fromCodePoint(
		...regionCode.split('').map((letter) => 0x1f1e6 + letter.charCodeAt(0) - 65)
	);
}
