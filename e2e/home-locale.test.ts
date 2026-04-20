import { expect, test } from '@playwright/test';

test('home page renders the English locale when the paraglide cookie is set to en', async ({
	context,
	page
}) => {
	await context.addCookies([
		{ name: 'PARAGLIDE_LOCALE', value: 'en', url: 'http://localhost:4173' }
	]);

	await page.goto('/');

	await expect(page.getByText('Round in progress')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Vote for A' })).toBeDisabled();
	await expect(page.getByRole('button', { name: 'Vote for B' })).toBeDisabled();
});
