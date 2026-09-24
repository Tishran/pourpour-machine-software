// Optional UI smoke test: install Playwright, run the local app, then node this file.
const { chromium } = require('playwright');
const path = require('path');
const assert = require('node:assert/strict');
const {presetDemo} = require('./demo-state.cjs');

(async () => {
  const browser = await chromium.launch({headless: true, channel: process.env.POURPOUR_BROWSER_CHANNEL || undefined});
  try {
    const baseURL = process.env.POURPOUR_TEST_URL || 'http://127.0.0.1:8002';
    const page = await browser.newPage({baseURL, locale: 'en-US', viewport: {width: 1280, height: 900}});
    await presetDemo(page);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(baseURL);
    assert.equal(await page.title(), 'First Brew');
    // Russian is the default for every locale; these checks read the English strings.
    await page.locator('#language').selectOption('en');
    const chooser = page.waitForEvent('filechooser');
    await page.locator('#photo-button').click();
    await (await chooser).setFiles(path.join(__dirname, 'fixtures/rwanda-label.png'));
    await page.waitForFunction(() => document.body.dataset.screen === 'confirm', null, {timeout: 40000});
    await page.locator('#confirm-recipe').click();
    await page.locator('#recipe-title').waitFor({timeout: 40000});
    await page.waitForFunction(() => document.querySelector('.figures'), null, {timeout: 40000});
    assert.equal(await page.locator('#recipe-title').textContent(), 'Руанда Суса');
    assert.match(await page.locator('.figures').textContent(), /250/);
    // Recognition has been confirmed; the recipe editor remains optional.
    assert.equal(await page.locator('#label-editor').count(), 0);
    assert.equal(await page.locator('#prepare-recipe').count(), 0);
    await page.locator('#brew-start').click();
    assert.equal(await page.evaluate(() => document.body.dataset.screen), 'brew');
    assert.equal(await page.locator('#brew-toggle').textContent(), 'Pause');
    assert.match(await page.locator('#brew-phase').textContent(), /^Bloom/);
    assert.match(await page.locator('#brew-action').textContent(), /Pouring to 50 g/);
    await page.evaluate(() => window.firstBrew.seek(16));
    assert.equal(await page.locator('#brew-phase').textContent(), 'Waiting');
    assert.match(await page.locator('#brew-action').textContent(), /Next pour in 14 s/);
    await page.locator('#brew-reset').click();
    await page.locator('#brew-back').click();
    await page.waitForFunction(() => document.body.dataset.screen === 'recipe');

    // Backend contract (no confirmation step): a name match returns the catalog recipe directly.
    const named = await (await page.request.post('/api/recommend', {headers:{'Content-Type':'application/json'}, data:{text:'Руанда Суса'}})).json();
    assert.equal(named.kind, 'catalog_match');
    assert.equal(named.recipe_data.product.name, 'Руанда Суса');

    // An out-of-catalog label falls back to the closest catalog recipe, no dead end.
    const closest = await (await page.request.post('/api/recommend', {headers:{'Content-Type':'application/json'}, data:{text:'Country: Brazil\nProcessing: natural'}})).json();
    assert.equal(closest.kind, 'suggested_baseline');
    assert.equal(closest.basis.scope, 'processing');
    assert.ok(closest.recipe_data);
    assert.match(closest.message, /origin is not matched/i);

    await page.locator('#photo-input').setInputFiles(path.join(__dirname, 'fixtures/colombia-label.png'));
    await page.waitForFunction(() => document.body.dataset.screen === 'confirm', null, {timeout: 40000});
    await page.locator('#confirm-recipe').click();
    assert.equal(await page.locator('#recipe-title').textContent(), 'Colombia');
    assert.match(await page.locator('.recommendation-basis').textContent(), /starting recipe/);
    assert.match(await page.locator('.figures').textContent(), /250/);

    const blankImage = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 500; canvas.height = 500;
      const context = canvas.getContext('2d');
      context.fillStyle = 'white'; context.fillRect(0, 0, 500, 500);
      return canvas.toDataURL('image/png').split(',')[1];
    });
    await page.locator('#photo-input').setInputFiles({name:'unreadable.png', mimeType:'image/png', buffer:Buffer.from(blankImage, 'base64')});
    await page.waitForFunction(() => document.body.dataset.screen === 'confirm', null, {timeout: 40000});
    assert.equal(await page.locator('#confirm-title').textContent(), 'Couldn’t read the label');
    assert.equal(await page.locator('#confirm-recipe').isVisible(), false);
    await page.locator('#general-recipe').click();
    await page.waitForFunction(() => document.body.dataset.screen === 'recipe');
    assert.match(await page.locator('.recommendation-basis').textContent(), /starting recipe/);

    const invalid = await page.request.post('/api/label', {headers: {'Content-Type':'image/png'}, data: Buffer.from('not an image')});
    assert.equal(invalid.status(), 400);
    const legacyScan = await page.request.post('/api/scan', {headers:{'Content-Type':'image/png'}, data:require('fs').readFileSync(path.join(__dirname, 'fixtures/rwanda-label.png'))});
    assert.equal(legacyScan.status(), 200);
    const scanResult = await legacyScan.json();
    assert.equal(scanResult.status, 'ok');
    assert.equal(scanResult.recommendation.kind, 'catalog_match');
    const crossOrigin = await page.request.post('/api/recommend', {headers:{Origin:'https://example.com'}, data:{text:'Rwanda'}});
    assert.equal(crossOrigin.status(), 403);
    assert.deepEqual(errors, []);

    await page.setViewportSize({width: 390, height: 844});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    await page.screenshot({path: process.env.POURPOUR_SCREENSHOT || '/tmp/pourpour-photo-mobile.png', fullPage:true});
    console.log('PASS desktop: photo → confirmation → recipe; country-only photo; explicit unreadable fallback; timer; invalid upload; same-origin; mobile overflow.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
