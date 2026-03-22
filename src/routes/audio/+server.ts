import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Readable } from 'node:stream';
import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import { parseStoredS3AudioUri } from '$lib/server/audio';
import type { RequestHandler } from './$types';

let s3Client: S3Client | null = null;

const AUDIO_CONTENT_TYPES: Record<string, string> = {
	mp3: 'audio/mpeg',
	wav: 'audio/wav',
	ogg: 'audio/ogg',
	m4a: 'audio/mp4',
	aac: 'audio/aac',
	flac: 'audio/flac'
};

function getS3Client(region: string) {
	if (!s3Client) {
		const accessKeyId = env.PRIVATE_AWS_ACCESS_KEY_ID;
		const secretAccessKey = env.PRIVATE_AWS_SECRET_ACCESS_KEY;

		s3Client = new S3Client({
			region,
			credentials:
				accessKeyId && secretAccessKey
					? {
							accessKeyId,
							secretAccessKey
						}
					: undefined
		});
	}

	return s3Client;
}

function toWebStream(body: unknown): ReadableStream {
	if (body && typeof body === 'object' && 'transformToWebStream' in body) {
		return (body as { transformToWebStream(): ReadableStream }).transformToWebStream();
	}

	if (body instanceof Readable) {
		return Readable.toWeb(body) as ReadableStream;
	}

	throw new TypeError('Unsupported S3 response body');
}

function setHeaderIfPresent(headers: Headers, name: string, value: string | number | undefined) {
	if (value === undefined) return;
	headers.set(name, String(value));
}

function resolveContentType(key: string, contentType: string | undefined) {
	if (contentType && !['application/octet-stream', 'binary/octet-stream'].includes(contentType)) {
		return contentType;
	}

	const extension = key.split('.').pop()?.toLowerCase();
	return (extension && AUDIO_CONTENT_TYPES[extension]) || 'application/octet-stream';
}

export const GET: RequestHandler = async ({ request, url }) => {
	const region = env.PRIVATE_AWS_REGION;
	if (!region) {
		throw error(500, 'AWS region is not configured');
	}

	const s3Uri = url.searchParams.get('uri');
	const object = parseStoredS3AudioUri(s3Uri, env.S3_BUCKET_NAME);

	if (!object) {
		throw error(400, 'Invalid S3 URI');
	}

	let response;
	try {
		response = await getS3Client(region).send(
			new GetObjectCommand({
				Bucket: object.bucketName,
				Key: object.key,
				Range: request.headers.get('range') ?? undefined
			})
		);
	} catch (err) {
		const s3Error = err as {
			name?: string;
			message?: string;
			$metadata?: { httpStatusCode?: number };
		};
		const statusCode = s3Error.$metadata?.httpStatusCode;
		if (statusCode === 404) {
			throw error(404, 'Audio object not found');
		}
		console.error('S3 GetObject failed', {
			bucket: object.bucketName,
			key: object.key,
			error: err
		});
		throw error(
			502,
			`S3 error: ${s3Error.name}: ${s3Error.message} (HTTP ${statusCode ?? 'unknown'})`
		);
	}

	if (!response.Body) {
		throw error(404, 'Audio object not found');
	}

	const headers = new Headers();
	setHeaderIfPresent(headers, 'content-type', resolveContentType(object.key, response.ContentType));
	setHeaderIfPresent(headers, 'content-length', response.ContentLength);
	setHeaderIfPresent(headers, 'accept-ranges', response.AcceptRanges ?? 'bytes');
	setHeaderIfPresent(headers, 'content-range', response.ContentRange);
	setHeaderIfPresent(headers, 'etag', response.ETag);
	setHeaderIfPresent(headers, 'last-modified', response.LastModified?.toUTCString());
	headers.set('cache-control', 'public, max-age=300');

	return new Response(toWebStream(response.Body), {
		status: response.$metadata.httpStatusCode ?? 200,
		headers
	});
};
