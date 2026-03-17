import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	it('renders the round title and keeps voting disabled initially', async () => {
		render(Page);

		await expect.element(page.getByText('Le bouchon')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Vote for A' })).toBeDisabled();
		await expect.element(page.getByRole('button', { name: 'Vote for B' })).toBeDisabled();
	});
});
