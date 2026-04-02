import { describe, expect, it, vi } from 'vitest';
import {
	buildAudioProxyUrl,
	buildS3AudioKey,
	buildS3AudioUrl,
	encodeS3ObjectKeyForUrl,
	parseStoredS3AudioUri,
	resolveS3AudioUrl
} from './audio';

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

		expect(url).toBe('https://bucket.s3.us-east-1.amazonaws.com/fr-FR/acme/demo/voice-a/salut.wav');
		expect(fetchImpl).toHaveBeenCalledTimes(2);
	});

	it('parses a stored s3 uri into bucket and key', () => {
		const object = parseStoredS3AudioUri('s3://audio-bucket/fr-FR/acme/demo/voice a/salut.wav', {
			bucketName: 'audio-bucket'
		});

		expect(object).toBeNull();
	});

	it('parses a stored object key with the configured bucket', () => {
		const object = parseStoredS3AudioUri('fr-FR/acme/demo/voice-a/salut.wav', {
			bucketName: 'bucket'
		});

		expect(object).toEqual({
			bucketName: 'bucket',
			key: 'fr-FR/acme/demo/voice-a/salut.wav'
		});
	});

	it('parses a bucket-relative object key with the configured bucket', () => {
		const object = parseStoredS3AudioUri(
			'fr-FR/samples/audio/62/aud_62308d6d77c714c068b2991e621820e3f8a334d9ec92abfc3ff2c065e4679c98.wav',
			{
				bucketName: 'transalp-tokens-bucket'
			}
		);

		expect(object).toEqual({
			bucketName: 'transalp-tokens-bucket',
			key: 'fr-FR/samples/audio/62/aud_62308d6d77c714c068b2991e621820e3f8a334d9ec92abfc3ff2c065e4679c98.wav'
		});
	});

	it('returns null for bucket-relative keys when the bucket is not configured', () => {
		const object = parseStoredS3AudioUri(
			'fr-FR/samples/audio/62/aud_62308d6d77c714c068b2991e621820e3f8a334d9ec92abfc3ff2c065e4679c98.wav'
		);

		expect(object).toBeNull();
	});

	it('builds an internal proxy URL for a stored s3 uri', () => {
		const url = buildAudioProxyUrl('fr-FR/acme/demo/voice-a/salut.wav');

		expect(url).toBe('/audio?uri=fr-FR%2Facme%2Fdemo%2Fvoice-a%2Fsalut.wav');
	});

	it('encodes S3 keys for browser-facing URLs', () => {
		expect(
			encodeS3ObjectKeyForUrl('fr-FR/aws/polly/Lea/Ainsi, cette comédie est en un acte..mp3')
		).toBe('fr-FR/aws/polly/Lea/Ainsi%2C%20cette%20com%C3%A9die%20est%20en%20un%20acte..mp3');
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
