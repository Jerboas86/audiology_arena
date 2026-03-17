import { expect, test } from '@playwright/test';

test('home page renders the current round UI', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByText('Le bouchon')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Vote for A' })).toBeDisabled();
	await expect(page.getByRole('button', { name: 'Vote for B' })).toBeDisabled();
});
