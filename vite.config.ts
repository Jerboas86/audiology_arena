import { paraglideVitePlugin } from '@inlang/paraglide-js';
import devtoolsJson from 'vite-plugin-devtools-json';
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

const ignoredProjectPaths = ['**/.pnpm-store/**'];

export default defineConfig({
	plugins: [
		sveltekit(),
		devtoolsJson(),
		paraglideVitePlugin({ project: './project.inlang', outdir: './src/lib/paraglide' })
	],
	server: {
		watch: {
			ignored: ignoredProjectPaths
		}
	},
	test: {
		expect: { requireAssertions: true },
		exclude: ignoredProjectPaths,
		environment: 'node',
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
