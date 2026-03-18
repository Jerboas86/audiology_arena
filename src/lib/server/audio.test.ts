import { describe, expect, it, vi } from 'vitest';
import { buildS3AudioKey, buildS3AudioUrl, resolveS3AudioUrl } from './audio';

describe('audio helpers', () => {
	it('builds the S3 key from the expected bucket layout', () => {
		const key = buildS3AudioKey(
			{
				language: 'en-US',
				orgSlug: 'open-ai',
				modelName: 'gpt voice',
				voiceId: 'alloy/v2',
				token: 'bonjour'
			},
			'mp3'
		);

		expect(key).toBe('en-US/open-ai/gpt%20voice/alloy%2Fv2/bonjour.mp3');
	});

	it('builds the public S3 object URL', () => {
		const url = buildS3AudioUrl(
			{
				bucketName: 'transalp-tokens-bucket-092594542793-us-east-1-an',
				region: 'us-east-1'
			},
			'en-US/open-ai/model/voice/bonjour.mp3'
		);

		expect(url).toBe(
			'https://transalp-tokens-bucket-092594542793-us-east-1-an.s3.us-east-1.amazonaws.com/en-US/open-ai/model/voice/bonjour.mp3'
		);
	});

	it('returns the first object URL that exists', async () => {
		const fetchImpl = vi.fn<typeof fetch>(async (input) => {
			const url = String(input);
			const status = url.endsWith('.wav') ? 200 : 404;
			return new Response(null, { status });
		});

		const url = await resolveS3AudioUrl(
			{
				language: 'fr-FR',
				orgSlug: 'acme',
				modelName: 'demo',
				voiceId: 'voice-a',
				token: 'salut'
			},
			{
				bucketName: 'bucket',
				region: 'us-east-1',
				extensions: ['mp3', 'wav']
			},
			fetchImpl
		);

		expect(url).toBe(
			'https://bucket.s3.us-east-1.amazonaws.com/fr-FR/acme/demo/voice-a/salut.wav'
		);
		expect(fetchImpl).toHaveBeenCalledTimes(2);
	});

	it('returns null when no object matches', async () => {
		const fetchImpl = vi.fn<typeof fetch>(async () => new Response(null, { status: 404 }));

		const url = await resolveS3AudioUrl(
			{
				language: 'fr-FR',
				orgSlug: 'acme',
				modelName: 'demo',
				voiceId: 'voice-a',
				token: 'salut'
			},
			{
				bucketName: 'bucket',
				region: 'us-east-1',
				extensions: ['mp3']
			},
			fetchImpl
		);

		expect(url).toBeNull();
		expect(fetchImpl).toHaveBeenCalledOnce();
	});
});
