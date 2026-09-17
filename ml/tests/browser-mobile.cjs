// Mobile UI checks for the three-screen First Brew flow.
// Run the local app, then: node ml/tests/browser-mobile.cjs
// Env: POURPOUR_TEST_URL (default http://127.0.0.1:8002), POURPOUR_BROWSER_CHANNEL (e.g. chrome),
//      POURPOUR_SCREENS_DIR (also save light/dark screenshots of the three screens at 375×812).
const { chromium, firefox, devices } = require('playwright');
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
  const context = await browser.newContext({...devices[deviceName], baseURL, locale: 'en-US'});
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
    assert.equal(await page.locator('#recents').isVisible(), false, 'empty recent history stays hidden');
    assert.equal(await page.locator('#recents-hint').count(), 0, 'the recents hint is removed');
    assert.deepEqual(await tapTargets(page), [], 'every visible control is at least 48×48');

    assert.equal(await page.getAttribute('#gallery-input', 'capture'), null);
    assert.equal(await page.locator('#gallery-button').isVisible(), true);
    // Photo → confirmation → recipe screen.
    await page.route('**/api/label', async route => {
      await new Promise(resolve => setTimeout(resolve, 750));
      await route.continue();
    }, {times: 1});
    const photoResponse = page.waitForResponse(response => response.url().endsWith('/api/label'));
    const chooser = page.waitForEvent('filechooser');
    await page.locator('#photo-button').click();
    await (await chooser).setFiles(fixture('rwanda-label.png'));
    await page.locator('#scan-preview[data-scanning="true"]').waitFor({state: 'visible'});
    assert.match(await text(page, '#scan-caption'), /Scanning your photo/);
    assert.match(await page.locator('#scan-image').getAttribute('src'), /^data:image\/jpeg;base64,/);
    await page.waitForFunction(() => document.getElementById('scan-image').naturalWidth > 0, null, {timeout: 5000});
    const previewRatio = await page.locator('#scan-image').evaluate(image => ({
      shown: image.getBoundingClientRect().width / image.getBoundingClientRect().height,
      original: image.naturalWidth / image.naturalHeight,
    }));
    assert.ok(Math.abs(previewRatio.shown - previewRatio.original) < .05, 'landscape photo keeps its aspect ratio');
    assert.notEqual(await page.locator('.scan-frame').evaluate(el => getComputedStyle(el, '::after').animationName), 'none');
    const photoData = await (await photoResponse).json();
    const uncertain = photoData.ocr.needs_review;
    await page.waitForFunction(() => document.body.dataset.screen === 'confirm');
    assert.match(await text(page, '#recognized-fields'), /Руанда Суса/);
    assert.ok(await inViewport(page, '#confirm-recipe'));
    assert.ok(await noHorizontalScroll(page));
    assert.equal(await page.locator('#not-this-coffee').isVisible(), false, 'exact match needs only one confirmation');
    assert.equal(await page.locator('#confirm-recipe').evaluate(el => el === document.activeElement), true);
    await page.locator('#confirm-recipe').click();
    await page.waitForFunction(() => document.body.dataset.screen === 'recipe' && document.getElementById('recipe-title')?.textContent === 'Руанда Суса', null, {timeout: 40000});
    assert.ok(await noHorizontalScroll(page), 'no horizontal scroll on the recipe screen');
    assert.equal(await page.locator('#recipe-photo').isVisible(), true, 'uploaded photo stays visible on the phone recipe');
    assert.ok(await page.locator('#recipe-photo-image').evaluate(image => image.naturalWidth > 0), 'recipe thumbnail displays the photo');
    assert.equal(await page.locator('#recipe-photo-image').evaluate(image => getComputedStyle(image).objectFit), 'contain',
      'recipe thumbnail shows the whole image');
    assert.equal(await page.locator('#scan-preview').getAttribute('data-scanning'), 'false');
    assert.equal(await page.locator('#recipe-form').isVisible(), false, 'OCR never opens the recipe editor');
    await page.locator('#recipe-photo-label').click();
    assert.match(await text(page, '#recipe-recognition'), /Rwanda/);
    await page.locator('#recipe-photo-label').click();
    await page.setViewportSize({width: 1100, height: 800});
    assert.equal(await page.locator('#gallery-button').isVisible(), false);
    await page.waitForFunction(() => document.getElementById('photo-button').textContent === 'Choose a photo');
    assert.equal(await page.locator('#recipe-body').isVisible(), true);
    await page.setViewportSize(devices[deviceName].viewport);
    assert.ok(await inViewport(page, '#brew-start'), 'start button visible without scrolling');
    assert.match(await text(page, '.figures'), /250 g/);
    assert.match(await text(page, '.figures'), /98 °C/);
    assert.equal(await page.locator('.pour').count(), 5);
    assert.deepEqual(await tapTargets(page), []);

    // The same matched recipe can always be edited manually.
    await page.locator('#edit-recipe').click();
    assert.equal(await text(page, '#recipe-form button[type=submit]'), 'Apply changes');
    assert.equal(await page.locator('#cancel-edit').isVisible(), true, 'manual editing can be cancelled');
    await page.locator('#cancel-edit').click();
    await page.locator('#edit-recipe').click();
    assert.equal(await page.locator('#edit-coffee').inputValue(), '15');
    assert.equal(await page.locator('#edit-water').inputValue(), '250');
    assert.equal(await page.locator('#brew-start').isVisible(), false);
    await page.locator('#edit-coffee').fill('18');
    await page.locator('#edit-water').fill('300');
    await page.locator('#edit-duration').fill('210');
    assert.equal(await page.locator('#edit-pour-4').inputValue(), '60');
    assert.ok(await noHorizontalScroll(page), 'no horizontal scroll in the recipe editor');
    assert.deepEqual(await tapTargets(page), []);
    await page.locator('#edit-pour-4').fill('59');
    await page.locator('#recipe-form button[type=submit]').click();
    assert.equal(await page.locator('#edit-error').isVisible(), true, 'invalid pour total is rejected');
    await page.locator('#edit-pour-4').fill('60');
    await page.locator('#recipe-form button[type=submit]').click();
    assert.match(await text(page, '.figures'), /300 g/);
    assert.match(await text(page, '.figures'), /3:30/);
    assert.match(await text(page, '.pours'), /300 g/);
    assert.equal(await page.locator('#recents').isVisible(), false, 'viewing and editing alone do not add history');
    assert.ok(await inViewport(page, '#brew-start'), 'start button visible after editing');
    await page.locator('#brew-start').click();
    await page.waitForFunction(() => document.body.dataset.screen === 'brew');
    assert.match(await text(page, '#brew-action'), /^Pouring to 60 g$/, 'timer uses the edited pour amounts');
    const stored = await page.evaluate(() => localStorage.getItem('firstbrew.recentRecipes.v1'));
    assert.ok(stored, 'starting a brew saves the recipe locally');
    assert.ok(!stored.includes('ocr_uncertain') && !stored.includes('image/jpeg'), 'history does not store scan data');
    await page.goBack();
    await page.waitForFunction(() => document.body.dataset.screen === 'recipe');

    // Back through confirmation returns to Find.
    await page.goBack();
    await page.waitForFunction(() => document.body.dataset.screen === 'confirm');
    await page.goBack();
    await page.waitForFunction(() => document.body.dataset.screen === 'find');
    assert.ok(await inViewport(page, '#photo-button'));
    assert.equal(await page.locator('#recents').isVisible(), true, 'recent brews appear on Find');
    assert.match(await text(page, '#recent-list'), /300 g/);
    assert.ok(await noHorizontalScroll(page), 'recent cards do not cause horizontal scrolling');
    assert.deepEqual(await tapTargets(page), [], 'recent cards remain phone-sized tap targets');
    await page.reload();
    assert.equal(await page.locator('#recents').isVisible(), true, 'history survives a reload');
    await page.route('**/api/recipes/**', route => route.abort());
    await page.locator('#recent-list .coffee').first().click();
    assert.equal(await page.locator('#recipe-photo').isVisible(), false, 'recent recipes do not retain photos');
    assert.match(await text(page, '.figures'), /300 g/, 'recent brew restores edited values');
    assert.match(await text(page, '.pours'), /300 g/, 'recent brew restores edited pours');
    await page.unroute('**/api/recipes/**');
    await page.goBack();
    await page.waitForFunction(() => document.body.dataset.screen === 'find');

    // Check the opposite recognition-confidence path without repeating OCR.
    const alternate = structuredClone(photoData);
    alternate.recommendation.ocr_uncertain = !uncertain;
    alternate.ocr.needs_review = !uncertain;
    await page.emulateMedia({reducedMotion: 'reduce'});
    await page.route('**/api/label', async route => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.fulfill({json: alternate});
    });
    const secondChooser = page.waitForEvent('filechooser');
    await page.locator('#photo-button').click();
    await (await secondChooser).setFiles(fixture('rwanda-label.png'));
    await page.locator('#scan-preview[data-scanning="true"]').waitFor({state: 'visible'});
    assert.equal(await page.locator('.scan-frame').evaluate(el => getComputedStyle(el, '::after').animationName), 'none',
      'reduced motion disables the scan animation');
    await page.waitForFunction(() => document.body.dataset.screen === 'confirm');
    assert.equal(await page.locator('#recipe-form').isVisible(), false);
    assert.match(await text(page, '#confirm-status'), uncertain ? /Check the details/ : /uncertain/);
    await page.locator('#confirm-recipe').click();
    await page.waitForFunction(() => document.body.dataset.screen === 'recipe');
    await page.goBack();
    await page.waitForFunction(() => document.body.dataset.screen === 'confirm');
    await page.unroute('**/api/label');
    await page.goBack();
    await page.waitForFunction(() => document.body.dataset.screen === 'find');

    // Search → recipe → timer.
    await page.locator('#query').fill('суса');
    await page.locator('#results .coffee').first().waitFor();
    assert.equal(await page.locator('#recents').isVisible(), false, 'recent list gives way to search results');
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

async function recognitionChecks(browser) {
  const context = await browser.newContext({...devices['iPhone 13'], baseURL, locale: 'ru-RU'});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto('/');
    assert.equal(await page.getAttribute('html', 'lang'), 'ru');
    await page.locator('#settings-button').click();
    await page.locator('#language').selectOption('en');
    await page.reload();
    assert.equal(await page.getAttribute('html', 'lang'), 'en', 'language choice survives reload');
    await page.waitForFunction(() => document.getElementById('status').textContent.includes('coffees'));
    // Actual blank image through OCR, not a mocked unreadable response.
    const blank = await page.evaluate(() => {
      const canvas = document.createElement('canvas'); canvas.width = 500; canvas.height = 500;
      const ctx = canvas.getContext('2d'); ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 500, 500);
      return canvas.toDataURL('image/png').split(',')[1];
    });
    await page.locator('#gallery-input').setInputFiles({name: 'blank.png', mimeType: 'image/png', buffer: Buffer.from(blank, 'base64')});
    await page.waitForFunction(() => document.body.dataset.screen === 'confirm', null, {timeout: 40000});
    assert.equal(await text(page, '#confirm-title'), 'Couldn’t read the label');
    assert.equal(await page.locator('#confirm-recipe').isVisible(), false);
    assert.ok(await inViewport(page, '#photo-retake'));
    assert.ok(await noHorizontalScroll(page));
    assert.equal(await page.locator('#confirm-photo').evaluate(img => img.naturalWidth > 0), true);
    await page.locator('#type-name').click();
    assert.equal(await screen(page), 'find');
    assert.equal(await page.locator('#query').evaluate(el => el === document.activeElement), true);
    await page.goBack();
    await page.waitForFunction(() => document.body.dataset.screen === 'confirm');
    await page.locator('#general-recipe').click();
    await page.waitForFunction(() => document.body.dataset.screen === 'recipe');
    assert.match(await text(page, '.recommendation-basis'), /starting recipe/);
    await page.goBack(); await page.goBack();
    // A slow response can be cancelled and cannot navigate when it arrives later.
    const rec = await (await page.request.post('/api/recommend', {data: {text: 'Colombia washed'}})).json();
    const photo = {text: 'Colombia washed', ocr: {needs_review: false}, recommendation: rec, photo_state: 'confirmation'};
    await page.route('**/api/label', async route => {
      await new Promise(resolve => setTimeout(resolve, 6500));
      await route.fulfill({json: photo}).catch(() => {});
    });
    await page.locator('#gallery-input').setInputFiles(fixture('colombia-label.png'));
    await page.locator('#photo-cancel').waitFor({state: 'visible', timeout: 8000});
    assert.match(await text(page, '#status'), /longer than usual/);
    await page.locator('#photo-cancel').click();
    assert.equal(await page.locator('#scan-preview').isVisible(), true);
    await page.waitForTimeout(1800);
    assert.equal(await screen(page), 'find');
    await page.unroute('**/api/label');
    // Editing recognized chips sends only confirmed fields.
    await page.route('**/api/label', route => route.fulfill({json: photo}));
    await page.locator('#gallery-input').setInputFiles(fixture('colombia-label.png'));
    await page.waitForFunction(() => document.body.dataset.screen === 'confirm');
    await page.locator('#country-chip summary').click();
    await page.locator('#confirm-country').selectOption('ET');
    await page.locator('#country-chip summary').click();
    const changed = page.waitForRequest(r => r.url().endsWith('/api/recommend'));
    await page.locator('#confirm-recipe').click();
    const body = (await changed).postDataJSON();
    assert.match(body.text, /Страна: эфиопия/);
    assert.ok(!body.text.includes('Colombia'));
    await page.waitForFunction(() => document.body.dataset.screen === 'recipe');
    assert.equal(await text(page, '#recipe-title'), 'Ethiopia · washed');
    assert.match(await text(page, '.subtitle'), /Starting recipe based on/);
    await page.goBack();
    await page.locator('#not-this-coffee').click();
    assert.equal(await page.locator('#query').inputValue(), 'Colombia washed');
    await page.unroute('**/api/label');
    // Name correction uses the catalog search, then still needs confirmation.
    await page.route('**/api/label', route => route.fulfill({json: photo}));
    await page.locator('#gallery-input').setInputFiles(fixture('colombia-label.png'));
    await page.waitForFunction(() => document.body.dataset.screen === 'confirm');
    await page.locator('#name-chip summary').click();
    await page.locator('#confirm-name').fill('суса');
    await page.locator('#confirm-candidates button', {hasText: 'Руанда Суса'}).click();
    await page.waitForFunction(() => document.getElementById('name-chip').textContent.includes('Руанда Суса') && !document.getElementById('confirm-recipe').disabled);
    assert.equal(await screen(page), 'confirm');
    await page.locator('#confirm-recipe').click();
    assert.equal(await text(page, '#recipe-title'), 'Руанда Суса');
    await page.goBack(); await page.goBack();
    await page.unroute('**/api/label');
    const decaf = await (await page.request.post('/api/recommend', {data: {text: 'Колумбия декаф, мытая'}})).json();
    await page.route('**/api/label', route => route.fulfill({json: {...photo, recommendation: decaf}}));
    await page.locator('#gallery-input').setInputFiles(fixture('colombia-label.png'));
    await page.waitForFunction(() => document.body.dataset.screen === 'confirm');
    await page.locator('#confirm-recipe').click();
    await page.waitForFunction(() => document.body.dataset.screen === 'recipe');
    assert.match(await text(page, '#recipe-title'), /Colombia · washed · Decaf/);
    assert.match(await text(page, '.recommendation-basis'), /filter roast without decaf/);
    assert.ok(!(await text(page, '#recipe-body')).includes('Not matched'));
    const storage = await page.evaluate(() => JSON.stringify({...localStorage}));
    assert.ok(!storage.includes('Colombia washed') && !storage.includes('data:image'), 'OCR and images never persist');
    assert.deepEqual(errors, []);
    console.log('PASS recognition: language persistence, unreadable photo, explicit baseline, cancellation, corrected chips, decaf caveat.');
  } finally { await context.close(); }
}

async function screenshots(browser, dir) {
  fs.mkdirSync(dir, {recursive: true});
  for (const colorScheme of ['light', 'dark']) {
    const context = await browser.newContext({baseURL, viewport: {width: 375, height: 812}, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'ru-RU', colorScheme});
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForFunction(() => !document.getElementById('status').textContent.includes('Проверяем'));
    await page.screenshot({path: path.join(dir, `1-find-${colorScheme}.png`)});
    await page.locator('#gallery-input').setInputFiles(fixture('rwanda-label.png'));
    await page.waitForFunction(() => document.body.dataset.screen === 'confirm', null, {timeout: 40000});
    await page.screenshot({path: path.join(dir, `2-confirm-${colorScheme}.png`)});
    await page.locator('#confirm-recipe').click();
    await page.waitForFunction(() => document.body.dataset.screen === 'recipe');
    await page.screenshot({path: path.join(dir, `3-recipe-${colorScheme}.png`)});
    await page.locator('#brew-start').click();
    await page.evaluate(() => window.firstBrew.seek(64));
    await page.screenshot({path: path.join(dir, `4-brew-${colorScheme}.png`)});
    const blank = await page.evaluate(() => {
      const canvas = document.createElement('canvas'); canvas.width = 300; canvas.height = 300;
      const ctx = canvas.getContext('2d'); ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 300, 300);
      return canvas.toDataURL('image/png').split(',')[1];
    });
    await page.locator('#gallery-input').setInputFiles({name: 'blank.png', mimeType: 'image/png', buffer: Buffer.from(blank, 'base64')});
    await page.waitForFunction(() => document.body.dataset.screen === 'confirm', null, {timeout: 40000});
    await page.screenshot({path: path.join(dir, `5-unreadable-${colorScheme}.png`)});
    await context.close();
  }
  console.log(`Saved screenshots to ${dir}`);
}

(async () => {
  const isFirefox = process.env.POURPOUR_BROWSER_ENGINE === 'firefox';
  const browser = await (isFirefox ? firefox : chromium).launch(isFirefox
    ? {headless: true, firefoxUserPrefs: {'network.proxy.type': 0}}
    : {headless: true, channel: process.env.POURPOUR_BROWSER_CHANNEL || undefined});
  try {
    for (const device of ['iPhone SE', 'iPhone 13', 'Pixel 5']) await checkDevice(browser, device);
    await recognitionChecks(browser);
    if (process.env.POURPOUR_SCREENS_DIR) await screenshots(browser, process.env.POURPOUR_SCREENS_DIR);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
