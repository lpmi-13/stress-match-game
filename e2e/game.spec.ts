import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('chooses a rhythm and starts a complete matching round', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'Hear the shape. Match the stress.' }),
  ).toBeVisible();
  await expect(page.getByRole('radio')).toHaveCount(5);
  await page.getByRole('radio', { name: /Middle syllable/i }).check();
  await page.getByRole('button', { name: /Start matching/i }).click();

  await expect(page.getByRole('heading', { name: /Which words share this rhythm/i })).toBeVisible();
  await expect(page.locator('.word-card')).toHaveCount(12);
  await expect(page.getByText('0 / 6')).toBeVisible();

  const match = page.locator('.word-card[data-match="true"]').first();
  await match.click();
  await expect(match).toBeDisabled();
  await expect(page.getByRole('status')).toContainText('Match');
  await expect(page.getByText('1 / 6')).toBeVisible();
});

test('wins after finding all six matching words', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Start matching/i }).click();

  const matches = page.locator('.word-card[data-match="true"]');
  await expect(matches).toHaveCount(6);
  for (let index = 0; index < 6; index += 1) await matches.nth(index).click();

  await expect(page.getByRole('heading', { name: 'Rhythm locked in.' })).toBeVisible();
  await expect(page.getByText('You found all six words')).toBeVisible();
});

test('ends after three misses and supports choosing another pattern', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Start matching/i }).click();

  const misses = page.locator('.word-card[data-match="false"]');
  for (let index = 0; index < 3; index += 1) await misses.nth(index).click();

  await expect(page.getByRole('heading', { name: 'Reset. Listen. Try again.' })).toBeVisible();
  await page.getByRole('button', { name: 'Choose another pattern' }).click();
  await expect(page.getByRole('group', { name: 'Choose a rhythm' })).toBeVisible();
});

test('has no detectable accessibility violations on the landing page or game', async ({ page }) => {
  await page.goto('/');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.getByRole('button', { name: /Start matching/i }).click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('publishes canonical Open Graph and Twitter Card metadata', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://stress-match.netlify.app/',
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    'content',
    'https://stress-match.netlify.app/',
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://stress-match.netlify.app/social-preview.png',
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    'content',
    'summary_large_image',
  );
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
    'content',
    'https://stress-match.netlify.app/social-preview.png',
  );

  const preview = await page.request.get('/social-preview.png');
  expect(preview.ok()).toBe(true);
  expect(preview.headers()['content-type']).toContain('image/png');
});

test('does not overflow a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 650 });
  await page.goto('/');

  const landing = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(landing.scroll).toBeLessThanOrEqual(landing.client + 1);

  await page.getByRole('button', { name: /Start matching/i }).click();
  await expect(page.locator('.game-header')).toBeInViewport();
  expect(await page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(1);
  const game = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(game.scroll).toBeLessThanOrEqual(game.client + 1);
});
