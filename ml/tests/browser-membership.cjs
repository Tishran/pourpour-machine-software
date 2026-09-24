// Membership at 375×812: the first-run choice, Learn why, the free correction and the lock,
// the plans screen, a member's experiment and journal, and the owner's machine on the free plan.
// Run the app with the simulator:
//   python3 webapp/server.py --port 8013 --machine sim --sim-speed 20
// then: POURPOUR_TEST_URL=http://127.0.0.1:8013 node ml/tests/browser-membership.cjs
// POURPOUR_SCREEN_DIR=docs/screens/membership also saves the screenshots.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');

const baseURL = process.env.POURPOUR_TEST_URL || 'http://127.0.0.1:8013';
const channel = process.env.POURPOUR_BROWSER_CHANNEL || undefined;
const phone = {viewport: {width: 375, height: 812}, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'ru-RU'};
const screen = page => page.evaluate(() => document.body.dataset.screen);
const text = (page, selector) => page.locator(selector).first().textContent();
const noHorizontalScroll = page => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
const snap = async (page, name, fullPage = false) => {
  if (process.env.POURPOUR_SCREEN_DIR) await page.screenshot({path: path.join(process.env.POURPOUR_SCREEN_DIR, name), fullPage});
};
const step = page => page.evaluate(() => document.getElementById('screen-construct').dataset.step);

// Finish the brew on the timer that is showing, then open the rating.
async function finishAndRate(page) {
  await page.waitForFunction(() => document.body.dataset.screen === 'brew');
  await page.evaluate(() => window.firstBrew.seek(100000));
  await page.locator('#brew-rate').click();
  await page.waitForFunction(() => document.body.dataset.screen === 'construct' &&
    document.getElementById('screen-construct').dataset.step === '3');
}

async function learnAndLock(browser) {
  const context = await browser.newContext(phone);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    // 1. Empty storage → the first-run choice → Teach me.
    await page.goto(baseURL);
    assert.equal(await screen(page), 'start');
    assert.equal(await text(page, '#start-title'), 'Как вы хотите варить кофе?');
    assert.deepEqual(await page.locator('.start-card strong').allTextContents(),
      ['Научи меня', 'У меня машина First Brew', 'Просто рецепт сейчас']);
    assert.ok(await noHorizontalScroll(page));
    await snap(page, 'fork.png');
    await page.locator('#start-learn').click();
    assert.equal(await screen(page), 'find');
    assert.equal(await page.evaluate(() => document.body.dataset.mode), 'learn');
    await page.waitForSelector('#home-lesson');
    assert.match(await text(page, '#home-lesson'), /Начать первый урок/);
    await snap(page, 'home-learn.png');

    // Roaster recipe from the search; "Why?" next to the grind opens one or two sentences.
    await page.locator('#query').fill('суса');
    await page.locator('#results .coffee').first().click();
    await page.waitForSelector('.figures');
    assert.equal(await page.locator('.figures .why-button').count(), 4, 'dose, water, temperature, time');
    const grindWhy = page.locator('.line .why-button').first();
    await grindWhy.click();
    assert.equal(await grindWhy.getAttribute('aria-expanded'), 'true');
    const panel = page.locator('.line').first().locator('xpath=..').locator('.why-panel');
    assert.ok(await panel.isVisible());
    assert.match(await panel.textContent(), /Помол — Мельче помол открывает воде больше поверхности кофе/);
    assert.match(await panel.textContent(), /настройка обжарщика/, 'no guess at the roaster’s intent');
    await grindWhy.scrollIntoViewIfNeeded();
    await snap(page, 'recipe-why.png');

    // The timer says why the current step is there; one tap hides it.
    await page.locator('#brew-start').click();
    await page.evaluate(() => window.firstBrew.seek(3));
    assert.match(await text(page, '#brew-why'), /^Блум:/);
    await page.locator('#brew-why-toggle').click();
    assert.equal(await page.locator('#brew-why').isVisible(), false);
    await page.locator('#brew-why-toggle').click();
    assert.ok(await page.locator('#brew-why').isVisible());

    // Rating → the first correction is free → "What you learned".
    await finishAndRate(page);
    assert.doesNotMatch(await text(page, '#builder-next'), /🔒/);
    await page.locator('[name="taste"][value="sour"]').check();
    await page.locator('#builder-next').click();
    await page.waitForSelector('#takeaway');
    assert.match(await text(page, '#takeaway'), /Что вы узнали[\s\S]*Кисло или пусто → вкусу не хватило экстракции/);
    assert.equal(await page.locator('#lock-sheet').isVisible(), false);
    await page.locator('#takeaway').scrollIntoViewIfNeeded();
    await snap(page, 'takeaway.png');

    // 2. The second correction shows the lock; one tap closes the sheet.
    await page.locator('#builder-next').click();  // brew the corrected recipe
    await page.waitForFunction(() => document.body.dataset.screen === 'brew');
    await page.locator('#brew-toggle').click();
    await finishAndRate(page);
    assert.match(await text(page, '#builder-next'), /^🔒 Получить правку/);
    await page.locator('[name="taste"][value="bitter"]').check();
    await page.locator('#builder-next').click();
    await page.locator('#lock-sheet').waitFor({state: 'visible'});
    assert.match(await text(page, '#lock-title'), /Исправленный рецепт после каждой чашки/);
    assert.equal(await text(page, '#lock-demo'), 'Демо: оплата не подключена');
    await snap(page, 'lock-sheet.png');
    await page.locator('#lock-later').click();
    assert.equal(await page.locator('#lock-sheet').isVisible(), false);
    assert.equal(await step(page), '3', 'the rating stays where it was');
    await page.locator('#builder-next').click();
    assert.equal(await page.locator('#lock-sheet').isVisible(), false, 'once per screen per visit');
    assert.match(await text(page, '#builder-status'), /🔒 Исправленный рецепт после каждой чашки/);

    // 3. Plans: three cards, the demo note and No lock-in, in both languages.
    await page.goto(baseURL);
    await page.locator('#open-plans').click();
    assert.equal(await screen(page), 'plans');
    assert.equal(await page.locator('.plan-card').count(), 3);
    assert.equal(await page.locator('.plan-card.featured').getAttribute('data-plan'), 'member');
    assert.equal(await text(page, '#plans-demo'), 'Демо: оплата не подключена');
    assert.match(await text(page, '#plans-lock-in'), /^No lock-in: машина варит сохранённые рецепты и без подписки/);
    assert.match(await text(page, '#plans-cheaper'), /300\s₽.*дешевле одной чашки в кофейне \(500\s₽\)/);
    assert.match(await text(page, '[data-plan="member"] .plan-price'), /≈\s300\s₽/);
    assert.ok(await noHorizontalScroll(page));
    await snap(page, 'plans.png', true);
    await page.locator('#plans-back').click();
    await page.locator('#language').selectOption('en');
    await page.locator('#open-plans').click();
    assert.equal(await text(page, '#plans-title'), 'One membership. Three ways in.');
    assert.deepEqual(await page.locator('.plan-tagline').allTextContents(), ['Try it', 'Teach me', 'Brew it for me']);
    assert.match(await text(page, '#plans-lock-in'), /^No lock-in: the machine brews your saved recipes/);
    assert.equal(await text(page, '#plans-demo'), 'Demo: payment is not connected');
    await page.locator('#plans-back').click();
    await page.locator('#language').selectOption('ru');
    await page.locator('#open-plans').click();

    // 4. Demo member → an experiment lesson → the journal shows the cups.
    await page.locator('[data-demo-plan="member"]').click();
    assert.match(await text(page, '#plans-status'), /Демо-тариф включён/);
    await page.locator('#plans-back').click();
    await page.locator('#home-school-all').click();
    assert.equal(await screen(page), 'school');
    assert.equal(await page.locator('#school-modules .lesson-badge:not(.done)').count(), 0, 'nothing is locked for a member');
    await snap(page, 'school.png', true);
    await page.locator('[data-lesson="grind_experiment"]').click();
    assert.equal(await screen(page), 'lesson');
    await page.locator('[data-lesson-action="next"]').click();
    await page.locator('[data-lesson-action="next"]').click();
    // A quick check after the theory: the answer is explained either way.
    assert.match(await text(page, '.lesson-count'), /Вопрос 1 из 1/);
    assert.ok(await page.locator('[data-lesson-action="quiz-next"]').isDisabled(), 'answer first');
    await page.locator('[data-quiz-option="0"]').click();
    assert.match(await text(page, '.quiz-explain'), /^Верно\./);
    await page.locator('[data-lesson-action="quiz-next"]').click();
    await page.waitForSelector('[data-lesson-action="brew-b"]');
    // Guess, then taste: cup B waits for the guess.
    assert.ok(await page.locator('[data-lesson-action="brew-b"]').isDisabled());
    await page.locator('[data-predict="fuller"]').click();
    assert.match(await text(page, '.prediction-made'), /Ваш прогноз: Насыщеннее, слаще/);
    assert.equal(await page.locator('[data-lesson-action="brew-b"]').isDisabled(), false);
    assert.match(await text(page, '#lesson-body .note'), /помол на шаг мельче, всё остальное то же/);
    assert.equal(await page.locator('.experiment-summary .changed').count(), 1, 'one change stands out');
    assert.ok(await page.locator('[data-lesson-action="compare"]').isDisabled());
    await snap(page, 'experiment.png', true);
    for (const cup of ['a', 'b']) {
      await page.locator(`[data-lesson-action="brew-${cup}"]`).click();
      await page.waitForFunction(() => document.body.dataset.screen === 'brew');
      await page.locator('#brew-toggle').click();
      await page.evaluate(() => window.firstBrew.seek(100000));
      assert.equal(await page.locator('#brew-rate').isVisible(), false, 'an experiment is compared, not corrected');
      await page.locator('#brew-lesson').click();
      await page.waitForFunction(() => document.body.dataset.screen === 'lesson');
    }
    await page.locator('[data-lesson-action="compare"]').click();
    await page.locator('[data-exp-choice="b"]').click();
    await page.locator('[data-exp-taste="sweet"]').check();
    assert.ok(await page.locator('[data-lesson-action="conclude"]').isDisabled(), 'what was different in cup B?');
    await page.locator('[data-observe="fuller"]').click();
    await page.locator('[data-lesson-action="conclude"]').click();
    assert.match(await text(page, '#lesson-body .takeaway'), /Вам вкуснее помол мельче/);
    assert.match(await text(page, '.prediction-result'), /Прогноз совпал[\s\S]*Именно так обычно действует/);
    assert.match(await text(page, '#lesson-body .model-card:not(.prediction-result)'), /Ваш выбор между чашками сдвинул модель/);
    assert.equal(await page.locator('#lesson-body .model-chart').count(), 1);
    const school = await page.evaluate(() => JSON.parse(localStorage.getItem('firstbrew.school.v1')));
    assert.equal(school.experiments.grind_experiment.choice, 'b');
    assert.deepEqual([school.experiments.grind_experiment.predicted, school.experiments.grind_experiment.observed, school.experiments.grind_experiment.quiz],
      ['fuller', 'fuller', '1/1']);
    await page.goto(baseURL);
    await page.locator('#open-progress').click();
    assert.equal(await screen(page), 'progress');
    const entries = await page.locator('.journal-entry').allTextContents();
    assert.equal(entries.length, 4, 'roaster cup, corrected cup and two experiment cups');
    assert.match(entries[0], /Эксперимент: помол · Чашка B[\s\S]*сладко/);
    assert.match(entries.at(-1), /Руанда Суса[\s\S]*кисло · нужно больше раскрытия/);
    assert.equal(await page.locator('#progress-more, #progress-unlock').count(), 0, 'a member sees the whole journal');
    assert.match(await text(page, '.progress-card'), /0 из 1/, 'one rated cup, not on target');
    await snap(page, 'progress.png', true);
    assert.deepEqual(errors, []);
    console.log('PASS learn: first-run choice → Learn why → timer note → free correction → What you learned → lock on the second → plans RU/EN → member experiment → journal.');
  } finally { await context.close(); }
}

// 5. Plan free + "I have a First Brew machine": the roaster recipe and saved recipes brew on the machine.
async function ownerWithoutMembership(browser) {
  const status = await (await fetch(`${baseURL}/api/machine`)).json();
  assert.equal(status.enabled, true, 'start the server with --machine sim');
  if (status.state !== 'IDLE') await fetch(`${baseURL}/api/machine/abort`, {method: 'POST'});
  const built = (await (await fetch(`${baseURL}/api/recipes/build`, {method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({params: {device_id: 'v60'}})})).json()).variants;
  const context = await browser.newContext(phone);
  // Five recipes saved earlier (for example while a member): over the free limit, never blocked.
  await context.addInitScript(recipes => {
    if (localStorage.getItem('firstbrew.myRecipes.v1')) return;
    localStorage.setItem('firstbrew.myRecipes.v1', JSON.stringify(recipes.map((recipe, index) => ({
      format: 'firstbrew.recipe', version: 1, id: `own-saved-${index}`, key: `saved-${index}`,
      saved_at: new Date(Date.now() - index * 3600000).toISOString(), source: 'built', title: `Мой рецепт ${index + 1}`,
      context_chips: ['Hario V60'], brew_count: 0, last_brewed_at: null, recipe}))));
  }, [0, 1, 2, 3, 4].map(index => built[index % 2]));
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const machineBrews = async () => {
    await page.waitForFunction(() => document.body.dataset.screen === 'brew');
    await page.waitForFunction(() => ['Греем воду', 'Готово'].includes(document.getElementById('brew-phase').textContent), null, {timeout: 15000});
    await page.locator('#brew-reset').click();
    await page.waitForFunction(() => document.getElementById('brew-phase').textContent === 'Остановлено', null, {timeout: 5000});
  };
  try {
    await page.goto(baseURL);
    await page.locator('#start-machine').click();
    const state = await page.evaluate(() => JSON.parse(localStorage.getItem('firstbrew.membership.v1')));
    assert.equal(state.plan, 'free');
    assert.equal(state.machineOwner, true);
    await page.waitForFunction(() => /на связи/.test(document.querySelector('.home-machine-status')?.textContent || ''));
    assert.equal(await page.locator('#home-machine [data-machine-item]').count(), 4, 'the latest recipes, ready for the machine');
    await snap(page, 'home-machine.png', true);
    // The roaster recipe.
    await page.locator('#query').fill('суса');
    await page.locator('#results .coffee').first().click();
    await page.locator('#machine-start').waitFor({state: 'visible'});
    await page.locator('#machine-start').click();
    await machineBrews();
    // A saved recipe beyond the free limit: listed, opened and brewed on the machine.
    await page.goto(baseURL);
    await page.locator('#open-mine').click();
    assert.equal(await page.locator('#mine-list .own-card').count(), 5);
    await page.locator('#mine-list .own-card').last().click();
    assert.equal(await text(page, '#own-primary'), 'Заварить', 'no lock on a saved recipe');
    await page.locator('#own-machine').waitFor({state: 'visible'});
    await page.locator('#own-machine').click();
    await machineBrews();
    // A new saved recipe is over the free limit: that one shows the lock.
    await page.goto(baseURL);
    await page.locator('#open-builder').click();
    await page.waitForSelector('#cb-country');
    await page.locator('#builder-next').click();
    await page.locator('#builder-next').click();
    await page.waitForSelector('#builder-favorite');
    assert.match(await text(page, '#builder-favorite'), /^🔒 Сохранить в мои рецепты/);
    await page.locator('#builder-favorite').click();
    assert.match(await text(page, '#lock-title'), /Сколько угодно своих рецептов/);
    await page.locator('#lock-later').click();
    assert.equal((await page.evaluate(() => JSON.parse(localStorage.getItem('firstbrew.myRecipes.v1')))).length, 5,
      'nothing was removed');
    assert.deepEqual(errors, []);
    console.log('PASS machine owner on the free plan: roaster recipe and a saved recipe over the limit brew on the machine; new saves show the lock.');
  } finally { await context.close(); }
}

// The sandbox and the personal taste model: move the levers, brew, rate, and the model learns.
async function sandboxAndModel(browser) {
  const context = await browser.newContext(phone);
  await context.addInitScript(() => {
    if (!localStorage.getItem('firstbrew.membership.v1')) localStorage.setItem('firstbrew.membership.v1', JSON.stringify({plan: 'member'}));
    if (!localStorage.getItem('firstbrew.settings.v1')) localStorage.setItem('firstbrew.settings.v1', JSON.stringify({mode: 'learn'}));
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const brewAndRate = async (grind, taste) => {
    await page.locator('#sandbox-grind').fill(String(grind));
    await page.waitForFunction(() => !document.getElementById('sandbox-brew').disabled);
    await page.locator('#sandbox-brew').click();
    await page.locator('#brew-toggle').click();
    await finishAndRate(page);
    await page.locator(`[name="taste"][value="${taste}"]`).check();
    await page.locator('#builder-next').click();
    await page.waitForSelector('#model-card');
  };
  try {
    await page.goto(baseURL);
    await page.locator('#home-school-all').click();
    await page.locator('#open-sandbox').click();
    await page.waitForSelector('#sandbox-grind');
    await page.locator('#sandbox-grind').fill('2');
    await page.locator('#sandbox-ratio').fill('-2');
    await page.waitForFunction(() => /Экстракция: \+2 шага/.test(document.querySelector('.sandbox-steps')?.textContent || ''));
    assert.match(await text(page, '#sandbox-grind-value'), /на 2 шага мельче/);
    assert.equal(await page.locator('.sandbox-result .model-odds').count(), 0, 'no chances before the model knows the taste');
    assert.match(await text(page, '.sandbox-result'), /Модель ещё не знает ваш вкус/);
    await page.waitForSelector('#sandbox-output .extraction-chart');
    assert.match(await text(page, '#sandbox-output'), /Меньше воды на ту же дозу: линия рецепта идёт выше/);
    assert.ok(await noHorizontalScroll(page));
    await snap(page, 'sandbox.png', true);
    // Bitter two steps finer, sour two steps coarser: the model brackets the sweet spot.
    await brewAndRate(2, 'bitter');
    assert.match(await text(page, '#model-card'), /Модель учла 1 оценку этого кофе/);
    await page.locator('#correction-sandbox').click();
    await brewAndRate(-2, 'sour');
    assert.match(await text(page, '#model-card'), /Модель учла 2 оценки этого кофе[\s\S]*Этот рецепт по модели: кисло \d+\s% · в ориентире \d+\s% · горько \d+\s%/);
    assert.equal(await page.locator('#model-card .model-before').count(), 1, 'the curve before this cup is drawn');
    await page.locator('#model-card').scrollIntoViewIfNeeded();
    await snap(page, 'model-card.png');
    await page.locator('#correction-sandbox').click();
    // The model now knows both sides: where it was bitter it expects bitter, where sour — sour.
    const oddsAt = async grind => {
      await page.locator('#sandbox-grind').fill(String(grind));
      await page.waitForFunction(() => /Ваша модель: кисло/.test(document.querySelector('.sandbox-result')?.textContent || ''));
      const [sour, ok, bitter] = (await text(page, '.sandbox-result .model-odds')).match(/\d+/g).map(Number);
      return {sour, ok, bitter};
    };
    const finer = await oddsAt(2), coarser = await oddsAt(-2), middle = await oddsAt(0);
    assert.ok(finer.bitter > 50 && coarser.sour > 50, `bitter where it was bitter, sour where it was sour: ${JSON.stringify({finer, coarser})}`);
    assert.ok(middle.ok > finer.ok && middle.ok > coarser.ok, `on target is likelier between the two cups: ${JSON.stringify(middle)}`);
    await page.goto(baseURL);
    await page.locator('#open-progress').click();
    assert.match(await text(page, '#progress-body'), /Модель вашего вкуса/);
    assert.deepEqual(errors, []);
    console.log('PASS sandbox and taste model: levers → exact strength line → brew → rate → the model learns and gives chances.');
  } finally { await context.close(); }
}

// RU/EN, light and dark, 320 px without horizontal scroll, and a private window without storage.
async function layouts(browser) {
  for (const colorScheme of ['light', 'dark']) {
    const context = await browser.newContext({...phone, viewport: {width: 320, height: 640}, colorScheme});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      await page.goto(baseURL);
      assert.ok(await noHorizontalScroll(page), 'fork');
      await page.locator('#start-skip').click();
      const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      assert.equal(background, colorScheme === 'dark' ? 'rgb(22, 22, 19)' : 'rgb(244, 241, 233)');
      for (const language of ['ru', 'en']) {
        await page.locator('#language').selectOption(language);
        assert.ok(await noHorizontalScroll(page), `home ${language}`);
        for (const [open, name] of [['#open-plans', 'plans'], ['#open-settings', 'settings']]) {
          await page.locator(open).click();
          assert.equal(await screen(page), name);
          assert.ok(await noHorizontalScroll(page), `${name} ${language} ${colorScheme}`);
          await page.goBack();
        }
      }
      await page.locator('#language').selectOption('ru');
      await page.evaluate(() => { location.hash = ''; });
      await page.locator('#open-plans').click();
      if (colorScheme === 'dark') await snap(page, 'plans-dark.png', true);
      await page.goBack();
      await page.locator('#champions').scrollIntoViewIfNeeded();
      assert.match(await text(page, '#champion-list'), /Скоро: рецепты чемпионов/, 'no pretend champion content');
      if (colorScheme === 'light') await snap(page, 'champions.png');
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  }
  // A private window where storage throws: the app still works for this visit.
  const context = await browser.newContext(phone);
  await context.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {get() { throw new DOMException('Blocked', 'SecurityError'); }});
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(baseURL);
    assert.equal(await screen(page), 'start');
    await page.locator('#start-learn').click();
    assert.equal(await screen(page), 'find');
    await page.locator('#open-plans').click();
    await page.locator('[data-demo-plan="member"]').click();
    assert.match(await text(page, '[data-plan="member"] .plan-current'), /Ваш тариф/, 'the demo plan lives in memory');
    await page.locator('#plans-back').click();
    await page.locator('#home-school-all').click();
    assert.equal(await page.locator('#school-modules .lesson-item').count(), 14);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
  // Desktop plans side by side.
  const desktop = await browser.newPage({viewport: {width: 1280, height: 900}});
  try {
    await desktop.goto(baseURL);
    await desktop.locator('#start-skip').click();
    await desktop.locator('#open-plans').click();
    const tops = await desktop.locator('.plan-card').evaluateAll(cards => cards.map(card => card.getBoundingClientRect().top));
    assert.ok(tops.every(top => Math.abs(top - tops[0]) < 2), 'three cards in a row on desktop');
    await snap(desktop, 'plans-desktop.png', true);
  } finally { await desktop.close(); }
  console.log('PASS layouts: RU and EN, light and dark, 320 px without horizontal scroll, private window, desktop plans.');
}

(async () => {
  const browser = await chromium.launch({headless: true, ...(channel ? {channel} : {})});
  try {
    await learnAndLock(browser);
    await ownerWithoutMembership(browser);
    await sandboxAndModel(browser);
    await layouts(browser);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
