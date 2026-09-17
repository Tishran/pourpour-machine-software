// Optional UI smoke test: install Playwright, run the local app, then node this file.
const { chromium } = require('playwright');
const path = require('path');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({headless: true, channel: process.env.POURPOUR_BROWSER_CHANNEL || undefined});
  try {
    const baseURL = process.env.POURPOUR_TEST_URL || 'http://127.0.0.1:8002';
    const page = await browser.newPage({baseURL, viewport: {width: 1280, height: 900}});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(baseURL);
    assert.match(await page.title(), /First Brew/);
    const chooser = page.waitForEvent('filechooser');
    await page.locator('#scan-button').click();
    await (await chooser).setFiles(path.join(__dirname, 'fixtures/rwanda-label.png'));
    await page.locator('.recipe-title').waitFor({timeout: 40000});
    assert.equal(await page.locator('.recipe-title').textContent(), 'Руанда Суса');
    assert.match(await page.locator('.specs').textContent(), /250/);
    assert.match(await page.locator('#label-text').inputValue(), /Руанда/i);
    await page.locator('#timer-toggle').click();
    assert.equal(await page.locator('#timer-toggle').textContent(), 'Pause');
    assert.equal(await page.locator('#timer-phase').textContent(), 'BLOOM');
    assert.equal(await page.locator('#step-0').getAttribute('data-state'), 'active');
    assert.match(await page.locator('#timer-action').textContent(), /50 g/);
    await page.evaluate(() => { running = false; clearInterval(timerInterval); elapsed = 16; updateTimer(); });
    assert.equal(await page.locator('#step-0').getAttribute('data-state'), 'completed');
    assert.equal(await page.locator('#step-1').getAttribute('data-state'), 'next');
    assert.equal(await page.locator('#timer-phase').textContent(), 'PAUSE');
    assert.match(await page.locator('#timer-action').textContent(), /Next pour in 14 sec/);
    await page.locator('#timer-reset').click();

    await page.locator('#label-editor').evaluate(element => { element.open = true; });
    await page.locator('#label-text').fill('Coffee: New Lot\nCountry: Rwanda\nProcessing: washed\nVariety: red bourbon');
    await page.locator('#prepare-recipe').click();
    await page.waitForFunction(() => document.querySelector('.recipe-title')?.textContent === 'New Lot');
    assert.match(await page.locator('.recipe-subtitle').textContent(), /Suggested/);
    assert.match(await page.locator('.warning').first().textContent(), /different coffee/);
    const sum = await page.locator('.step-water').allTextContents();
    assert.equal(sum.reduce((total, x) => total + Number(x.replace(/[^\d.]/g, '')), 0), 250);

    await page.locator('#label-text').fill('Country: Brazil\nProcessing: natural');
    await page.locator('#prepare-recipe').click();
    await page.waitForFunction(() => document.querySelector('#photo-status').textContent.includes('origin is not matched'));
    assert.equal(await page.locator('#recipe-content').isVisible(), true);
    assert.match(await page.locator('.recommendation-basis').textContent(), /Not matched: country/);

    await page.locator('#label-photo').setInputFiles(path.join(__dirname, 'fixtures/colombia-label.png'));
    await page.waitForFunction(() => document.querySelector('.recipe-title')?.textContent === 'Colombia · starting recipe', null, {timeout: 40000});
    assert.match(await page.locator('.recommendation-basis').textContent(), /Processing is not assumed/);
    assert.match(await page.locator('.specs').textContent(), /250/);

    const blankImage = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 500; canvas.height = 500;
      const context = canvas.getContext('2d');
      context.fillStyle = 'white'; context.fillRect(0, 0, 500, 500);
      return canvas.toDataURL('image/png').split(',')[1];
    });
    await page.locator('#label-photo').setInputFiles({name:'unreadable.png', mimeType:'image/png', buffer:Buffer.from(blankImage, 'base64')});
    await page.waitForFunction(() => document.querySelector('#photo-status').textContent.includes('could not be read confidently'), null, {timeout: 40000});
    assert.equal(await page.locator('#recipe-content').isVisible(), true);
    assert.equal(await page.locator('.recipe-title').textContent(), 'Your coffee · starting recipe');
    assert.match(await page.locator('.recommendation-basis').textContent(), /general recipe/);

    await page.locator('#label-text').fill('Руанда Суса');
    await page.locator('#prepare-recipe').click();
    await page.locator('#label-candidates button').first().waitFor();
    await page.locator('#label-candidates button').first().click();
    await page.waitForFunction(() => document.querySelector('.recipe-title')?.textContent === 'Руанда Суса');

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
    console.log('PASS: photo OCR → exact recipe; unknown coffee → reference; country-only photo; unreadable photo → general recipe; unsupported origin; confirmation; timer; invalid upload; same-origin; mobile layout; no JS errors.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
