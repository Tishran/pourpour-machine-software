// Constructor smoke check at 375×812: parameter wizard, calculated timer, machine handoff,
// then the taste/refractometer rating and the corrected recipe (phase 6).
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const baseURL = process.env.POURPOUR_TEST_URL || 'http://127.0.0.1:8013';
const channel = process.env.POURPOUR_BROWSER_CHANNEL || undefined;
const noHorizontalScroll = page => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
const screenshot = async (page, name) => {
  if (process.env.POURPOUR_SCREEN_DIR) await page.screenshot({path: path.join(process.env.POURPOUR_SCREEN_DIR, name), fullPage: true});
};
const smallTargets = page => page.evaluate(() => [...document.querySelectorAll('#screen-construct button, #screen-construct select, #screen-construct input')]
  .filter(el => el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden' && !el.matches('input[type=radio]'))
  .map(el => ({id: el.id || el.dataset.tasteHelp || el.value || el.className, rect: el.getBoundingClientRect()}))
  .filter(({rect}) => rect.width < 48 || rect.height < 48)
  .map(({id}) => id));
const smallText = (page, selector) => page.evaluate(selector => [...document.querySelectorAll(selector)]
  .filter(el => el.offsetParent !== null && parseFloat(getComputedStyle(el).fontSize) < 14)
  .map(el => el.textContent.trim().slice(0, 30)), selector);

async function checkFeedback(browser) {
  const context = await browser.newContext({viewport: {width: 375, height: 812}});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(baseURL);
  await page.evaluate(() => localStorage.clear());
  // Form → recipe → timer.
  await page.locator('#open-builder').click();
  await page.waitForSelector('#cb-country');
  await page.locator('#cb-country').fill('Эфиопия');
  await page.locator('#cb-processing').selectOption('washed');
  await page.locator('#builder-next').click();
  await page.locator('#cb-grinder').fill('Comandante C40 (стандартная ось)');
  await page.locator('#builder-next').click();
  await page.waitForSelector('#builder-result .builder-recipe');
  assert.match(await page.locator('#builder-secondary').textContent(), /Оценить вкус/);
  assert.ok(await page.locator('#builder-secondary').isVisible(), 'rate action sits next to brew');
  const brewedTemperature = await page.locator('#builder-result .builder-tile').nth(2).locator('strong').textContent();
  await page.locator('#builder-next').click();
  await page.locator('#brew-toggle').click();
  await page.evaluate(() => window.firstBrew.seek(100000));
  assert.ok(await page.locator('#brew-rate').isVisible(), 'a finished calculated brew offers the rating');
  assert.match(await page.locator('#brew-done-text').textContent(), /оцените вкус/);
  await page.locator('#brew-rate').click();
  await page.waitForFunction(() => document.body.dataset.screen === 'construct' &&
    document.getElementById('screen-construct').dataset.step === '3');
  // Step 4: taste descriptors in three groups, conflicts switched off, toggletips.
  assert.match(await page.locator('#builder-progress-text').textContent(), /4 из 5/);
  assert.equal(await page.locator('.taste-group').count(), 3);
  assert.equal(await page.locator('[name="taste"]').count(), 14);
  assert.equal(await page.locator('#builder-next').isDisabled(), true, 'nothing to correct before a choice');
  const sour = page.locator('[name="taste"][value="sour"]');
  await sour.focus();
  await page.keyboard.press('Space');
  assert.equal(await sour.isChecked(), true, 'descriptors work from the keyboard');
  for (const blocked of ['sweet', 'balanced', 'bitter']) {
    assert.equal(await page.locator(`[name="taste"][value="${blocked}"]`).isDisabled(), true, `${blocked} conflicts with sour`);
  }
  const help = page.locator('[data-taste-help="sour"]');
  assert.match(await help.getAttribute('aria-label'), /Кисло/);
  await help.click();
  assert.equal(await help.getAttribute('aria-expanded'), 'true');
  assert.match(await page.locator('#taste-explain-acidity_sweetness').textContent(), /недозрелого/);
  await page.locator('[name="taste"][value="watery"]').check();
  assert.equal(await page.locator('[name="taste"][value="syrupy"]').isDisabled(), true, 'thin and thick body exclude each other');
  assert.match(await page.locator('#feedback-count').textContent(), /2 из 3/);
  assert.ok(await noHorizontalScroll(page));
  assert.deepEqual(await smallTargets(page), []);
  assert.deepEqual(await smallText(page, '.taste-choice span, .feedback-rated strong, #builder-intro'), []);
  await screenshot(page, 'feedback-taste-mobile.png');
  // Step 5: diagnosis, chart, what changed and the corrected recipe.
  await page.locator('#builder-next').click();
  await page.waitForFunction(() => document.getElementById('screen-construct').dataset.step === '4');
  assert.match(await page.locator('#builder-progress-text').textContent(), /5 из 5/);
  assert.match(await page.locator('#correction-title').textContent(), /раскрытия/);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'correction-title');
  assert.equal(await page.locator('.extraction-chart svg[role="img"]').count(), 1);
  assert.match(await page.locator('#chart-desc').textContent(), /Оценка по вкусу/);
  assert.equal(await page.locator('.chart-estimate').count(), 1, 'taste gives a band, not a point');
  assert.equal(await page.locator('.chart-cup').count(), 0);
  assert.equal(await page.locator('.chart-ratio').count(), 11, 'ratio diagonals 1:12…1:22');
  assert.equal(await page.locator('.correction-changes li').count(), 2, 'one or two parameters change');
  assert.match(await page.locator('.correction-changes').textContent(), /°C → .*°C/);
  const correctedTemperature = await page.locator('#builder-correction .builder-tile').nth(2).locator('strong').textContent();
  assert.ok(parseInt(correctedTemperature) > parseInt(brewedTemperature), 'sour cup gets hotter water');
  assert.match(await page.locator('.correction-name').textContent(), /правка 1/);
  assert.ok(await noHorizontalScroll(page));
  assert.deepEqual(await smallTargets(page), []);
  assert.deepEqual(await smallText(page, '.correction-explanation, .correction-changes strong, .chart-legend li, .extraction-chart figcaption p'), []);
  const ctaVisible = await page.locator('#builder-secondary').evaluate(el => el.getBoundingClientRect().bottom <= innerHeight);
  assert.ok(ctaVisible, 'save and brew stay reachable');
  await screenshot(page, 'correction-taste-mobile.png');
  // Editable fields, save as mine, brew the corrected recipe.
  await page.locator('[data-correction-adjust="temperature_c:1"]').click();
  assert.equal(await page.evaluate(() => document.activeElement.dataset.correctionAdjust), 'temperature_c:1');
  assert.equal(parseInt(await page.locator('#builder-correction .builder-tile').nth(2).locator('strong').textContent()),
    parseInt(correctedTemperature) + 1);
  await page.locator('[data-correction-adjust="water_g:10"]').click();
  await page.waitForFunction(() => document.querySelector('#builder-correction .builder-table tr:last-child td:nth-child(2)')?.textContent.includes(
    document.querySelectorAll('#builder-correction .builder-tile strong')[1].textContent.replace(/\D/g, '')));
  await page.locator('#builder-secondary').click();
  assert.match(await page.locator('#builder-cta-status').textContent(), /сохранён/);
  assert.equal(await page.locator('#builder-secondary').isDisabled(), true);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('firstbrew.myRecipes.v1')));
  assert.equal(saved.length, 1);
  assert.equal(saved[0].format, 'firstbrew.recipe');
  assert.equal(saved[0].recipe.origin, 'calculated');
  assert.equal(saved[0].recipe.revision, 1);
  assert.deepEqual(saved[0].feedback, {descriptors: ['sour', 'watery']});
  await page.locator('#builder-next').click();
  assert.equal(await page.locator('body').getAttribute('data-screen'), 'brew');
  assert.match(await page.locator('#brew-ready-name').textContent(), /правка 1/);
  // A second cup, measured with a refractometer.
  await page.locator('#brew-toggle').click();
  await page.evaluate(() => window.firstBrew.seek(100000));
  await page.locator('#brew-rate').click();
  await page.waitForFunction(() => document.getElementById('screen-construct').dataset.step === '3');
  assert.match(await page.locator('.feedback-rated strong').textContent(), /правка 1/);
  assert.equal(await page.locator('[name="taste"]:checked').count(), 0, 'a new cup starts a new rating');
  await page.locator('[data-feedback-mode="measure"]').click();
  assert.equal(await page.locator('[data-feedback-mode="measure"]').getAttribute('aria-pressed'), 'true');
  const dose = await page.locator('#fb-dose').inputValue();
  await page.locator('#fb-tds').fill('1.1');
  await page.locator('#fb-yield').fill('200');
  await page.locator('#fb-drawdown').fill('190');
  await page.locator('#fb-dose').fill(String(Number(dose) + 2));
  assert.match(await page.locator('#feedback-measure-error').textContent(), /Доза должна совпадать/);
  assert.equal(await page.locator('#builder-next').isDisabled(), true);
  await page.locator('#fb-dose').fill(dose);
  assert.match(await page.locator('#feedback-extraction').textContent(), /Экстракция ≈ \d+,\d %/);
  assert.equal(await page.locator('#builder-next').isDisabled(), false);
  assert.deepEqual(await smallTargets(page), []);
  await screenshot(page, 'feedback-meter-mobile.png');
  await page.locator('#builder-next').click();
  await page.waitForFunction(() => document.getElementById('screen-construct').dataset.step === '4');
  assert.match(await page.locator('.correction-kind').textContent(), /по измерению/);
  assert.equal(await page.locator('.chart-cup').count(), 1, 'a measurement is a point');
  assert.match(await page.locator('.correction-explanation').textContent(), /Экстракция \d+,\d %/);
  assert.match(await page.locator('.correction-name').textContent(), /правка 2/);
  assert.ok(await noHorizontalScroll(page));
  await screenshot(page, 'correction-meter-mobile.png');
  // Back returns to the rating with the entries kept; English re-renders in place.
  await page.locator('#builder-back').click();
  assert.equal(await page.locator('#fb-tds').inputValue(), '1.1');
  await page.locator('#builder-language').selectOption('en');
  assert.match(await page.locator('#builder-progress-text').textContent(), /Step 4 of 5/);
  assert.match(await page.locator('#builder-next').textContent(), /Get a correction/);
  // Desktop: rating on the left, the correction on the right, updated live.
  await page.setViewportSize({width: 1100, height: 820});
  await page.locator('[data-feedback-mode="taste"]').click();
  await page.locator('[name="taste"][value="bitter"]').check();
  await page.locator('#builder-next').click();
  await page.waitForFunction(() => document.getElementById('correction-title')?.textContent === 'Extract more gently');
  assert.ok(await page.locator('#builder-feedback').isVisible());
  assert.ok(await page.locator('#builder-correction').isVisible());
  await page.locator('[name="taste"][value="bitter"]').uncheck();
  await page.locator('[name="taste"][value="balanced"]').check();
  await page.waitForFunction(() => document.getElementById('correction-title')?.textContent === 'The recipe is on target');
  assert.match(await page.locator('#builder-next').textContent(), /^Brew this recipe$/);
  assert.ok(await noHorizontalScroll(page));
  await screenshot(page, 'correction-desktop.png');
  // Closing the wizard returns to the start screen.
  await page.setViewportSize({width: 375, height: 812});
  await page.locator('#builder-close').click();
  assert.equal(await page.locator('body').getAttribute('data-screen'), 'find');
  assert.deepEqual(errors, []);
  await context.close();
}

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
    assert.match(await page.locator('#builder-result .builder-origin').textContent(), /not a roaster recipe/);
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
    assert.equal(await page.locator('#brew-ready').isVisible(), true);
    assert.match(await page.locator('#brew-toggle').textContent(), /Start timer/);
    assert.equal(await page.locator('#brew-ready-grid > div').count(), 4);
    assert.ok(await noHorizontalScroll(page));
    if (process.env.POURPOUR_SCREEN_DIR) {
      await page.screenshot({path: path.join(process.env.POURPOUR_SCREEN_DIR, 'timer-ready-mobile.png'), fullPage: true});
    }
    await page.locator('#brew-toggle').click();
    assert.equal(await page.locator('#brew-ready').isVisible(), false);
    assert.match(await page.locator('#brew-clock').textContent(), /\//);
    assert.match(await page.locator('#brew-step-count').textContent(), /Step 1 \/ /);
    assert.match(await page.locator('#brew-pour-value').textContent(), /g/);
    if (process.env.POURPOUR_SCREEN_DIR) {
      await page.screenshot({path: path.join(process.env.POURPOUR_SCREEN_DIR, 'timer-pour-mobile.png'), fullPage: true});
    }
    await page.evaluate(() => { startedAt = Date.now() - 5000; updateTimer(); });
    assert.match(await page.locator('#brew-clock').textContent(), /^0:05 \/ /);
    await page.locator('#brew-next-step').click();
    assert.match(await page.locator('#brew-step-count').textContent(), /Step 2 \/ /);
    assert.match(await page.locator('#brew-phase').textContent(), /Waiting/);
    await page.locator('#brew-toggle').click();
    assert.match(await page.locator('#brew-toggle').textContent(), /Resume/);
    await page.locator('#brew-prev-step').click();
    assert.match(await page.locator('#brew-step-count').textContent(), /Step 1 \/ /);
    await page.goBack();
    await page.waitForFunction(() => document.body.dataset.screen === 'construct');
    await page.locator('#builder-back').click();
    await page.locator('#cb-device').selectOption('french_press');
    await page.locator('#builder-next').click();
    await page.waitForFunction(() => document.querySelector('#builder-result')?.textContent?.includes('Steep'));
    assert.equal(await page.locator('#builder-next').isDisabled(), false);
    await page.locator('#builder-next').click();
    await page.locator('#brew-toggle').click();
    await page.locator('#brew-next-step').click();
    assert.match(await page.locator('#brew-action').textContent(), /Steep/);
    assert.equal(await page.locator('#brew-pour-value').textContent(), '—');
    await page.goBack();
    await page.locator('#builder-back').click();
    await page.locator('#cb-device').selectOption('moccamaster');
    await page.locator('#builder-next').click();
    await page.waitForFunction(() => document.querySelector('#builder-result')?.textContent?.includes('standard mode'));
    assert.equal(await page.locator('.builder-table').count(), 0);
    assert.equal(await page.locator('#builder-next').isDisabled(), false);
    await page.locator('#builder-next').click();
    await page.locator('#brew-toggle').click();
    assert.match(await page.locator('#brew-action').textContent(), /Brewer running/);
    await page.goBack();
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
    const machinePage = await context.newPage();
    let sentRecipe = null;
    await machinePage.addInitScript(() => { window.EventSource = class { addEventListener() {} }; });
    await machinePage.route('**/api/machine', route => route.fulfill({status: 200, contentType: 'application/json',
      body: JSON.stringify({enabled: true, connected: true, telemetry: {state: 'IDLE', temp_c: 24}})}));
    await machinePage.route('**/api/machine/recipe', route => {
      sentRecipe = route.request().postDataJSON().recipe;
      route.fulfill({status: 200, contentType: 'application/json',
        body: JSON.stringify({telemetry: {state: 'PREHEAT', temp_c: 24, target_temp_c: sentRecipe.temperature_c}})});
    });
    await machinePage.goto(baseURL);
    await machinePage.locator('#open-builder').click();
    await machinePage.waitForSelector('#cb-country');
    await machinePage.locator('#builder-language').selectOption('ru');
    await machinePage.locator('#builder-next').click();
    await machinePage.locator('#cb-device').selectOption('v60');
    await machinePage.locator('#builder-next').click();
    await machinePage.waitForSelector('#builder-machine:visible');
    await machinePage.locator('#builder-next').click();
    assert.match(await machinePage.locator('#brew-toggle').textContent(), /Запустить таймер/);
    assert.ok(await noHorizontalScroll(machinePage));
    if (process.env.POURPOUR_SCREEN_DIR) {
      await machinePage.screenshot({path: path.join(process.env.POURPOUR_SCREEN_DIR, 'timer-ready-ru-mobile.png'), fullPage: true});
    }
    await machinePage.goBack();
    await machinePage.locator('#builder-machine').click();
    await machinePage.waitForFunction(() => document.body.dataset.screen === 'brew');
    assert.equal(sentRecipe.origin, 'calculated');
    assert.ok(sentRecipe.steps.every(step => step.kind === 'pour'));
    assert.equal(await machinePage.locator('#brew-ready').isVisible(), false);
    await checkFeedback(browser);
    console.log('PASS constructor: recipe timer, wait/steep/automatic, taste and refractometer corrections, navigation, 375×812 and desktop.');
  } finally {
    await browser.close();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
