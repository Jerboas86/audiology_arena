import type { Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { cookieMaxAge, cookieName } from '$lib/paraglide/runtime';
import { contentLocaleForAudioLanguage } from '$lib/language';

function requestWithLocaleCookie(request: Request, locale: string) {
	const headers = new Headers(request.headers);
	const cookie = headers.get('cookie');
	const localeCookie = `${cookieName}=${locale}`;
	const existingCookies =
		cookie?.split('; ').filter((entry) => !entry.startsWith(`${cookieName}=`)) ?? [];

	headers.set('cookie', [localeCookie, ...existingCookies].join('; '));

	return new Request(request, { headers });
}

const handleParaglide: Handle = async ({ event, resolve }) => {
	const language = new URL(event.request.url).searchParams.get('language');
	const selectedLocale = language ? contentLocaleForAudioLanguage(language) : null;
	const request = selectedLocale
		? requestWithLocaleCookie(event.request, selectedLocale)
		: event.request;

	const response = await paraglideMiddleware(request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});
	});

	if (selectedLocale) {
		response.headers.append(
			'set-cookie',
			`${cookieName}=${selectedLocale}; Path=/; Max-Age=${cookieMaxAge}; SameSite=Lax`
		);
	}

	return response;
};

export const handle: Handle = handleParaglide;
