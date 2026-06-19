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

test('language selector updates the rendered content locale', async ({ context, page }) => {
	await context.addCookies([
		{ name: 'PARAGLIDE_LOCALE', value: 'fr', url: 'http://localhost:4173' }
	]);

	await page.goto('/');
	await expect(page.getByText('Manche en cours')).toBeVisible();

	const languageSelector = page.getByRole('combobox', { name: 'Langue du contenu' });
	const englishLanguage = await languageSelector
		.locator('option[value^="en-"]')
		.first()
		.getAttribute('value');
	if (!englishLanguage) throw new Error('No English audio language is available');

	await languageSelector.selectOption(englishLanguage);

	await expect(page).toHaveURL(new RegExp(`[?&]language=${englishLanguage}(?:&|$)`));
	await expect(page.getByText('Round in progress')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Vote for A' })).toBeDisabled();
});
