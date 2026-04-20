import { and, asc, eq, isNotNull } from 'drizzle-orm';
import { audioSamples, langCodeEnum } from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { contentLocaleForAudioLanguage, type ContentLocale } from '$lib/language';

export type AudioLanguage = (typeof langCodeEnum.enumValues)[number];

export async function getAvailableAudioLanguages(database = db) {
	const rows = await database
		.selectDistinct({ language: audioSamples.language })
		.from(audioSamples)
		.where(and(eq(audioSamples.status, 'completed'), isNotNull(audioSamples.audioUri)))
		.orderBy(asc(audioSamples.language));

	return rows.map((row) => row.language);
}

export function resolveSelectedAudioLanguage({
	availableLanguages,
	requestedLanguage,
	contentLocale
}: {
	availableLanguages: readonly AudioLanguage[];
	requestedLanguage: string | null;
	contentLocale: ContentLocale;
}) {
	if (
		requestedLanguage &&
		availableLanguages.includes(requestedLanguage as AudioLanguage)
	) {
		return requestedLanguage as AudioLanguage;
	}

	return (
		availableLanguages.find(
			(language) => contentLocaleForAudioLanguage(language) === contentLocale
		) ??
		availableLanguages[0] ??
		null
	);
}
