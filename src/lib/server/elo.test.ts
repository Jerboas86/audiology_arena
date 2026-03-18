import { describe, it, expect } from 'vitest';
import { expectedScore, newRating } from './elo';

describe('expectedScore', () => {
	it('returns 0.5 for equal ratings', () => {
		expect(expectedScore(1500, 1500)).toBeCloseTo(0.5);
	});

	it('returns higher probability for higher-rated player', () => {
		const score = expectedScore(1700, 1500);
		expect(score).toBeGreaterThan(0.5);
		expect(score).toBeCloseTo(0.7597, 3);
	});

	it('returns lower probability for lower-rated player', () => {
		const score = expectedScore(1500, 1700);
		expect(score).toBeLessThan(0.5);
		expect(score).toBeCloseTo(0.2403, 3);
	});

	it('expected scores of opponents sum to 1', () => {
		const a = expectedScore(1600, 1400);
		const b = expectedScore(1400, 1600);
		expect(a + b).toBeCloseTo(1);
	});
});

describe('newRating', () => {
	it('winner gains ~16 points when both are 1500 (K=32)', () => {
		const expected = expectedScore(1500, 1500); // 0.5
		const rating = newRating(1500, expected, 1);
		expect(rating).toBe(1516);
	});

	it('loser loses ~16 points when both are 1500 (K=32)', () => {
		const expected = expectedScore(1500, 1500); // 0.5
		const rating = newRating(1500, expected, 0);
		expect(rating).toBe(1484);
	});

	it('underdog wins more points than favorite', () => {
		const expectedUnderdog = expectedScore(1400, 1600);
		const expectedFavorite = expectedScore(1600, 1400);

		const underdogWin = newRating(1400, expectedUnderdog, 1);
		const favoriteWin = newRating(1600, expectedFavorite, 1);

		// Underdog gains more than favorite would
		expect(underdogWin - 1400).toBeGreaterThan(favoriteWin - 1600);
	});

	it('respects custom K factor', () => {
		const expected = expectedScore(1500, 1500);
		const rating = newRating(1500, expected, 1, 16);
		expect(rating).toBe(1508);
	});

	it('returns integer ratings', () => {
		const expected = expectedScore(1523, 1487);
		const rating = newRating(1523, expected, 1);
		expect(Number.isInteger(rating)).toBe(true);
	});
});
