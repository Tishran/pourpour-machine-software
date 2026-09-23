// Phase-4 smoke check: parameter wizard and calculated recipe at 375×812.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const baseURL = process.env.POURPOUR_TEST_URL || 'http://127.0.0.1:8013';
const channel = process.env.POURPOUR_BROWSER_CHANNEL || undefined;
const noHorizontalScroll = page => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

async function run() {
  const browser = await chromium.launch({headless: true, ...(channel ? {channel} : {})});
  const context = await browser.newContext({viewport: {width: 375, height: 812}, locale: 'en-US'});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(baseURL);
    assert.equal(await page.locator('html').getAttribute('lang'), 'ru');
    await page.locator('#open-builder').click();
    await page.waitForSelector('#cb-country');
    assert.equal(await page.locator('body').getAttribute('data-screen'), 'construct');
    assert.ok(await noHorizontalScroll(page));
    assert.match(await page.locator('#builder-progress-text').textContent(), /1 из 5/);
    const firstHelp = page.locator('.builder-help summary').first();
    assert.match(await firstHelp.getAttribute('aria-label'), /Страна/);
    await firstHelp.focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('.builder-help').first().getAttribute('open'), '');
    await page.keyboard.press('Enter');
    await page.locator('#builder-language').selectOption('en');
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    await page.locator('#builder-mode').click();
    await page.locator('#cb-country').fill('Ethiopia');
    await page.locator('#cb-processing').selectOption('washed');
    await page.locator('#cb-age').selectOption('fresh');
    await page.locator('#cb-roast-pro').selectOption('2');
    await page.locator('#builder-next').click();
    assert.match(await page.locator('#builder-progress-text').textContent(), /2 of 5/);
    assert.ok(await noHorizontalScroll(page));
    await page.locator('#cb-grinder').fill('Comandante C40 (standard axle)');
    await page.locator('#cb-device').selectOption('v60');
    await page.locator('#builder-next').click();
    await page.waitForSelector('.builder-recipe');
    assert.match(await page.locator('.builder-origin').textContent(), /not a roaster recipe/);
    assert.match(await page.locator('#builder-recipe-title').textContent(), /Brighter/);
    assert.ok(await noHorizontalScroll(page));
    assert.ok(await page.locator('#builder-next').isVisible());
    assert.ok(await page.locator('[data-adjust="dose_g:1"]').getAttribute('aria-label'));
    const ctaVisible = await page.locator('#builder-next').evaluate(el => {
      const rect = el.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= innerHeight;
    });
    assert.ok(ctaVisible, 'brew action stays visible on the phone');
    if (process.env.POURPOUR_SCREEN_DIR) {
      fs.mkdirSync(process.env.POURPOUR_SCREEN_DIR, {recursive: true});
      await page.screenshot({path: path.join(process.env.POURPOUR_SCREEN_DIR, 'constructor-mobile.png'), fullPage: true});
    }
    const doseBefore = await page.locator('.builder-tile').first().locator('strong').textContent();
    await page.locator('[data-adjust="dose_g:1"]').click();
    await page.waitForFunction(before => document.querySelector('.builder-tile strong')?.textContent !== before, doseBefore);
    assert.match(await page.locator('.builder-table').textContent(), /On scale/);
    await page.locator('#builder-next-variant').click();
    assert.match(await page.locator('#builder-recipe-title').textContent(), /Sweeter/);
    await page.locator('#builder-favorite').click();
    assert.equal(await page.locator('#builder-favorite').getAttribute('aria-pressed'), 'true');
    await page.locator('#builder-next').click();
    assert.equal(await page.locator('body').getAttribute('data-screen'), 'brew');
    await page.goBack();
    await page.waitForFunction(() => document.body.dataset.screen === 'construct');
    await page.locator('#builder-back').click();
    await page.locator('#cb-device').selectOption('french_press');
    await page.locator('#builder-next').click();
    await page.waitForFunction(() => document.querySelector('#builder-result')?.textContent?.includes('Steep'));
    assert.equal(await page.locator('#builder-next').isDisabled(), true);
    assert.match(await page.locator('#builder-result').textContent(), /no manual pours|next phase/i);
    await page.locator('#builder-back').click();
    await page.locator('#cb-device').selectOption('moccamaster');
    await page.locator('#builder-next').click();
    await page.waitForFunction(() => document.querySelector('#builder-result')?.textContent?.includes('standard mode'));
    assert.equal(await page.locator('.builder-table').count(), 0);
    assert.ok(await noHorizontalScroll(page));
    await page.locator('#builder-back').click();
    await page.locator('#builder-mode').click();
    await page.locator('#cb-device').selectOption('custom_dripper');
    await page.locator('#cb-custom-name').fill('Home cone');
    await page.locator('#cb-bed-height').fill('35');
    await page.locator('#cb-filter-fit').selectOption('tight');
    await page.locator('#cb-material').selectOption('plastic');
    await page.locator('#builder-next').click();
    await page.waitForFunction(() => document.querySelector('#builder-result')?.textContent?.includes('Pour gently near the center'));
    assert.equal(await page.locator('#builder-next').isDisabled(), false);
    assert.ok(await noHorizontalScroll(page));
    const small = await page.evaluate(() => [...document.querySelectorAll('#screen-construct button, #screen-construct select, #screen-construct input')]
      .filter(el => el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden' && !el.matches('input[type=radio]'))
      .map(el => ({id: el.id || el.className, rect: el.getBoundingClientRect()}))
      .filter(({rect}) => rect.width < 48 || rect.height < 48)
      .map(({id}) => id));
    assert.deepEqual(small, []);
    await page.setViewportSize({width: 1100, height: 800});
    assert.equal(await page.locator('.builder-form-pane').isVisible(), true);
    assert.equal(await page.locator('.builder-result-pane').isVisible(), true);
    assert.ok(await noHorizontalScroll(page));
    if (process.env.POURPOUR_SCREEN_DIR) {
      await page.screenshot({path: path.join(process.env.POURPOUR_SCREEN_DIR, 'constructor-desktop.png'), fullPage: true});
    }
    assert.deepEqual(errors, []);
    console.log('PASS constructor: basic/Pro, calculated variants, rescale, favorites, immersion and automatic, 375×812 and desktop.');
  } finally {
    await browser.close();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
