'use strict';
// First Brew — three screens: find → recipe → brew. Plain JS, no build step.

// ---------------------------------------------------------------------------
// Strings. Everything the user reads lives here; add `en` next to `ru` later.
// ---------------------------------------------------------------------------
const NBSP = ' ';
const STRINGS = {
  // English is the default. Wording is descriptive, not imperative: the machine
  // (or the person) does the pouring; the app reports what is happening.
  en: {
    app: 'First Brew',
    decimal: '.',
    unit_g: 'g',
    unit_c: '°C',
    unit_s: 's',
    instructions: {'предсмачивание': 'Bloom', 'смачивание': 'Bloom', 'вливание': 'Pour', 'пролив': 'Pour'},
    photo_button: 'Take a photo of the bag',
    search_label: 'Or type the coffee name',
    search_placeholder: 'e.g. Rwanda Susa',
    show_all: 'Show all',
    status_checking: 'Checking photo recognition…',
    status_ready: (n) => `${n} coffees in the database${NBSP}· point the camera at the bag`,
    status_no_ocr: 'Photo recognition is unavailable. Type the name instead.',
    status_model_error: 'The model is unavailable. Check the server setup.',
    status_reading: 'Reading the label…',
    catalog_loading: 'Loading the catalog…',
    catalog_searching: 'Searching the catalog…',
    catalog_empty: 'Nothing found. Try part of the name or check the spelling.',
    catalog_stale: 'The roaster’s site is temporarily unavailable. Showing a saved catalog.',
    catalog_similar: 'No exact match. You might mean:',
    catalog_count: (n, total) => `Showing ${n} of ${total}`,
    out_of_stock: 'out of stock',
    filter_roast: 'Filter roast',
    back: 'Back',
    to_recipe: 'Recipe',
    pick_coffee: 'Pick a coffee on the left and its recipe appears here.',
    recipe_loading: 'Loading the recipe…',
    recipe_none: 'The roaster has no pour-over recipe for this coffee.',
    recipe_error: 'Could not load the recipe.',
    retry: 'Try again',
    coffee_page: 'Coffee page',
    reference_page: 'Reference coffee',
    recipe_subtitle: 'Recipe by The Welder Catherine · filter roast',
    starting_recipe: 'A starting recipe. The roaster tested it on a different coffee; taste has not been evaluated on yours.',
    check_lot: 'Check the roaster, harvest and filter roast on the bag: different lots may share a name.',
    stale_data: 'The source is temporarily unavailable. Showing saved data.',
    variant: 'Recipe variant',
    coffee: 'Coffee',
    water: 'Water',
    temperature: 'Temperature',
    time: 'Time',
    grind: 'Grind',
    grind_unknown: 'Grind not specified',
    grind_setting: (grinder, setting) => `${grinder}${NBSP}· ${setting}`,
    grinder_unknown: 'Grinder not specified',
    setting_unknown: 'setting not specified',
    ratio: 'Ratio',
    ratio_value: (r) => `1${NBSP}:${NBSP}${r}`,
    ratio_unknown: 'not specified',
    pours: 'Pours',
    no_steps: 'The source lists no steps.',
    pour_default: 'Pour',
    target_on_scale: (g) => `${g} on the scale`,
    start_brew: 'Start brewing',
    continue_brew: 'Back to brewing',
    pause: 'Pause',
    resume: 'Resume',
    reset: 'Reset',
    brew_title: 'Brewing',
    vibrate: 'Vibration',
    sound: 'Sound',
    vibrate_hint: (on) => on ? 'Vibration on' : 'Vibration off',
    sound_hint: (on) => on ? 'Sound on' : 'Sound off',
    phase_ready: 'Ready',
    phase_wait: 'Waiting',
    phase_drawdown: 'Drawdown',
    phase_step: (name, i, n) => `${name}${NBSP}· ${i} of ${n}`,
    action_ready: 'Timer not started',
    action_pour_to: (g) => `Pouring to ${g}`,
    action_pour: 'Pouring',
    action_next_in: (t) => `Next pour in ${t}`,
    action_drawdown: 'Water draining',
    remaining: (t) => `${t} left`,
    next_step: (time, text) => `Next${NBSP}· ${time}${NBSP}· ${text}`,
    next_pour_to: (name, g) => `${name.toLowerCase()} to ${g}`,
    next_done: (time) => `Done at ${time}`,
    done_title: 'Done',
    done_text: 'Let the water finish draining. Enjoy your cup.',
    brew_again: 'Brew again',
    another_coffee: 'Find another coffee',
    machine_button: 'Brew on the machine',
    machine_sending: 'Sending the recipe to the machine…',
    machine_start: 'Start pouring',
    machine_stop: 'Stop',
    machine_retry: 'Try again',
    machine_check: 'Check machine',
    phase_heating: 'Heating water',
    phase_machine_ready: 'Ready',
    phase_paused: 'Paused',
    phase_error: 'Machine stopped',
    phase_offline: 'No connection',
    phase_stopped: 'Stopped',
    action_heating: (from, to) => `Heating water, ${from} → ${to}`,
    action_machine_ready: 'Water is ready. Place the dripper on the scale.',
    action_paused: 'Pour paused',
    action_offline: 'Connection to the machine lost',
    action_stopped: 'The brew was stopped',
    scale_line: (g, temp) => `${g} on the scale${NBSP}· ${temp}`,
    machine_done_text: 'The machine has finished. Let the water drain and enjoy your cup.',
    machine_errors: {watchdog: 'The link to the machine was lost during the brew.', dry_run: 'The pump ran but the weight did not change. Check the water tank.', no_temp_sensor: 'No reading from the temperature sensor.', overheat: 'The water got too hot; the heater was switched off.', estop: 'The emergency stop is engaged. Restart the machine.'},
    err_photo_size: 'Choose a photo smaller than 20 MB.',
    err_photo_open: 'Could not open the photo. Save it as JPEG and try again.',
    err_generic: 'Could not load data. Please try again.',
    err_label: 'Could not process the photo.',
  },
  ru: {
    app: 'First Brew',
    decimal: ',',
    unit_g: 'г',
    unit_c: '°C',
    unit_s: 'с',
    instructions: {},
    photo_button: 'Сфотографировать пачку',
    search_label: 'Или введите название',
    search_placeholder: 'Например, Руанда Суса',
    show_all: 'Показать все',
    status_checking: 'Проверяем распознавание фото…',
    status_ready: (n) => `${n} кофе в базе${NBSP}· наведите камеру на пачку`,
    status_no_ocr: 'Распознавание фото недоступно. Введите название вручную.',
    status_model_error: 'Модель недоступна. Проверьте запуск сервера.',
    status_reading: 'Фото распознаётся…',
    catalog_loading: 'Каталог загружается…',
    catalog_searching: 'Ищем в каталоге…',
    catalog_empty: 'Ничего не найдено. Попробуйте часть названия или проверьте написание.',
    catalog_stale: 'Сайт обжарщика временно недоступен. Показан сохранённый каталог.',
    catalog_similar: 'Точного совпадения нет. Возможно, вы имели в виду:',
    catalog_count: (n, total) => `Показано ${n} из ${total}`,
    out_of_stock: 'нет в наличии',
    filter_roast: 'Обжарка под фильтр',
    back: 'Назад',
    to_recipe: 'К рецепту',
    pick_coffee: 'Выберите кофе слева, и здесь появится рецепт.',
    recipe_loading: 'Загружаем рецепт…',
    recipe_none: 'У обжарщика нет рецепта воронки для этого кофе.',
    recipe_error: 'Не удалось загрузить рецепт.',
    retry: 'Повторить',
    coffee_page: 'Страница кофе',
    reference_page: 'Кофе-ориентир',
    recipe_subtitle: 'Рецепт The Welder Catherine · обжарка под фильтр',
    starting_recipe: 'Стартовый рецепт. Обжарщик проверял его на другом кофе, на вашем вкус не оценивался.',
    check_lot: 'Проверьте обжарщика, урожай и обжарку под фильтр на пачке: разные лоты могут называться одинаково.',
    stale_data: 'Источник временно недоступен. Показаны сохранённые данные.',
    variant: 'Вариант рецепта',
    coffee: 'Кофе',
    water: 'Вода',
    temperature: 'Температура',
    time: 'Время',
    grind: 'Помол',
    grind_unknown: 'Помол не указан',
    grind_setting: (grinder, setting) => `${grinder}${NBSP}· ${setting}`,
    grinder_unknown: 'Кофемолка не указана',
    setting_unknown: 'деление не указано',
    ratio: 'Соотношение',
    ratio_value: (r) => `1${NBSP}:${NBSP}${r}`,
    ratio_unknown: 'не указано',
    pours: 'Вливания',
    no_steps: 'В источнике нет шагов.',
    pour_default: 'Вливание',
    target_on_scale: (g) => `${g} на весах`,
    start_brew: 'Начать заваривание',
    continue_brew: 'Вернуться к завариванию',
    pause: 'Пауза',
    resume: 'Продолжить',
    reset: 'Сброс',
    brew_title: 'Заваривание',
    vibrate: 'Вибрация',
    sound: 'Звук',
    vibrate_hint: (on) => on ? 'Вибрация включена' : 'Вибрация выключена',
    sound_hint: (on) => on ? 'Звук включён' : 'Звук выключен',
    phase_ready: 'Готово к запуску',
    phase_wait: 'Ожидание',
    phase_drawdown: 'Стекание',
    phase_step: (name, i, n) => `${name}${NBSP}· ${i} из ${n}`,
    action_ready: 'Таймер не запущен',
    action_pour_to: (g) => `Вливание до ${g}`,
    action_pour: 'Вливание',
    action_next_in: (t) => `Следующее вливание через ${t}`,
    action_drawdown: 'Вода стекает',
    remaining: (t) => `ещё ${t}`,
    next_step: (time, text) => `Дальше${NBSP}· ${time}${NBSP}· ${text}`,
    next_pour_to: (name, g) => `${name.toLowerCase()} до ${g}`,
    next_done: (time) => `Готово в ${time}`,
    done_title: 'Готово',
    done_text: 'Убедитесь, что вода стекла. Приятного кофе!',
    brew_again: 'Заварить ещё',
    another_coffee: 'Найти другой кофе',
    machine_button: 'Заварить на машине',
    machine_sending: 'Передаём рецепт на машину…',
    machine_start: 'Начать вливания',
    machine_stop: 'Стоп',
    machine_retry: 'Повторить',
    machine_check: 'Проверить машину',
    phase_heating: 'Греем воду',
    phase_machine_ready: 'Готово',
    phase_paused: 'Пауза',
    phase_error: 'Машина остановлена',
    phase_offline: 'Нет связи',
    phase_stopped: 'Остановлено',
    action_heating: (from, to) => `Греем воду, ${from} → ${to}`,
    action_machine_ready: 'Вода готова. Поставьте воронку на весы.',
    action_paused: 'Вливание на паузе',
    action_offline: 'Связь с машиной потеряна',
    action_stopped: 'Заваривание остановлено',
    scale_line: (g, temp) => `${g} на весах${NBSP}· ${temp}`,
    machine_done_text: 'Машина закончила. Дайте воде стечь и наслаждайтесь.',
    machine_errors: {watchdog: 'Связь с машиной прервалась во время заваривания.', dry_run: 'Помпа работала, а вес не менялся. Проверьте бак с водой.', no_temp_sensor: 'Нет показаний датчика температуры.', overheat: 'Вода перегрелась, нагрев выключен.', estop: 'Нажата аварийная кнопка. Перезапустите машину.'},
    err_photo_size: 'Выберите фото меньше 20 МБ.',
    err_photo_open: 'Не удалось открыть фото. Сохраните его как JPEG и попробуйте снова.',
    err_generic: 'Не удалось загрузить данные. Попробуйте ещё раз.',
    err_label: 'Не удалось обработать фото.',
  },
};
const LANG = 'en';
const t = (key, ...args) => {
  const value = STRINGS[LANG][key];
  return typeof value === 'function' ? value(...args) : value ?? key;
};

// ---------------------------------------------------------------------------
// Formatting: Russian typography, non-breaking space before units.
// ---------------------------------------------------------------------------
const $ = (id) => document.getElementById(id);
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = (value) => value == null ? '—' : String(value).replace('.', t('decimal'));
const grams = (value) => value == null ? '—' : `${num(value)}${NBSP}${t('unit_g')}`;
const celsius = (value) => value == null ? '—' : `${num(value)}${NBSP}${t('unit_c')}`;
const clock = (seconds) => seconds == null ? '—' : `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
const secondsText = (seconds) => `${Math.max(0, Math.ceil(seconds))}${NBSP}${t('unit_s')}`;
const countdown = (seconds) => seconds >= 60 ? clock(Math.max(0, seconds)) : secondsText(seconds);
// Source instructions arrive in Russian; translate the known brewing words, keep the rest as-is.
const stepName = (instruction) => {
  const text = String(instruction ?? '').trim();
  const known = STRINGS[LANG].instructions[text.toLowerCase()];
  return known || (text ? text[0].toUpperCase() + text.slice(1) : t('pour_default'));
};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let searchRequest, recipeRequest, photoRequest, photoGeneration = 0;
let currentProduct = null, currentData = null, currentRecipe = null, recipeLoading = false;
let timerInterval, running = false, elapsed = 0, startedAt = 0, lastActiveStep = -1, finished = false;
let wakeLock = null, audio = null;
// Machine mode: the brew screen mirrors telemetry from the machine instead of the local timer.
let brewMode = 'local', machineInfo = null, machineState = null, machineOnline = false, machineEvents = null;
let machineHeatStart = null, machineLastStep = -1, machineStopped = false;
const MACHINE_ACTIVE = ['PREHEAT', 'READY', 'BREWING', 'PAUSED'];
const prefs = {vibrate: true, sound: true};

function loadPrefs() {
  try {
    const saved = JSON.parse(localStorage.getItem('firstbrew.prefs') || '{}');
    if (typeof saved.vibrate === 'boolean') prefs.vibrate = saved.vibrate;
    if (typeof saved.sound === 'boolean') prefs.sound = saved.sound;
  } catch (error) { /* private mode or blocked storage: keep defaults */ }
}
function savePrefs() {
  try { localStorage.setItem('firstbrew.prefs', JSON.stringify(prefs)); } catch (error) { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Screens and browser history
// ---------------------------------------------------------------------------
const SCREENS = ['find', 'recipe', 'brew'];
function currentScreen() { return document.body.dataset.screen; }

function show(screen, {push = true} = {}) {
  if (!SCREENS.includes(screen)) screen = 'find';
  if (screen !== 'find' && !currentData && !recipeLoading) screen = 'find';
  if (screen === 'brew' && !currentRecipe) screen = currentData ? 'recipe' : 'find';
  document.body.dataset.screen = screen;
  if (screen === 'recipe' && machineInfo?.enabled) refreshMachine();
  if (screen === 'brew' && brewMode === 'machine') renderMachine();
  if (push && history.state?.screen !== screen) {
    history.pushState({screen}, '', screen === 'find' ? location.pathname : `#${screen}`);
  }
  window.scrollTo(0, 0);
  const focusTarget = screen === 'find' ? null : screen === 'recipe' ? $('recipe-title') : $('brew-toggle');
  focusTarget?.focus({preventScroll: true});
}

function back(target) {
  const state = history.state?.screen;
  if (state && state !== 'find' && state === currentScreen()) history.back();
  else show(target, {push: false});
}

window.addEventListener('popstate', event => show(event.state?.screen || 'find', {push: false}));

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------
async function api(path, signal) {
  const response = await fetch(path, {signal});
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || t('err_generic'));
  return data;
}

async function post(path, body, type, signal) {
  const response = await fetch(path, {method: 'POST', headers: {'Content-Type': type}, body, signal});
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || t('err_label'));
  return data;
}

// ---------------------------------------------------------------------------
// Screen 1: find
// ---------------------------------------------------------------------------
let searchTimer;
function setStatus(id, text, error = false) {
  const node = $(id);
  node.className = error ? 'status error' : 'status';
  node.textContent = text;
}

async function search(query = '') {
  searchRequest?.abort();
  const request = new AbortController();
  searchRequest = request;
  $('show-all').disabled = true;
  setStatus('catalog-status', query ? t('catalog_searching') : t('catalog_loading'));
  $('results').replaceChildren();
  $('results').hidden = true;
  try {
    const data = await api(`/api/search?q=${encodeURIComponent(query)}`, request.signal);
    setStatus('catalog-status', !data.total ? t('catalog_empty')
      : data.source.stale ? t('catalog_stale')
      : data.products[0].match === 'similar' ? t('catalog_similar')
      : t('catalog_count', data.products.length, data.catalog_size));
    data.products.forEach(product => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'coffee';
      button.setAttribute('role', 'listitem');
      button.dataset.id = product.id;
      button.setAttribute('aria-pressed', String(currentProduct?.id === product.id));
      button.innerHTML = `<span class="coffee-copy"><strong>${escape(product.name)}</strong><small>${escape(product.region || t('filter_roast'))}${!product.available ? ` · ${t('out_of_stock')}` : ''}</small></span><span class="arrow" aria-hidden="true">→</span>`;
      button.addEventListener('click', () => selectProduct(product));
      $('results').append(button);
    });
    $('results').hidden = !data.products.length;
  } catch (error) {
    if (error.name === 'AbortError') return;
    setStatus('catalog-status', error.message, true);
  } finally {
    if (searchRequest === request) $('show-all').disabled = false;
  }
}

function markSelected() {
  document.querySelectorAll('.coffee').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.id === currentProduct?.id));
  });
}

// ---------------------------------------------------------------------------
// Screen 2: recipe
// ---------------------------------------------------------------------------
function recipeMessage(html) {
  $('recipe-body').innerHTML = html;
  $('recipe-cta').hidden = true;
}

async function selectProduct(product) {
  cancelPhotoRequests();
  recipeRequest?.abort();
  const request = new AbortController();
  recipeRequest = request;
  resetTimer();
  currentRecipe = null;
  currentData = null;
  currentProduct = product;
  recipeLoading = true;
  markSelected();
  $('recipe-body').setAttribute('aria-busy', 'true');
  recipeMessage(`<h1 class="title" id="recipe-title" tabindex="-1">${escape(product.name)}</h1><p class="status" role="status">${t('recipe_loading')}</p>`);
  show('recipe');
  try {
    const data = await api(`/api/recipes/${encodeURIComponent(product.id)}`, request.signal);
    currentData = data;
    if (!data.recipes.length) {
      recipeMessage(`<h1 class="title" id="recipe-title" tabindex="-1">${escape(product.name)}</h1><p class="note">${t('recipe_none')}</p><p class="source"><a href="${escape(product.url)}" target="_blank" rel="noopener noreferrer">${t('coffee_page')} ↗</a></p>`);
    } else renderRecipe(0);
  } catch (error) {
    if (error.name === 'AbortError') return;
    recipeMessage(`<h1 class="title" id="recipe-title" tabindex="-1">${escape(product.name)}</h1><p class="note error" role="alert">${t('recipe_error')} ${escape(error.message)}</p><button type="button" class="button retry" id="retry">${t('retry')}</button><p class="source"><a href="${escape(product.url)}" target="_blank" rel="noopener noreferrer">${t('coffee_page')} ↗</a></p>`);
    $('retry').addEventListener('click', () => selectProduct(product));
  } finally {
    if (recipeRequest === request) {
      recipeLoading = false;
      $('recipe-body').setAttribute('aria-busy', 'false');
    }
  }
}

function renderRecipe(index) {
  if (brewMode === 'machine') leaveMachineMode();
  resetTimer();
  const recipe = currentRecipe = currentData.recipes[index];
  const kind = currentData.recommendation_kind;
  const suggested = ['closest_reference', 'suggested_baseline'].includes(kind);
  const variants = currentData.recipes.length > 1
    ? `<div class="variants" role="group" aria-label="${t('variant')}">${currentData.recipes.map((r, i) =>
        `<button type="button" class="chip" data-variant="${i}" aria-pressed="${i === index}">${escape(r.device || 'V60')}${NBSP}· ${grams(r.coffee_g)}</button>`).join('')}</div>`
    : '';
  const figures = [[num(recipe.coffee_g), t('unit_g'), t('coffee')], [num(recipe.water_g), t('unit_g'), t('water')],
                   [num(recipe.temperature_c), t('unit_c'), t('temperature')], [clock(recipe.duration_seconds), '', t('time')]];
  const steps = recipe.steps.map(step => `<li class="pour">
      <span class="pour-time">${clock(step.start_seconds)}</span>
      <span class="pour-what"><strong>${escape(stepName(step.instruction))}</strong>${step.total_water_g != null ? `<small>${t('target_on_scale', grams(step.total_water_g))}</small>` : ''}</span>
      <span class="pour-add">${step.water_g == null ? '—' : `+${grams(step.water_g)}`}</span>
    </li>`).join('');
  const grind = recipe.grinder || recipe.grind_setting
    ? t('grind_setting', escape(recipe.grinder || t('grinder_unknown')), recipe.grind_setting ? escape(recipe.grind_setting) : t('setting_unknown'))
    : t('grind_unknown');
  $('recipe-body').innerHTML = `
    <h1 class="title" id="recipe-title" tabindex="-1">${escape(currentData.product.name)}</h1>
    <p class="subtitle">${escape(currentData.recipe_subtitle || t('recipe_subtitle'))}</p>
    ${variants}
    ${suggested ? `<p class="note">${t('starting_recipe')}</p>` : ''}
    ${currentData.explanation ? `<p class="note recommendation-basis">${escape(currentData.explanation)}</p>` : ''}
    ${kind === 'catalog_match' ? `<p class="note">${t('check_lot')}</p>` : ''}
    ${currentData.stale ? `<p class="note">${t('stale_data')}</p>` : ''}
    ${recipe.warnings.map(w => `<p class="note">${escape(w)}</p>`).join('')}
    <div class="figures">${figures.map(([value, unit, label]) => `<div><b>${value}${unit ? `<small>${NBSP}${unit}</small>` : ''}</b><span>${label}</span></div>`).join('')}</div>
    <p class="line"><span>${t('grind')}</span><strong>${grind}</strong></p>
    <p class="line"><span>${t('ratio')}</span><strong>${recipe.ratio ? t('ratio_value', num(recipe.ratio)) : t('ratio_unknown')}</strong></p>
    <h2 class="section">${t('pours')}</h2>
    ${steps ? `<ol class="pours">${steps}</ol>` : `<p class="status">${t('no_steps')}</p>`}
    ${recipe.notes ? `<p class="note">${escape(recipe.notes)}</p>` : ''}
    <p class="source"><a href="${escape(currentData.product.url)}" target="_blank" rel="noopener noreferrer">${suggested ? t('reference_page') : t('coffee_page')} ↗</a></p>`;
  document.querySelectorAll('[data-variant]').forEach(button => button.addEventListener('click', () => {
    renderRecipe(Number(button.dataset.variant));
    $('recipe-title').focus({preventScroll: true});
  }));
  $('recipe-cta').hidden = false;
  $('brew-start').disabled = !recipe.duration_seconds;
  updateBrewStartLabel();
}

function updateBrewStartLabel() {
  $('brew-start').textContent = (running || elapsed > 0) && !finished ? t('continue_brew') : t('start_brew');
  updateCtaBar();
}

function machineConnected() {
  return Boolean(machineInfo?.enabled && machineOnline);
}

function updateCtaBar() {
  const available = machineConnected() && Boolean(currentRecipe?.duration_seconds);
  $('machine-start').hidden = !available;
  $('machine-start').textContent = t('machine_button');
  $('recipe-cta').dataset.machine = String(available);
}

// ---------------------------------------------------------------------------
// Photo → recipe
// ---------------------------------------------------------------------------
function cancelPhotoRequests() {
  photoGeneration++;
  photoRequest?.abort();
  photoRequest = null;
}

async function photoBlob(file) {
  if (file.size > 20_000_000) throw new Error(t('err_photo_size'));
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch (error) {
    throw new Error(t('err_photo_open'));
  }
  const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .92));
  if (!blob) throw new Error(t('err_photo_open'));
  return blob;
}

function showRecommendation(recommendation) {
  if (!recommendation.recipe_data) {
    setStatus('status', recommendation.message, true);
    return;
  }
  currentData = recommendation.recipe_data;
  currentProduct = currentData.product;
  // Keep the API's own caveat visible on the recipe screen.
  if (!currentData.explanation && recommendation.kind !== 'catalog_match') currentData.explanation = recommendation.message;
  markSelected();
  setStatus('status', recommendation.message);
  renderRecipe(0);
  show('recipe');
}

async function handlePhoto(file) {
  if (!file) return;
  cancelPhotoRequests();
  recipeRequest?.abort();
  resetTimer();
  currentRecipe = currentData = currentProduct = null;
  recipeLoading = false;
  markSelected();
  setStatus('status', t('status_reading'));
  $('photo-button').disabled = true;
  const generation = photoGeneration;
  photoRequest = new AbortController();
  try {
    const body = await photoBlob(file);
    if (generation !== photoGeneration) return;
    const data = await post('/api/label', body, 'image/jpeg', photoRequest.signal);
    if (generation !== photoGeneration) return;
    showRecommendation(data.recommendation);
  } catch (error) {
    if (error.name !== 'AbortError' && generation === photoGeneration) setStatus('status', error.message, true);
  } finally {
    if (generation === photoGeneration) $('photo-button').disabled = false;
  }
}

// ---------------------------------------------------------------------------
// Screen 3: brew timer
// ---------------------------------------------------------------------------
function resetTimer() {
  clearInterval(timerInterval);
  running = false;
  elapsed = 0;
  finished = false;
  lastActiveStep = -1;
  keepAwake(false);
  updateTimer();
  if ($('brew-start')) updateBrewStartLabel();
}

function toggleTimer() {
  if (!currentRecipe?.duration_seconds) return;
  if (running) {
    elapsed += (performance.now() - startedAt) / 1000;
    running = false;
    clearInterval(timerInterval);
    keepAwake(false);
  } else {
    if (finished || elapsed >= currentRecipe.duration_seconds) { elapsed = 0; finished = false; }
    running = true;
    lastActiveStep = -1;
    startedAt = performance.now();
    timerInterval = setInterval(updateTimer, 200);
    primeAudio();
    keepAwake(true);
  }
  updateTimer();
  updateBrewStartLabel();
}

function setText(id, value) {
  const node = $(id);
  if (node && node.textContent !== value) node.textContent = value;
}

function updateTimer() {
  if (!currentRecipe || brewMode === 'machine') return;
  const steps = currentRecipe.steps, duration = currentRecipe.duration_seconds;
  let seconds = elapsed + (running ? (performance.now() - startedAt) / 1000 : 0);
  if (duration && seconds >= duration) {
    seconds = elapsed = duration;
    if (!finished) {
      finished = true;
      running = false;
      clearInterval(timerInterval);
      keepAwake(false);
      notify(2);
      updateBrewStartLabel();
    }
  }
  const started = running || seconds > 0;
  let activeIndex = -1, nextIndex = -1;
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    if (s.start_seconds != null && s.stop_seconds != null && seconds >= s.start_seconds && seconds < s.stop_seconds) { activeIndex = i; break; }
  }
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].start_seconds != null && steps[i].start_seconds > seconds) { nextIndex = i; break; }
  }
  if (running && activeIndex >= 0 && activeIndex !== lastActiveStep) {
    lastActiveStep = activeIndex;
    notify(1);
  }
  if (activeIndex < 0) lastActiveStep = -1;

  let phase = '', action = '', remaining = '', progress = duration ? seconds / duration : 0;
  if (finished) {
    phase = ''; action = ''; remaining = '';
  } else if (!started) {
    phase = t('phase_ready'); action = t('action_ready');
  } else if (activeIndex >= 0) {
    const s = steps[activeIndex];
    phase = t('phase_step', stepName(s.instruction), activeIndex + 1, steps.length);
    action = s.total_water_g == null ? t('action_pour') : t('action_pour_to', grams(s.total_water_g));
    remaining = t('remaining', secondsText(s.stop_seconds - seconds));
  } else if (nextIndex >= 0) {
    const s = steps[nextIndex];
    phase = t('phase_wait');
    action = t('action_next_in', countdown(s.start_seconds - seconds));
    remaining = '';
  } else {
    phase = t('phase_drawdown');
    action = t('action_drawdown');
    remaining = duration ? t('remaining', countdown(duration - seconds)) : '';
  }
  const next = nextIndex >= 0 ? steps[nextIndex] : null;
  const nextText = !started || finished ? ''
    : next ? t('next_step', clock(next.start_seconds), next.total_water_g == null ? stepName(next.instruction).toLowerCase() : t('next_pour_to', stepName(next.instruction), grams(next.total_water_g)))
    : duration ? t('next_done', clock(duration)) : '';

  setText('brew-clock', clock(seconds));
  setText('brew-phase', phase);
  setText('brew-action', action);
  setText('brew-countdown', remaining);
  setText('brew-next', nextText);
  $('brew-progress').style.width = `${(Math.max(0, Math.min(1, progress)) * 100).toFixed(1)}%`;
  setText('brew-toggle', running ? t('pause') : t('resume'));
  $('brew-face').hidden = finished;
  $('brew-controls').hidden = finished;
  $('brew-done').hidden = !finished;
  $('brew-done-controls').hidden = !finished;
}


// ---------------------------------------------------------------------------
// Machine mode (First Brew machine through the server, see docs/PROTOCOL.md)
// ---------------------------------------------------------------------------
async function machineRequest(action, body) {
  const response = await fetch(`/api/machine/${action}`, {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: body ? JSON.stringify(body) : '',
  });
  const data = await response.json();
  if (!response.ok) { const error = new Error(data.error || t('err_generic')); error.code = data.code; throw error; }
  return data;
}

async function refreshMachine() {
  try {
    machineInfo = await api('/api/machine');
    machineOnline = Boolean(machineInfo.connected);
    if (machineInfo.telemetry) machineState = machineInfo.telemetry;
    if (machineInfo.enabled && !machineEvents) connectMachineEvents();
  } catch (error) {
    machineInfo = null;
    machineOnline = false;
  }
  updateCtaBar();
  if (brewMode === 'machine') renderMachine();
}

function connectMachineEvents() {
  if (machineEvents || typeof EventSource === 'undefined') return;
  machineEvents = new EventSource('/api/machine/events');
  machineEvents.addEventListener('state', event => {
    const previous = machineState;
    machineState = JSON.parse(event.data);
    machineOnline = true;
    onMachineState(previous, machineState);
  });
  machineEvents.addEventListener('link', event => {
    const link = JSON.parse(event.data);
    machineOnline = Boolean(link.connected);
    if (link.info) machineInfo = {...(machineInfo || {enabled: true}), firmware: link.info.fw, mode: link.info.mode};
    updateCtaBar();
    if (brewMode === 'machine') renderMachine();
  });
  machineEvents.onerror = () => {
    machineOnline = false;
    updateCtaBar();
    if (brewMode === 'machine') renderMachine();
  };
}

function onMachineState(previous, state) {
  if (state.state === 'PREHEAT' && (previous?.state !== 'PREHEAT' || machineHeatStart == null)) machineHeatStart = state.temp_c;
  if (brewMode === 'machine') {
    if (state.state === 'BREWING' && state.step >= 0 && state.step !== machineLastStep) notify(1);
    if (state.state === 'DONE' && previous?.state !== 'DONE') notify(2);
    keepAwake(MACHINE_ACTIVE.includes(state.state) && currentScreen() === 'brew');
    renderMachine();
  }
  machineLastStep = state.state === 'BREWING' ? state.step : -1;
  updateCtaBar();
}

async function startMachineBrew() {
  if (!currentRecipe?.duration_seconds) return;
  resetTimer();
  brewMode = 'machine';
  machineStopped = false;
  machineHeatStart = null;
  setStatus('cta-status', t('machine_sending'));
  $('machine-start').disabled = true;
  try {
    const reply = await machineRequest('recipe', {recipe: currentRecipe});
    if (reply.telemetry) machineState = reply.telemetry;
    setStatus('cta-status', '');
    show('brew');
    renderMachine();
  } catch (error) {
    brewMode = 'local';
    setStatus('cta-status', error.message, true);
  } finally {
    $('machine-start').disabled = false;
    updateCtaBar();
  }
}

async function machineCommand(action) {
  try {
    const reply = await machineRequest(action);
    if (reply.telemetry) { const previous = machineState; machineState = reply.telemetry; onMachineState(previous, machineState); }
  } catch (error) {
    setText('brew-countdown', error.message);
  }
}

// What the brew screen shows in machine mode, from the latest telemetry.
function renderMachine() {
  if (currentScreen() !== 'brew' && brewMode === 'machine' && !machineState) return;
  const state = machineState || {};
  const status = machineStopped ? 'STOPPED' : !machineOnline ? 'OFFLINE' : (state.state || 'IDLE');
  const steps = currentRecipe?.steps || [];
  const duration = currentRecipe?.duration_seconds || 0;
  let phase = '', clockText = '', action = '', line = '', progress = 0, nextText = '', toggle = '', toggleDisabled = false;
  const clockNode = $('brew-clock');
  clockNode.classList.toggle('small', ['PREHEAT', 'READY', 'IDLE'].includes(status));
  if (status === 'PREHEAT' || status === 'IDLE') {
    phase = t('phase_heating');
    clockText = celsius(state.temp_c);
    action = t('action_heating', celsius(state.temp_c), celsius(state.target_temp_c ?? currentRecipe?.temperature_c));
    const from = machineHeatStart ?? state.temp_c ?? 0, to = state.target_temp_c ?? currentRecipe?.temperature_c ?? from + 1;
    progress = to > from ? ((state.temp_c ?? from) - from) / (to - from) : 0;
    toggle = t('machine_start'); toggleDisabled = true;
  } else if (status === 'READY') {
    phase = t('phase_machine_ready');
    clockText = celsius(state.temp_c);
    action = t('action_machine_ready');
    progress = 1;
    toggle = t('machine_start');
  } else if (status === 'BREWING' || status === 'PAUSED') {
    const seconds = state.t || 0;
    clockText = clock(seconds);
    const step = state.step >= 0 ? steps[state.step] : null;
    const next = steps.find(s => s.start_seconds > seconds && s.total_water_g > (state.poured_g || 0));
    if (status === 'PAUSED') {
      phase = t('phase_paused'); action = t('action_paused');
    } else if (step) {
      phase = t('phase_step', stepName(step.instruction), state.step + 1, steps.length);
      action = t('action_pour_to', grams(state.target_g));
    } else if (next) {
      phase = t('phase_wait'); action = t('action_next_in', countdown(next.start_seconds - seconds));
    } else {
      phase = t('phase_drawdown'); action = t('action_drawdown');
    }
    line = t('scale_line', grams(state.poured_g), celsius(state.temp_c));
    progress = duration ? seconds / duration : 0;
    nextText = next ? t('next_step', clock(next.start_seconds), t('next_pour_to', stepName(next.instruction), grams(next.total_water_g)))
      : duration ? t('next_done', clock(duration)) : '';
    toggle = status === 'PAUSED' ? t('resume') : t('pause');
  } else if (status === 'ERROR' || status === 'ESTOP') {
    phase = t('phase_error');
    clockText = clock(state.t || 0);
    action = STRINGS[LANG].machine_errors[state.err] || state.err || t('err_generic');
    toggle = t('machine_retry');
    toggleDisabled = status === 'ESTOP';
  } else if (status === 'OFFLINE') {
    phase = t('phase_offline');
    clockText = clock(state.t || 0);
    action = t('action_offline');
    toggle = t('machine_retry');
  } else if (status === 'STOPPED') {
    phase = t('phase_stopped');
    clockText = clock(state.t || 0);
    action = t('action_stopped');
    toggle = t('machine_retry');
  }
  const done = status === 'DONE';
  setText('brew-phase', phase);
  setText('brew-clock', clockText);
  setText('brew-action', action);
  setText('brew-countdown', line);
  setText('brew-next', nextText);
  $('brew-progress').style.width = `${(Math.max(0, Math.min(1, progress)) * 100).toFixed(1)}%`;
  setText('brew-toggle', toggle);
  $('brew-toggle').disabled = toggleDisabled;
  setText('brew-reset', t('machine_stop'));
  setText('brew-done-text', t('machine_done_text'));
  $('brew-face').hidden = done;
  $('brew-controls').hidden = done;
  $('brew-done').hidden = !done;
  $('brew-done-controls').hidden = !done;
}

function leaveMachineMode() {
  brewMode = 'local';
  machineStopped = false;
  keepAwake(false);
  $('brew-toggle').disabled = false;
  setText('brew-reset', t('reset'));
  setText('brew-done-text', t('done_text'));
  $('brew-clock').classList.remove('small');
  updateTimer();
}

function machineToggle() {
  const status = machineStopped ? 'STOPPED' : !machineOnline ? 'OFFLINE' : machineState?.state;
  if (status === 'READY') machineCommand('start');
  else if (status === 'BREWING') machineCommand('pause');
  else if (status === 'PAUSED') machineCommand('resume');
  else if (status === 'ERROR' || status === 'STOPPED') { back('recipe'); startMachineBrew(); }
  else if (status === 'OFFLINE') { refreshMachine(); }
}

async function machineStop() {
  try { await machineRequest('abort'); } catch (error) { /* shown through telemetry */ }
  machineStopped = true;
  renderMachine();
}

// Vibration and a short beep at the start of each pour; both can be switched off.
function notify(times) {
  if (prefs.vibrate && navigator.vibrate) {
    try { navigator.vibrate(times === 1 ? 200 : [150, 100, 150]); } catch (error) { /* ignore */ }
  }
  if (prefs.sound) beep(times);
}

function primeAudio() {
  if (!prefs.sound || audio) return;
  try {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (Context) audio = new Context();
  } catch (error) { audio = null; }
}

function beep(times) {
  primeAudio();
  if (!audio) return;
  try {
    if (audio.state === 'suspended') audio.resume();
    for (let i = 0; i < times; i++) {
      const at = audio.currentTime + i * .25;
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(.2, at + .01);
      gain.gain.exponentialRampToValueAtTime(.0001, at + .18);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(at);
      oscillator.stop(at + .2);
    }
  } catch (error) { /* audio is best-effort */ }
}

// Keep the screen on while brewing; silently degrade where unsupported.
async function keepAwake(on) {
  try {
    if (on && !wakeLock && navigator.wakeLock) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } else if (!on && wakeLock) {
      const lock = wakeLock;
      wakeLock = null;
      await lock.release();
    }
  } catch (error) { wakeLock = null; }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && running) keepAwake(true);
});

function setToggle(id, key) {
  const button = $(id);
  button.setAttribute('aria-pressed', String(prefs[key]));
  button.textContent = t(key);
  button.setAttribute('aria-label', t(`${key}_hint`, prefs[key]));
  button.title = t(`${key}_hint`, prefs[key]);
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------
function init() {
  loadPrefs();
  document.title = t('app');
  $('photo-button').textContent = t('photo_button');
  $('search-label').textContent = t('search_label');
  $('query').placeholder = t('search_placeholder');
  $('show-all').textContent = t('show_all');
  $('recipe-back').textContent = t('back');
  $('recipe-placeholder').textContent = t('pick_coffee');
  $('recipe-placeholder').classList.add('desktop-only');
  $('brew-start').textContent = t('start_brew');
  $('brew-back').textContent = t('to_recipe');
  $('brew-title').textContent = t('brew_title');
  $('brew-reset').textContent = t('reset');
  $('brew-toggle').textContent = t('resume');
  $('brew-done-title').textContent = t('done_title');
  $('brew-done-text').textContent = t('done_text');
  $('brew-again').textContent = t('brew_again');
  $('brew-new').textContent = t('another_coffee');
  setToggle('brew-vibrate', 'vibrate');
  setToggle('brew-sound', 'sound');
  if (!navigator.vibrate) $('brew-vibrate').hidden = true;

  history.replaceState({screen: 'find'}, '', location.pathname + location.search);
  document.body.dataset.screen = 'find';

  $('photo-button').addEventListener('click', () => $('photo-input').click());
  $('photo-input').addEventListener('change', event => {
    handlePhoto(event.target.files[0]);
    event.target.value = '';
  });
  $('search-form').addEventListener('submit', event => {
    event.preventDefault();
    clearTimeout(searchTimer);
    search($('query').value.trim());
  });
  $('query').addEventListener('input', () => {
    clearTimeout(searchTimer);
    const query = $('query').value.trim();
    if (!query) {
      searchRequest?.abort();
      $('results').replaceChildren();
      $('results').hidden = true;
      setStatus('catalog-status', '');
      return;
    }
    searchTimer = setTimeout(() => search(query), 300);
  });
  $('show-all').addEventListener('click', () => { $('query').value = ''; search(''); });

  $('recipe-back').addEventListener('click', () => back('find'));
  $('brew-start').addEventListener('click', () => {
    if (!currentRecipe?.duration_seconds) return;
    if (brewMode === 'machine') leaveMachineMode();
    show('brew');
    if (!running && elapsed === 0) toggleTimer();
  });
  $('machine-start').addEventListener('click', startMachineBrew);
  $('brew-back').addEventListener('click', () => back('recipe'));
  $('brew-toggle').addEventListener('click', () => brewMode === 'machine' ? machineToggle() : toggleTimer());
  $('brew-reset').addEventListener('click', () => {
    if (brewMode === 'machine') { machineStop(); return; }
    resetTimer();
    $('brew-toggle').focus({preventScroll: true});
  });
  $('brew-again').addEventListener('click', () => {
    if (brewMode === 'machine') { back('recipe'); startMachineBrew(); return; }
    resetTimer();
    back('recipe');
  });
  $('brew-new').addEventListener('click', () => {
    if (brewMode === 'machine') { machineRequest('abort').catch(() => {}); leaveMachineMode(); }
    resetTimer();
    currentRecipe = currentData = currentProduct = null;
    markSelected();
    $('recipe-cta').hidden = true;
    $('recipe-body').innerHTML = `<p class="placeholder desktop-only" id="recipe-placeholder">${t('pick_coffee')}</p>`;
    setStatus('status', '');
    show('find');
    $('query').focus({preventScroll: true});
  });
  $('brew-vibrate').addEventListener('click', () => { prefs.vibrate = !prefs.vibrate; savePrefs(); setToggle('brew-vibrate', 'vibrate'); });
  $('brew-sound').addEventListener('click', () => { prefs.sound = !prefs.sound; savePrefs(); setToggle('brew-sound', 'sound'); if (prefs.sound) primeAudio(); });

  refreshMachine();
  setStatus('status', t('status_checking'));
  api('/api/model').then(data => {
    if (photoGeneration) return;
    setStatus('status', data.ocr.available ? t('status_ready', data.coffees) : t('status_no_ocr'));
  }).catch(() => {
    if (!photoGeneration) setStatus('status', t('status_model_error'), true);
  });
}

// Test hook: jump the local timer to a moment (used by the Playwright checks).
window.firstBrew = {
  seek(seconds) {
    if (!currentRecipe) return;
    clearInterval(timerInterval);
    running = false;
    elapsed = seconds;
    updateTimer();
    updateBrewStartLabel();
  },
  state: () => ({screen: currentScreen(), running, elapsed, finished, brewMode, machine: machineState, machineOnline}),
};

init();
