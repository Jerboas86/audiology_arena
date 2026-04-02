export type AudioLocation = {
	language: string;
	orgSlug: string;
	modelName: string;
	voiceId: string;
	token: string;
};

export type S3AudioConfig = {
	bucketName: string;
	region: string;
	extensions?: string[];
};

export type StoredS3Object = {
	bucketName: string;
	key: string;
};

export type ParseStoredS3AudioUriOptions = {
	bucketName?: string;
};

const DEFAULT_AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];

export function buildS3AudioKey(location: AudioLocation, extension: string): string {
	return [
		location.language,
		location.orgSlug,
		location.modelName,
		location.voiceId,
		`${location.token}.${extension}`
	]
		.map((segment) => encodeURIComponent(segment))
		.join('/');
}

export function buildS3AudioUrl(config: S3AudioConfig, key: string): string {
	return `https://${config.bucketName}.s3.${config.region}.amazonaws.com/${key}`;
}

function encodeS3KeySegment(segment: string): string {
	try {
		return encodeURIComponent(decodeURIComponent(segment));
	} catch {
		return encodeURIComponent(segment);
	}
}

function encodeS3ObjectKey(key: string): string {
	return key
		.split('/')
		.filter((segment) => segment.length > 0)
		.map(encodeS3KeySegment)
		.join('/');
}

export function parseStoredS3AudioUri(
	audioUri: string | null | undefined,
	options: ParseStoredS3AudioUriOptions = {}
): StoredS3Object | null {
	if (!audioUri) return null;

	const { bucketName } = options;

	const value = audioUri.trim();
	if (!value) return null;

	if (value.startsWith('s3://')) return null;
	if (!bucketName) return null;

	return {
		bucketName,
		key: value
	};
}

export function buildAudioProxyUrl(audioUri: string | null | undefined): string | null {
	if (!audioUri?.trim()) return null;
	return `/audio?uri=${encodeURIComponent(audioUri)}`;
}

export function encodeS3ObjectKeyForUrl(key: string): string {
	return encodeS3ObjectKey(key);
}

export async function resolveS3AudioUrl(
	location: AudioLocation,
	config: S3AudioConfig,
	fetchImpl: typeof fetch = fetch
): Promise<string | null> {
	const extensions = config.extensions?.length ? config.extensions : DEFAULT_AUDIO_EXTENSIONS;

	for (const extension of extensions) {
		const key = buildS3AudioKey(location, extension);
		const url = buildS3AudioUrl(config, key);

		try {
			const response = await fetchImpl(url, { method: 'HEAD' });
			if (response.ok) return url;
		} catch (error) {
			console.error('Failed to probe S3 audio object', { url, error });
		}
	}

	return null;
}
