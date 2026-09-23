// Machine flow through the simulator: run the app with
//   python3 webapp/server.py --port 8002 --machine sim --sim-speed 20
// then: node ml/tests/browser-machine.cjs
const { chromium, devices } = require('playwright');
const assert = require('node:assert/strict');

const baseURL = process.env.POURPOUR_TEST_URL || 'http://127.0.0.1:8002';
const text = (page, selector) => page.locator(selector).textContent();
const machineState = (page) => page.evaluate(() => window.firstBrew.state().machine?.state);

(async () => {
  const browser = await chromium.launch({headless: true, channel: process.env.POURPOUR_BROWSER_CHANNEL || undefined});
  const context = await browser.newContext({...devices['iPhone 13'], baseURL, locale: 'en-US'});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    const status = await (await page.request.get('/api/machine')).json();
    assert.equal(status.enabled, true, 'start the server with --machine sim');
    assert.equal(status.connected, true);
    if (status.state !== 'IDLE') await page.request.post('/api/machine/abort');

    await page.goto('/');
    // Russian is the default for every locale; these checks read the English strings.
    await page.locator('#language').selectOption('en');
    await page.locator('#query').fill('суса');
    await page.locator('#results .coffee').first().click();
    await page.waitForFunction(() => document.querySelector('.figures'), null, {timeout: 30000});
    await page.locator('#machine-start').waitFor({state: 'visible'});
    assert.equal(await text(page, '#machine-start'), 'Brew on the machine');
    await page.locator('#machine-start').click();

    // Preheat with progress, then ready.
    await page.waitForFunction(() => document.body.dataset.screen === 'brew');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('firstbrew.recentRecipes.v1') || '[]').length), 1,
      'a machine brew is saved in recent recipes');
    await page.waitForFunction(() => document.getElementById('brew-phase').textContent === 'Heating water', null, {timeout: 10000});
    assert.match(await text(page, '#brew-action'), /^Heating water, .+°C → 98 °C$/);
    assert.equal(await page.locator('#brew-toggle').isDisabled(), true);
    assert.equal(await text(page, '#brew-reset'), 'Stop');
    await page.waitForFunction(() => document.getElementById('brew-phase').textContent === 'Ready', null, {timeout: 60000});
    assert.equal(await machineState(page), 'READY');
    assert.equal(await text(page, '#brew-toggle'), 'Start pouring');

    // Pours reported from the machine, pause and resume forwarded to it.
    await page.locator('#brew-toggle').click();
    await page.waitForFunction(() => /^Pouring to 50 g$/.test(document.getElementById('brew-action').textContent), null, {timeout: 10000});
    assert.equal(await machineState(page), 'BREWING');
    assert.match(await text(page, '#brew-countdown'), /g on the scale · .+°C$/);
    assert.match(await text(page, '#brew-next'), /0:30/);
    await page.locator('#brew-toggle').click();
    await page.waitForFunction(() => document.getElementById('brew-phase').textContent === 'Paused', null, {timeout: 5000});
    assert.equal(await machineState(page), 'PAUSED');
    await page.locator('#brew-toggle').click();
    await page.waitForFunction(() => window.firstBrew.state().machine?.state === 'BREWING', null, {timeout: 5000});

    // Done.
    await page.waitForFunction(() => window.firstBrew.state().machine?.state === 'DONE', null, {timeout: 180000});
    await page.waitForFunction(() => document.getElementById('brew-done').hidden === false);
    assert.match(await text(page, '#brew-done-text'), /machine has finished/);
    assert.equal(await text(page, '#brew-again'), 'Brew again');
    const final = await page.evaluate(() => window.firstBrew.state().machine);
    assert.ok(final.poured_g >= 245 && final.poured_g <= 256, `poured ${final.poured_g}`);
    assert.equal(final.heater, 0);

    // Stop from the machine screen aborts the session on the machine.
    await page.locator('#brew-again').click();
    await page.waitForFunction(() => document.getElementById('brew-phase').textContent === 'Heating water', null, {timeout: 10000});
    await page.locator('#brew-reset').click();
    await page.waitForFunction(() => document.getElementById('brew-phase').textContent === 'Stopped', null, {timeout: 5000});
    assert.equal((await (await page.request.get('/api/machine')).json()).state, 'IDLE');
    assert.deepEqual(errors, []);
    console.log('PASS machine: recipe sent → heating → ready → pours from telemetry → pause/resume → done → stop.');
  } finally {
    await context.close();
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
