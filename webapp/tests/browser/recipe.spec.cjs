const { test, expect } = require('@playwright/test');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

// Use the real Python parser and checked-in source fixtures for UI payloads.
const fixture = JSON.parse(execFileSync('python3', ['-B', '-c', `
import json
from pathlib import Path
from pourpour import parse_catalog, parse_recipes
fixtures = Path('tests/fixtures')
print(json.dumps({
    'products': parse_catalog((fixtures / 'catalog.xml').read_text()),
    'recipes': parse_recipes((fixtures / 'recipes.json').read_text()),
}))
`], { cwd: path.resolve(__dirname, '../..'), encoding: 'utf8' }));
const product = fixture.products.find(p => p.name === 'Руанда Суса');
const source = { fetched_at: '2026-09-15T10:00:00Z', stale: false };
const recipePayload = {
  product, recipes: fixture.recipes, source, stale: false,
  source_url: 'https://recipes.theweldercatherine.ru/api/v1/recipes?product_id=55664&view=true',
};

test.beforeEach(async ({ page }) => {
  // Every data request is intercepted; the suite needs no upstream service.
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/search') {
      const query = url.searchParams.get('q');
      const products = query === 'missing' ? [] : [{ ...product, match: 'exact' }];
      return route.fulfill({ json: { products, total: products.length, catalog_size: 2, source } });
    }
    if (url.pathname === `/api/recipes/${product.id}`) {
      return route.fulfill({ json: recipePayload });
    }
    return route.fulfill({ status: 404, json: { error: 'Unexpected API request' } });
  });
});

test('selects a recipe and supports timer pause, resume and reset', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button', { name: /Руанда Суса/ }).click();
  await expect(page.locator('.recipe-title')).toHaveText('Руанда Суса');
  await expect(page.locator('.step')).toHaveCount(5);
  await expect(page.locator('.specs')).toContainText('250');
  await expect(page.locator('.recipe-title')).toBeFocused();
  await page.getByRole('button', { name: 'Начать заваривание' }).click();
  await page.clock.runFor(1200);
  await expect(page.locator('#timer-clock')).toHaveText('0:01');
  await expect(page.locator('#step-0')).toHaveClass(/active/);
  await page.getByRole('button', { name: 'Пауза', exact: true }).click();
  await page.clock.runFor(2000);
  await expect(page.locator('#timer-clock')).toHaveText('0:01');
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await page.clock.runFor(1000);
  await expect(page.locator('#timer-clock')).toHaveText('0:02');
  await page.getByRole('button', { name: 'Сбросить таймер' }).click();
  await expect(page.locator('#timer-clock')).toHaveText('0:00');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('shows an empty search result', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Найти', exact: false })).toBeEnabled();
  await page.getByRole('searchbox').fill('missing');
  await page.locator('#search-button').click();
  await expect(page.locator('#catalog-status')).toContainText('Кофе не найден');
  await expect(page.locator('.coffee')).toHaveCount(0);
});

test('reports a missing recipe', async ({ page }) => {
  await page.route('**/api/recipes/*', route => route.fulfill({ json: { ...recipePayload, recipes: [] } }));
  await page.goto('/');
  await page.getByRole('button', { name: /Руанда Суса/ }).click();
  await expect(page.locator('#recipe-content')).toContainText('нет рецепта воронки');
  await expect(page.locator('#timer-toggle')).toHaveCount(0);
});

test('recovers from a recipe failure using retry', async ({ page }) => {
  let attempts = 0;
  await page.route('**/api/recipes/*', route => {
    attempts += 1;
    return attempts === 1
      ? route.fulfill({ status: 502, json: { error: 'Источник временно недоступен' } })
      : route.fulfill({ json: recipePayload });
  });
  await page.goto('/');
  await page.getByRole('button', { name: /Руанда Суса/ }).click();
  await expect(page.getByRole('alert')).toContainText('Источник временно недоступен');
  await page.getByRole('button', { name: 'Попробовать снова' }).click();
  await expect(page.locator('.recipe-title')).toHaveText('Руанда Суса');
});
