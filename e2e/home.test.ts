import { expect, test } from '@playwright/test';

test('home page renders the current round UI', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByText('Manche en cours')).toBeVisible();
	await expect(page.getByText('Duel actuel')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Voter pour A' })).toBeDisabled();
	await expect(page.getByRole('button', { name: 'Voter pour B' })).toBeDisabled();
});
