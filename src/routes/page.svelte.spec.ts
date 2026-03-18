import { page } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { setLocale } from '$lib/paraglide/runtime';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	afterEach(() => {
		setLocale('fr', { reload: false });
	});

	it('renders the English version and keeps voting disabled initially', async () => {
		setLocale('en', { reload: false });
		render(Page);

		await expect.element(page.getByText('Le bouchon')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Vote for A' })).toBeDisabled();
		await expect.element(page.getByRole('button', { name: 'Vote for B' })).toBeDisabled();
	});

	it('renders the French version when the locale is fr', async () => {
		setLocale('fr', { reload: false });
		render(Page);

		await expect.element(page.getByText('Manche en cours')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Voter pour A' })).toBeDisabled();
		await expect.element(page.getByRole('button', { name: 'Voter pour B' })).toBeDisabled();
	});

	it('keeps both audio controls visible when matchup data is unavailable', async () => {
		setLocale('en', { reload: false });
		render(Page, {
			data: {
				matchup: null,
				matchupError: true
			}
		});

		await expect.element(page.getByText('Audio unavailable').first()).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Vote for A' })).toBeDisabled();
		await expect.element(page.getByRole('button', { name: 'Vote for B' })).toBeDisabled();
		await expect
			.element(
				page.getByText(
					'Audio controls stay visible even when the matchup data is unavailable. Voting remains locked until audio loads correctly.'
				)
			)
			.toBeInTheDocument();
		expect(document.querySelectorAll('audio')).toHaveLength(2);
	});
});
