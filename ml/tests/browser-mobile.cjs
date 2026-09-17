// Mobile UI checks for the three-screen First Brew flow.
// Run the local app, then: node ml/tests/browser-mobile.cjs
// Env: POURPOUR_TEST_URL (default http://127.0.0.1:8002), POURPOUR_BROWSER_CHANNEL (e.g. chrome),
//      POURPOUR_SCREENS_DIR (also save light/dark screenshots of the three screens at 375×812).
const { chromium, devices } = require('playwright');
const path = require('path');
const fs = require('fs');
const assert = require('node:assert/strict');

const baseURL = process.env.POURPOUR_TEST_URL || 'http://127.0.0.1:8002';
const fixture = (name) => path.join(__dirname, 'fixtures', name);

const noHorizontalScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const inViewport = (page, selector) => page.locator(selector).evaluate(el => {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= window.innerHeight;
});
const screen = (page) => page.evaluate(() => document.body.dataset.screen);
const text = (page, selector) => page.locator(selector).textContent();
const tapTargets = (page) => page.evaluate(() => [...document.querySelectorAll('button, a, input:not([type=file])')]
  .filter(el => el.offsetParent !== null)
  .map(el => ({tag: el.id || el.className, h: el.getBoundingClientRect().height, w: el.getBoundingClientRect().width}))
  .filter(el => el.h < 48 || el.w < 48));

async function checkDevice(browser, deviceName) {
  const context = await browser.newContext({...devices[deviceName], baseURL});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto('/');
    assert.equal(await page.title(), 'First Brew');
    assert.equal(await page.getAttribute('html', 'lang'), 'en');
    assert.equal(await screen(page), 'find');
    assert.ok(await noHorizontalScroll(page), 'no horizontal scroll on the find screen');
    assert.ok(await inViewport(page, '#photo-button'), 'photo button visible without scrolling');
    assert.equal(await page.getAttribute('#photo-input', 'capture'), 'environment');
    assert.equal(await page.getAttribute('#photo-input', 'accept'), 'image/*');
    assert.deepEqual(await tapTargets(page), [], 'every visible control is at least 48×48');

    // Photo → recipe screen.
    const chooser = page.waitForEvent('filechooser');
    await page.locator('#photo-button').click();
    await (await chooser).setFiles(fixture('rwanda-label.png'));
    await page.waitForFunction(() => document.body.dataset.screen === 'recipe' && document.getElementById('recipe-title')?.textContent === 'Руанда Суса', null, {timeout: 40000});
    assert.ok(await noHorizontalScroll(page), 'no horizontal scroll on the recipe screen');
    assert.ok(await inViewport(page, '#brew-start'), 'start button visible without scrolling');
    assert.match(await text(page, '.figures'), /250 g/);
    assert.match(await text(page, '.figures'), /98 °C/);
    assert.equal(await page.locator('.pour').count(), 5);
    assert.deepEqual(await tapTargets(page), []);

    // Browser back returns to the find screen.
    await page.goBack();
    await page.waitForFunction(() => document.body.dataset.screen === 'find');
    assert.ok(await inViewport(page, '#photo-button'));

    // Search → recipe → timer.
    await page.locator('#query').fill('суса');
    await page.locator('#results .coffee').first().waitFor();
    assert.match(await text(page, '#results .coffee'), /Руанда Суса/);
    await page.locator('#results .coffee').first().click();
    await page.waitForFunction(() => document.body.dataset.screen === 'recipe' && document.querySelector('.figures'), null, {timeout: 30000});
    assert.equal(await text(page, '#recipe-title'), 'Руанда Суса');
    await page.locator('#brew-start').click();
    await page.waitForFunction(() => document.body.dataset.screen === 'brew');
    assert.ok(await noHorizontalScroll(page), 'no horizontal scroll on the brew screen');
    assert.ok(await inViewport(page, '#brew-toggle'), 'pause button visible without scrolling');
    assert.equal(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight), true, 'brew screen fits without scrolling');
    assert.equal(await text(page, '#brew-toggle'), 'Pause');
    assert.match(await text(page, '#brew-phase'), /^Bloom/);
    assert.match(await text(page, '#brew-action'), /^Pouring to 50 g$/);
    await page.evaluate(() => window.firstBrew.seek(16));
    assert.equal(await text(page, '#brew-phase'), 'Waiting');
    assert.match(await text(page, '#brew-action'), /^Next pour in 14 s$/);
    assert.match(await text(page, '#brew-next'), /0:30/);
    await page.evaluate(() => window.firstBrew.seek(175));
    assert.equal(await page.locator('#brew-done').isVisible(), true);
    assert.equal(await text(page, '#brew-again'), 'Brew again');
    assert.ok(await inViewport(page, '#brew-again'));
    assert.deepEqual(await tapTargets(page), []);

    // Back from the timer returns to the recipe, then to the search.
    await page.goBack();
    await page.waitForFunction(() => document.body.dataset.screen === 'recipe');
    assert.ok(await inViewport(page, '#brew-start'));
    await page.goBack();
    await page.waitForFunction(() => document.body.dataset.screen === 'find');
    assert.deepEqual(errors, []);
    console.log(`PASS ${deviceName}: photo → recipe, search → recipe → timer, no horizontal scroll, CTA visible, back button.`);
  } finally {
    await context.close();
  }
}

async function screenshots(browser, dir) {
  fs.mkdirSync(dir, {recursive: true});
  for (const colorScheme of ['light', 'dark']) {
    const context = await browser.newContext({baseURL, viewport: {width: 375, height: 812}, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme});
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForFunction(() => /coffees in the database|unavailable/.test(document.getElementById('status').textContent));
    await page.locator('#query').fill('руанда');
    await page.locator('#results .coffee').first().waitFor();
    await page.screenshot({path: path.join(dir, `1-find-${colorScheme}.png`)});
    await page.locator('#results .coffee', {hasText: 'Руанда Суса'}).click();
    await page.waitForFunction(() => document.querySelector('.figures'), null, {timeout: 30000});
    await page.screenshot({path: path.join(dir, `2-recipe-${colorScheme}.png`)});
    await page.locator('#brew-start').click();
    await page.waitForFunction(() => document.body.dataset.screen === 'brew');
    await page.evaluate(() => window.firstBrew.seek(64));
    await page.locator('#brew-toggle').click(); // running again, mid-pour
    await page.screenshot({path: path.join(dir, `3-brew-${colorScheme}.png`)});
    await context.close();
  }
  console.log(`Saved screenshots to ${dir}`);
}

(async () => {
  const browser = await chromium.launch({headless: true, channel: process.env.POURPOUR_BROWSER_CHANNEL || undefined});
  try {
    for (const device of ['iPhone 13', 'Pixel 5']) await checkDevice(browser, device);
    if (process.env.POURPOUR_SCREENS_DIR) await screenshots(browser, process.env.POURPOUR_SCREENS_DIR);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
