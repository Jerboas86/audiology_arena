import { expect, test } from '@playwright/test';

type AudioProbeResult = {
	src: string | null;
	currentSrc: string;
	readyState: number;
	networkState: number;
	errorCode: number | null;
	event: 'loadedmetadata' | 'canplay' | 'error' | 'timeout';
};

async function probeAudio(page: Parameters<typeof test>[0]['page'], index: number) {
	return page.locator('audio').nth(index).evaluate(async (node) => {
		const audio = node as HTMLAudioElement;

		const snapshot = (event: AudioProbeResult['event']): AudioProbeResult => ({
			src: audio.getAttribute('src'),
			currentSrc: audio.currentSrc,
			readyState: audio.readyState,
			networkState: audio.networkState,
			errorCode: audio.error?.code ?? null,
			event
		});

		if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
			return snapshot('loadedmetadata');
		}

		audio.load();

		return await new Promise<AudioProbeResult>((resolve) => {
			const onLoadedMetadata = () => done(snapshot('loadedmetadata'));
			const onCanPlay = () => done(snapshot('canplay'));
			const onError = () => done(snapshot('error'));
			const timeout = window.setTimeout(() => done(snapshot('timeout')), 10_000);

			function done(result: AudioProbeResult) {
				audio.removeEventListener('loadedmetadata', onLoadedMetadata);
				audio.removeEventListener('canplay', onCanPlay);
				audio.removeEventListener('error', onError);
				window.clearTimeout(timeout);
				resolve(result);
			}

			audio.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
			audio.addEventListener('canplay', onCanPlay, { once: true });
			audio.addEventListener('error', onError, { once: true });
		});
	});
}

test('home page exposes loadable audio sources for both players', async ({ page }) => {
	await page.goto('/');

	await expect(page.getByText('Audio unavailable')).toHaveCount(0);
	await expect(page.locator('audio')).toHaveCount(2);

	for (const index of [0, 1]) {
		const src = await page.locator('audio').nth(index).evaluate((node) => {
			const audio = node as HTMLAudioElement;
			return audio.currentSrc || audio.src || audio.getAttribute('src');
		});

		expect(src).toBeTruthy();
		expect(src).toMatch(/^https?:\/\//);

		const response = await page.request.get(src!, {
			headers: {
				range: 'bytes=0-1023'
			}
		});

		if (!response.ok()) {
			throw new Error(
				`Audio request failed for index ${index}: ${response.status()} ${await response.text()}`
			);
		}

		const contentType = response.headers()['content-type'] ?? '';
		expect(contentType).toMatch(/^audio\/|application\/octet-stream/);
		expect((await response.body()).byteLength).toBeGreaterThan(0);

		const result = await probeAudio(page, index);

		expect(result.src).toBeTruthy();
		expect(result.currentSrc).toBe(src);
		expect(result.errorCode).toBeNull();
		expect(result.event).toMatch(/loadedmetadata|canplay/);
		expect(result.readyState).toBeGreaterThan(0);
	}
});
