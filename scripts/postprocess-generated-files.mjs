import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

const workerTypesPath = path.join(root, 'worker-configuration.d.ts');
const paraglideDir = path.join(root, 'src/lib/paraglide');

const workerImportPattern =
	/mainModule:\s*typeof import\((['"])\.\/\.svelte-kit\/cloudflare\/_worker\1\);/;

async function maybeRewriteWorkerTypes() {
	let source;

	try {
		source = await readFile(workerTypesPath, 'utf8');
	} catch {
		return;
	}

	const updated = source.replace(workerImportPattern, 'mainModule: unknown;');

	if (updated !== source) {
		await writeFile(workerTypesPath, updated);
	}
}

async function walk(dir, matcher, files = []) {
	let entries;

	try {
		entries = await readdir(dir);
	} catch {
		return files;
	}

	for (const entry of entries) {
		const fullPath = path.join(dir, entry);
		const entryStat = await stat(fullPath);

		if (entryStat.isDirectory()) {
			await walk(fullPath, matcher, files);
			continue;
		}

		if (matcher(fullPath)) {
			files.push(fullPath);
		}
	}

	return files;
}

async function addTsNoCheckToGeneratedJs() {
	const files = await walk(paraglideDir, (file) => file.endsWith('.js'));

	await Promise.all(
		files.map(async (file) => {
			const source = await readFile(file, 'utf8');

			if (source.startsWith('// @ts-nocheck\n') || source.startsWith('// @ts-nocheck\r\n')) {
				return;
			}

			await writeFile(file, `// @ts-nocheck\n${source}`);
		})
	);
}

await maybeRewriteWorkerTypes();
await addTsNoCheckToGeneratedJs();
