'use strict';
// First Brew — three screens: find → recipe → brew. Plain JS, no build step.

// ---------------------------------------------------------------------------
// UI strings in English and Russian; source coffee names remain as published.
// ---------------------------------------------------------------------------
const NBSP = ' ';
const STRINGS = {
  // Both languages use descriptive wording: the machine
  // (or the person) does the pouring; the app reports what is happening.
  en: {
    app: 'First Brew',
    decimal: '.',
    unit_g: 'g',
    unit_c: '°C',
    unit_s: 's',
    instructions: {'предсмачивание': 'Bloom', 'смачивание': 'Bloom', 'вливание': 'Pour', 'пролив': 'Pour'},
    source_warnings: {
      'В источнике не заполнена часть параметров рецепта.': 'Some recipe parameters are missing from the source.',
      'Сумма вливаний в источнике отличается от общего количества воды.': 'The source pour amounts do not add up to the total water.',
      'В источнике есть неполное или некорректное время вливаний.': 'Some source pour times are missing or invalid.',
    },
    source_notes: {'Все вливания круговыми движениями': 'Pour in circles for every step.'},
    photo_button: 'Take a photo',
    gallery_button: 'Choose from gallery',
    desktop_photo: 'Choose a photo',
    settings: 'Settings',
    language: 'Language',
    reading_slow: 'Reading the label… Taking longer than usual.',
    cancel: 'Cancel',
    photo_cancelled: 'Recognition cancelled. Your photo is still here.',
    we_read: 'We read:',
    unreadable: 'Couldn’t read the label',
    photo_tips: 'A closer photo helps. Avoid glare on the label.',
    retake: 'Retake',
    type_name: 'Type the name',
    general_recipe: 'Use a general starting recipe',
    confirm_recipe: 'Yes, show the recipe',
    not_this: 'Not this coffee',
    country: 'Country',
    processing: 'Processing',
    variety: 'Variety',
    coffee_name: 'Coffee name',
    not_read: 'Not read',
    no_catalog_name: 'No catalog name confirmed',
    clear_name: 'Not a catalog coffee',
    choose_name: 'Search the catalog',
    recognition_review: 'Some text is uncertain. Check the details below.',
    recognition_check: 'Check the details against your bag.',
    what_read: 'What we read',
    recognized_coffee: 'General starting recipe',
    starting_from: name => `Starting recipe based on ${name}`,
    general_note: 'The saved recipes are for filter roast without decaf, so this is a general starting recipe.',
    decaf: 'Decaf',
    espresso: 'Espresso / dark roast',
    review_saved: 'Confirmed label details',
    model_options_error: 'Could not load the label options. Try again.',
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
    recents_title: 'Recently brewed',
    scan_caption: 'Scanning your photo…',
    scan_complete: 'Uploaded photo',
    photo_alt: 'Uploaded coffee bag',
    recent_opened: 'Opened a recipe from this device.',
    recent_copy: 'Your previously used recipe, saved on this device.',
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
    source_note_original: 'Additional instructions are available on the source coffee page.',
    source_warning: 'Some source recipe details may be incomplete. Check the reference page.',
    pour_default: 'Pour',
    target_on_scale: (g) => `${g} on the scale`,
    start_brew: 'Start brewing',
    edit_recipe: 'Edit recipe',
    edit_intro: 'The saved reference recipe is your starting point. Adjust it for your coffee before brewing.',
    edit_review_reason: 'The photo was not read confidently, so please review these recipe values before brewing.',
    edited_recipe: 'Edited for this brew. The saved reference recipe has not changed.',
    edit_pours_hint: 'Changing water or time scales the pours automatically. You can fine-tune each step below.',
    duration_seconds: 'Total time (seconds)',
    grinder: 'Grinder',
    grind_setting_label: 'Grind setting',
    pour_step: (n) => `Pour ${n}`,
    instruction: 'Action',
    pour_water: 'Water added (g)',
    start_seconds: 'Start (seconds)',
    stop_seconds: 'Stop (seconds)',
    save_recipe: 'Apply changes',
    use_recipe: 'Use this recipe',
    cancel_edit: 'Cancel',
    edit_error: 'Check the pour times and amounts. Pours must add up to the total water, and each step must end after it starts within the total time.',
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
    machine_errors: {watchdog: 'The link to the machine was lost during the brew.',
    dry_run: 'The pump ran but the weight did not change. Check the water tank.',
    no_temp_sensor: 'No reading from the temperature sensor.',
    overheat: 'The water got too hot; the heater was switched off.',
    estop: 'The emergency stop is engaged. Restart the machine.'},
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
    source_warnings: {
      'Some recipe parameters are missing from the source.': 'В источнике не заполнена часть параметров рецепта.',
      'The source pour amounts do not add up to the total water.': 'Сумма вливаний в источнике отличается от общего количества воды.',
      'Some source pour times are missing or invalid.': 'В источнике есть неполное или некорректное время вливаний.',
      'The source recipe omits the temperature of one pour.': 'В источнике не указана температура одного вливания.',
      'The source pour amounts do not match the stated total water.': 'Сумма вливаний в источнике отличается от общего количества воды.',
      'The source contains an invalid pour time.': 'В источнике некорректное время вливания.',
      'The source contains an invalid total duration.': 'В источнике некорректная общая длительность.',
    },
    source_notes: {},
    photo_button: 'Сфотографировать пачку',
    gallery_button: 'Выбрать из галереи',
    desktop_photo: 'Выбрать фото',
    settings: 'Настройки',
    language: 'Язык',
    reading_slow: 'Фото распознаётся… Это дольше обычного.',
    cancel: 'Отмена',
    photo_cancelled: 'Распознавание отменено. Фото осталось на экране.',
    we_read: 'Распознано:',
    unreadable: 'Не удалось прочитать этикетку',
    photo_tips: 'Снимок поближе поможет. Избегайте бликов на этикетке.',
    retake: 'Переснять',
    type_name: 'Ввести название',
    general_recipe: 'Использовать общий стартовый рецепт',
    confirm_recipe: 'Да, показать рецепт',
    not_this: 'Это другой кофе',
    country: 'Страна',
    processing: 'Обработка',
    variety: 'Разновидность',
    coffee_name: 'Название кофе',
    not_read: 'Не прочитано',
    no_catalog_name: 'Название из каталога не подтверждено',
    clear_name: 'Кофе вне каталога',
    choose_name: 'Поиск в каталоге',
    recognition_review: 'Часть текста прочитана неуверенно. Проверьте признаки ниже.',
    recognition_check: 'Сверьте признаки с пачкой.',
    what_read: 'Что распознано',
    recognized_coffee: 'Общий стартовый рецепт',
    starting_from: name => `Стартовый рецепт на основе «${name}»`,
    general_note: 'Сохранённые рецепты — для обжарки под фильтр без декафа, поэтому это общий стартовый рецепт.',
    decaf: 'Декаф',
    espresso: 'Эспрессо / тёмная обжарка',
    review_saved: 'Подтверждённые признаки',
    model_options_error: 'Не удалось загрузить признаки этикетки. Попробуйте ещё раз.',
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
    recents_title: 'Недавние заваривания',
    scan_caption: 'Сканируем фото…',
    scan_complete: 'Загруженное фото',
    photo_alt: 'Загруженная пачка кофе',
    recent_opened: 'Открыт рецепт с этого устройства.',
    recent_copy: 'Ранее использованный рецепт с этого устройства.',
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
    source_note_original: 'Дополнительные инструкции доступны на странице кофе.',
    source_warning: 'Некоторые параметры исходного рецепта могут быть неполными. Проверьте страницу кофе.',
    pour_default: 'Вливание',
    target_on_scale: (g) => `${g} на весах`,
    start_brew: 'Начать заваривание',
    edit_recipe: 'Изменить рецепт',
    edit_intro: 'За основу взят ближайший сохранённый рецепт. Настройте его для своего кофе перед завариванием.',
    edit_review_reason: 'Фото распознано неуверенно, поэтому проверьте параметры рецепта перед завариванием.',
    edited_recipe: 'Изменения действуют только для этого заваривания. Исходный рецепт не изменён.',
    edit_pours_hint: 'При изменении воды или времени вливания масштабируются автоматически. Каждый шаг можно настроить отдельно.',
    duration_seconds: 'Общее время (секунды)',
    grinder: 'Кофемолка',
    grind_setting_label: 'Настройка помола',
    pour_step: (n) => `Вливание ${n}`,
    instruction: 'Действие',
    pour_water: 'Вода (г)',
    start_seconds: 'Начало (секунды)',
    stop_seconds: 'Конец (секунды)',
    save_recipe: 'Применить изменения',
    use_recipe: 'Использовать этот рецепт',
    cancel_edit: 'Отмена',
    edit_error: 'Проверьте время и объём вливаний. Сумма должна совпадать с общим объёмом воды, а каждый шаг — завершаться после начала в пределах общего времени.',
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
    machine_errors: {watchdog: 'Связь с машиной прервалась во время заваривания.',
    dry_run: 'Помпа работала, а вес не менялся. Проверьте бак с водой.',
    no_temp_sensor: 'Нет показаний датчика температуры.',
    overheat: 'Вода перегрелась, нагрев выключен.',
    estop: 'Нажата аварийная кнопка. Перезапустите машину.'},
    err_photo_size: 'Выберите фото меньше 20 МБ.',
    err_photo_open: 'Не удалось открыть фото. Сохраните его как JPEG и попробуйте снова.',
    err_generic: 'Не удалось загрузить данные. Попробуйте ещё раз.',
    err_label: 'Не удалось обработать фото.',
  },
};
const SETTINGS_KEY = 'firstbrew.settings.v1';
let LANG = navigator.language?.toLowerCase().startsWith('ru') ? 'ru' : 'en';
try {
  const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  if (['en', 'ru'].includes(saved.language)) LANG = saved.language;
} catch (error) { /* defaults when storage is unavailable */ }
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
  return known || text || t('pour_default');
};
// Known API warnings may be localized; unrecognized source text stays intact.
const sourceWarning = value => STRINGS[LANG].source_warnings[value] || value;
const sourceNote = value => STRINGS[LANG].source_notes[value] || value;

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
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || localStorage.getItem('firstbrew.prefs') || '{}');
    if (typeof saved.vibrate === 'boolean') prefs.vibrate = saved.vibrate;
    if (typeof saved.sound === 'boolean') prefs.sound = saved.sound;
  } catch (error) { /* private mode or blocked storage: keep defaults */ }
}
function savePrefs() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({...prefs, language: LANG})); } catch (error) { /* ignore */ }
}

// Only a small recipe snapshot is kept locally; scans and OCR text are never stored.
const RECENTS_KEY = 'firstbrew.recentRecipes.v1';
const MAX_RECENTS = 8;
function safeRecentUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'theweldercatherine.ru' && !url.port &&
      !url.username && !url.password &&
      url.pathname.startsWith('/catalog/');
  } catch (error) { return false; }
}
function validRecent(entry) {
  const product = entry?.product, recipe = entry?.recipe;
  return Number.isFinite(entry?.usedAt) && entry.usedAt > 0 && entry.usedAt <= Date.now() + 86400000 &&
    typeof product?.name === 'string' && product.name.length > 0 && product.name.length <= 180 &&
    safeRecentUrl(product.url) && Number.isFinite(recipe?.duration_seconds) && recipe.duration_seconds > 0 &&
    Array.isArray(recipe.steps) && recipe.steps.length > 0 && recipe.steps.length <= 30 &&
    recipe.steps.every(step => typeof step.instruction === 'string' &&
      (step.start_seconds == null || Number.isFinite(step.start_seconds)) &&
      (step.stop_seconds == null || Number.isFinite(step.stop_seconds))) &&
    Array.isArray(recipe.warnings) && typeof recipe.notes === 'string';
}
function recentKey(product, recipe) {
  return [product.url, product.name, recipe.name || '', recipe.device || ''].join('|');
}
function loadRecents() {
  try {
    const entries = JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]');
    return Array.isArray(entries) ? entries.filter(validRecent).sort((a, b) => b.usedAt - a.usedAt).slice(0, MAX_RECENTS) : [];
  } catch (error) { return []; }
}
function renderRecents() {
  const entries = loadRecents();
  const list = $('recent-list');
  list.replaceChildren();
  entries.forEach(entry => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'coffee recent-coffee';
    button.setAttribute('role', 'listitem');
    const date = new Intl.DateTimeFormat(LANG, {month: 'short', day: 'numeric'}).format(entry.usedAt);
    button.innerHTML = `<span class="coffee-copy"><strong>${escape(entry.product.name)}</strong><small>${grams(entry.recipe.coffee_g)} · ${grams(entry.recipe.water_g)} · ${date}</small></span><span class="arrow" aria-hidden="true">→</span>`;
    button.addEventListener('click', () => selectRecent(entry));
    list.append(button);
  });
  $('recents').hidden = !entries.length || !!$('query').value.trim();
}
function saveRecent() {
  const product = {id: currentProduct?.id || null,
    name: currentData.confirmed_label && currentData.recommendation_kind !== 'catalog_match'
      ? currentData.reference_name : currentData.product.name, url: currentData.product.url};
  const recipe = currentRecipe;
  if (!safeRecentUrl(product.url)) return;
  const snapshot = {usedAt: Date.now(), product, recipe: {
    name: recipe.name || '', device: recipe.device || '', grinder: recipe.grinder || '',
    grind_setting: recipe.grind_setting || '', coffee_g: recipe.coffee_g, water_g: recipe.water_g,
    temperature_c: recipe.temperature_c, duration_seconds: recipe.duration_seconds, ratio: recipe.ratio,
    steps: recipe.steps.map(step => ({instruction: step.instruction, water_g: step.water_g,
      total_water_g: step.total_water_g, start_seconds: step.start_seconds, stop_seconds: step.stop_seconds})),
    notes: recipe.notes || '', warnings: recipe.warnings || [], edited: !!recipe.edited,
  }, recommendationKind: currentData.recommendation_kind || null,
    recipeSubtitle: currentData.recipe_subtitle || ''};
  if (!validRecent(snapshot)) return;
  const key = recentKey(product, recipe);
  const entries = [snapshot, ...loadRecents().filter(entry => recentKey(entry.product, entry.recipe) !== key)].slice(0, MAX_RECENTS);
  try { localStorage.setItem(RECENTS_KEY, JSON.stringify(entries)); } catch (error) { /* storage may be unavailable */ }
  renderRecents();
}
function selectRecent(entry) {
  cancelPhotoRequests();
  recipeRequest?.abort();
  resetTimer();
  currentProduct = entry.product;
  currentData = {product: entry.product, recipes: [entry.recipe], recommendation_kind: entry.recommendationKind,
    recipe_subtitle: entry.recipeSubtitle, from_recent: true, stale: false};
  recipeLoading = false;
  markSelected();
  setStatus('status', t('recent_opened'));
  renderRecipe(0);
  show('recipe');
}

// ---------------------------------------------------------------------------
// Screens and browser history
// ---------------------------------------------------------------------------
const SCREENS = ['find', 'confirm', 'recipe', 'brew'];
function currentScreen() { return document.body.dataset.screen; }

function show(screen, {push = true} = {}) {
  if (!SCREENS.includes(screen)) screen = 'find';
  if (screen === 'confirm' && !recognition) screen = 'find';
  if (['recipe', 'brew'].includes(screen) && !currentData && !recipeLoading) screen = 'find';
  if (screen === 'brew' && !currentRecipe) screen = currentData ? 'recipe' : 'find';
  if (currentScreen() === 'confirm' && screen !== 'confirm') cancelConfirmation();
  document.body.dataset.screen = screen;
  if (screen === 'confirm') renderConfirmation();
  if (screen === 'recipe' && machineInfo?.enabled) refreshMachine();
  if (screen === 'brew' && brewMode === 'machine') renderMachine();
  if (push && history.state?.screen !== screen) {
    history.pushState({screen}, '', screen === 'find' ? location.pathname : `#${screen}`);
  }
  window.scrollTo(0, 0);
  const focusTarget = screen === 'find' ? null : screen === 'recipe' ? $('recipe-title') : screen === 'confirm' ? $('confirm-title') : $('brew-toggle');
  focusTarget?.focus({preventScroll: true});
}

function back(target) {
  const state = history.state?.screen;
  if (state && state !== 'find' && state === currentScreen()) history.back();
  else show(target, {push: false});
}

window.addEventListener('popstate', event => show(event.state?.screen || 'find', {push: false}));
window.addEventListener('storage', event => { if (event.key === RECENTS_KEY) renderRecents(); });

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
  document.querySelectorAll('#results .coffee').forEach(button => {
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

function renderRecipe(index, editedRecipe = null) {
  if (brewMode === 'machine') leaveMachineMode();
  resetTimer();
  const recipe = currentRecipe = editedRecipe || currentData.recipes[index];
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
    <h1 class="title" id="recipe-title" tabindex="-1">${escape(recipeTitle())}</h1>
    <p class="subtitle">${escape(suggested ? t('starting_from', currentData.reference_name || currentData.product.name) : t('recipe_subtitle'))}</p>
    ${variants}
    ${suggested ? `<p class="note recommendation-basis">${t(currentData.confirmed_label?.decaf || currentData.confirmed_label?.espresso_or_dark ? 'general_note' : 'starting_recipe')}</p>` : ''}
    ${currentData.ocr_uncertain ? `<p class="note error">${t('recognition_review')}</p>` : ''}
    ${currentData.from_recent ? `<p class="note">${t('recent_copy')}</p>` : ''}
    ${currentData.stale ? `<p class="note">${t('stale_data')}</p>` : ''}
    ${recipe.edited ? `<p class="note">${t('edited_recipe')}</p>` : ''}
    ${recipe.warnings.map(w => `<p class="note">${escape(sourceWarning(w))}</p>`).join('')}
    <button type="button" class="button edit-trigger" id="edit-recipe">${t('edit_recipe')}</button>
    <div id="recipe-editor" hidden></div>
    <div id="recipe-summary">
    <div class="figures">${figures.map(([value, unit, label]) => `<div><b>${value}${unit ? `<small>${NBSP}${unit}</small>` : ''}</b><span>${label}</span></div>`).join('')}</div>
    <p class="line"><span>${t('grind')}</span><strong>${grind}</strong></p>
    <p class="line"><span>${t('ratio')}</span><strong>${recipe.ratio ? t('ratio_value', num(recipe.ratio)) : t('ratio_unknown')}</strong></p>
    <h2 class="section">${t('pours')}</h2>
    ${steps ? `<ol class="pours">${steps}</ol>` : `<p class="status">${t('no_steps')}</p>`}
    ${recipe.notes ? `<p class="note">${escape(sourceNote(recipe.notes))}</p>` : ''}
    <p class="source"><a href="${escape(currentData.product.url)}" target="_blank" rel="noopener noreferrer">${suggested ? t('reference_page') : t('coffee_page')} ↗</a></p></div>`;
  document.querySelectorAll('[data-variant]').forEach(button => button.addEventListener('click', () => {
    renderRecipe(Number(button.dataset.variant));
    $('recipe-title').focus({preventScroll: true});
  }));
  $('edit-recipe').addEventListener('click', () => openRecipeEditor(index));
  renderRecipeRecognition();
  $('recipe-cta').hidden = false;
  $('brew-start').disabled = !recipe.duration_seconds;
  updateBrewStartLabel();
}

function openRecipeEditor(index, {uncertain = false} = {}) {
  const source = currentRecipe;
  const steps = source.steps.length ? source.steps : [{instruction: t('pour_default'), water_g: source.water_g,
    start_seconds: 0, stop_seconds: source.duration_seconds}];
  const field = (id, label, value, options = '') => `<label class="edit-field" for="${id}"><span>${label}</span><input id="${id}" name="${id}" value="${escape(value ?? '')}" ${options}></label>`;
  const number = (id, label, value, min, max, step = '1') => field(id, label, value,
    `type="number" inputmode="decimal" required min="${min}" max="${max}" step="${step}"`);
  $('recipe-editor').innerHTML = `<form id="recipe-form" class="recipe-form">
    ${uncertain ? `<p class="note review-reason">${t('edit_review_reason')}</p>` : ''}
    <p class="note">${t('edit_intro')}</p>
    <div class="edit-grid">
      ${number('edit-coffee', `${t('coffee')} (${t('unit_g')})`, source.coffee_g, 1, 100, '0.1')}
      ${number('edit-water', `${t('water')} (${t('unit_g')})`, source.water_g, 10, 2000, '0.1')}
      ${number('edit-temperature', `${t('temperature')} (${t('unit_c')})`, source.temperature_c, 70, 100, '0.5')}
      ${number('edit-duration', t('duration_seconds'), source.duration_seconds, 30, 1800)}
      ${field('edit-grinder', t('grinder'), source.grinder, 'type="text" maxlength="80"')}
      ${field('edit-grind', t('grind_setting_label'), source.grind_setting, 'type="text" maxlength="40"')}
    </div>
    <h2 class="section">${t('pours')}</h2>
    <p class="edit-hint">${t('edit_pours_hint')}</p>
    ${steps.map((step, i) => `<fieldset class="edit-step"><legend>${t('pour_step', i + 1)}</legend>
      <div class="edit-grid">
        ${field(`edit-action-${i}`, t('instruction'), stepName(step.instruction), 'type="text" maxlength="80" required')}
        ${number(`edit-pour-${i}`, t('pour_water'), step.water_g, 0.1, 2000, '0.1')}
        ${number(`edit-start-${i}`, t('start_seconds'), step.start_seconds, 0, 1800)}
        ${number(`edit-stop-${i}`, t('stop_seconds'), step.stop_seconds, 1, 1800)}
      </div></fieldset>`).join('')}
    <p class="note error" id="edit-error" role="alert" hidden>${t('edit_error')}</p>
    <div class="edit-actions${uncertain ? ' single' : ''}">
      <button type="submit" class="button primary${uncertain ? ' big' : ''}">${t(uncertain ? 'use_recipe' : 'save_recipe')}</button>
      ${uncertain ? '' : `<button type="button" class="button" id="cancel-edit">${t('cancel_edit')}</button>`}</div>
  </form>`;
  $('recipe-editor').hidden = false;
  $('recipe-summary').hidden = true;
  $('edit-recipe').hidden = true;
  $('recipe-cta').hidden = true;
  const form = $('recipe-form');
  const initialFields = JSON.stringify([...new FormData(form)]);
  const close = () => {
    $('recipe-editor').hidden = true;
    $('recipe-summary').hidden = false;
    $('edit-recipe').hidden = false;
    $('recipe-cta').hidden = false;
    $('edit-recipe').focus({preventScroll: true});
  };
  $('cancel-edit')?.addEventListener('click', close);
  $('edit-water').addEventListener('input', () => {
    const total = Number($('edit-water').value);
    const original = steps.reduce((sum, step) => sum + Number(step.water_g || 0), 0);
    if (!total || !original) return;
    let assigned = 0;
    steps.forEach((step, i) => {
      const amount = i === steps.length - 1 ? Math.round((total - assigned) * 10) / 10
        : Math.round(total * Number(step.water_g || 0) / original * 10) / 10;
      $('edit-pour-' + i).value = String(amount);
      assigned += amount;
    });
  });
  $('edit-duration').addEventListener('input', () => {
    const duration = Number($('edit-duration').value);
    if (!duration || !source.duration_seconds) return;
    steps.forEach((step, i) => {
      $('edit-start-' + i).value = String(Math.round(Number(step.start_seconds || 0) * duration / source.duration_seconds));
      $('edit-stop-' + i).value = String(Math.round(Number(step.stop_seconds || 0) * duration / source.duration_seconds));
    });
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const value = id => Number($(id).value);
    const editedSteps = steps.map((step, i) => ({...step,
      instruction: $('edit-action-' + i).value.trim(), water_g: value('edit-pour-' + i),
      start_seconds: value('edit-start-' + i), stop_seconds: value('edit-stop-' + i)}));
    const total = value('edit-water'), duration = value('edit-duration');
    let cumulative = 0;
    editedSteps.forEach(step => { cumulative += step.water_g; step.total_water_g = Math.round(cumulative * 10) / 10; });
    const valid = Math.abs(cumulative - total) < 0.11 && editedSteps.every((step, i) =>
      step.instruction && step.stop_seconds > step.start_seconds && step.stop_seconds <= duration &&
      (i === 0 || step.start_seconds >= editedSteps[i - 1].start_seconds));
    $('edit-error').hidden = valid;
    if (!valid) { $('edit-error').scrollIntoView({block: 'nearest'}); return; }
    if (JSON.stringify([...new FormData(form)]) === initialFields) {
      renderRecipe(index, source);
      $('edit-recipe').focus({preventScroll: true});
      return;
    }
    const coffee = value('edit-coffee');
    const edited = {...source, coffee_g: coffee, water_g: total, temperature_c: value('edit-temperature'),
      duration_seconds: duration, grinder: $('edit-grinder').value.trim(), grind_setting: $('edit-grind').value.trim(),
      ratio: Math.round(total / coffee * 10) / 10, steps: editedSteps, edited: true};
    renderRecipe(index, edited);
    $('edit-recipe').focus({preventScroll: true});
  });
  $('edit-coffee').focus({preventScroll: true});
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
let photoPreviewData = null, slowPhotoTimer = null;
function clearPhotoPreview() {
  $('scan-preview').hidden = true;
  $('scan-preview').dataset.scanning = 'false';
  $('recipe-photo').hidden = true;
  $('scan-image').removeAttribute('src');
  $('recipe-photo-image').removeAttribute('src');
  photoPreviewData = null;
  $('confirm-photo').removeAttribute('src');
  $('recipe-recognition').hidden = true;
  $('recipe-photo-label').setAttribute('aria-expanded', 'false');
}
function previewDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(t('err_photo_open')));
    reader.readAsDataURL(blob);
  });
}
function showPhotoPreview(dataUrl) {
  photoPreviewData = dataUrl;
  $('scan-image').src = dataUrl;
  $('recipe-photo-image').src = dataUrl;
  $('confirm-photo').src = dataUrl;
  $('scan-preview').hidden = false;
  $('scan-preview').dataset.scanning = 'true';
  $('scan-caption').textContent = t('scan_caption');
}
function finishPhotoScan() {
  $('scan-preview').dataset.scanning = 'false';
  $('scan-caption').textContent = t('scan_complete');
}
function cancelPhotoRequests({keepPreview = false} = {}) {
  photoGeneration++;
  photoRequest?.abort();
  photoRequest = null;
  clearTimeout(slowPhotoTimer);
  cancelConfirmation();
  if (!keepPreview) { clearPhotoPreview(); recognition = null; }
  finishPhotoScan();
  $('photo-cancel').hidden = true;
  $('photo-button').disabled = false;
  $('gallery-button').disabled = false;
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
    setStatus('confirm-status', t('recipe_error'), true);
    return;
  }
  currentData = {...recommendation.recipe_data,
    confirmed_label: structuredClone(recommendation.label), ocr_uncertain: !!recognition?.ocr.needs_review};
  currentProduct = currentData.product;
  markSelected();
  setStatus('status', t('review_saved'));
  renderRecipe(0);
  $('recipe-photo').hidden = !photoPreviewData;
  show('recipe');
}

// Recognition data lives only in memory. Never persist photos or OCR text.
let recognition = null, draft = null, draftName = '', draftChanged = false;
let modelOptions = null, modelOptionsReady, confirmRequest = null, nameRequest = null, nameTimer;
function photoButtonLabel() {
  $('photo-button').textContent = t(matchMedia('(min-width: 900px)').matches ? 'desktop_photo' : 'photo_button');
}
function cancelConfirmation() {
  confirmRequest?.abort(); confirmRequest = null;
  nameRequest?.abort(); nameRequest = null;
  clearTimeout(nameTimer);
}
function featureName(type, key) {
  const aliases = modelOptions?.[type]?.[key];
  if (!aliases) return key || t('not_read');
  const value = LANG === 'ru' ? aliases[0] : type === 'countries' ? aliases[1] : aliases.at(-1);
  return type === 'countries' ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}
function recognizedTitle(label) {
  const parts = [label?.country ? featureName('countries', label.country) : '',
    ...(label?.processing || []).map(key => featureName('processing', key))].filter(Boolean);
  if (label?.decaf) parts.push(t('decaf'));
  if (label?.espresso_or_dark) parts.push(t('espresso'));
  return parts.join(' · ') || label?.name || t('recognized_coffee');
}
function recipeTitle() {
  return currentData.confirmed_label && currentData.recommendation_kind !== 'catalog_match'
    ? recognizedTitle(currentData.confirmed_label) : currentData.product.name;
}
function isUnreadable() {
  const rec = recognition?.recommendation;
  return recognition?.photo_state === 'unreadable' || (recognition?.ocr.needs_review &&
    !rec?.label.country && !rec?.label.processing?.length && !rec?.candidates?.length);
}
function isExactRecognition() {
  return !draftChanged && recognition?.recommendation.candidates.some(c => c.exact_name);
}
function detailsSummary(label, value) {
  return `<summary><span><small>${t(label)}</small><br>${escape(value || t('not_read'))}</span></summary>`;
}
function renderConfirmation() {
  const unreadable = isUnreadable();
  $('confirm-back').textContent = t('back');
  $('confirm-title').textContent = t(unreadable ? 'unreadable' : 'we_read');
  $('photo-tips').textContent = t('photo_tips');
  $('unreadable-help').hidden = !unreadable;
  $('recognized-fields').hidden = unreadable;
  for (const [id, key] of [['confirm-recipe', 'confirm_recipe'], ['not-this-coffee', 'not_this'],
    ['photo-retake', 'retake'], ['type-name', 'type_name'], ['general-recipe', 'general_recipe']]) $(id).textContent = t(key);
  $('confirm-recipe').hidden = unreadable;
  $('confirm-recipe').disabled = false;
  $('not-this-coffee').hidden = unreadable || isExactRecognition();
  ['photo-retake', 'type-name', 'general-recipe'].forEach(id => { $(id).hidden = !unreadable; $(id).disabled = false; });
  setStatus('confirm-status', unreadable ? '' : t(recognition.ocr.needs_review ? 'recognition_review' : 'recognition_check'));
  if (unreadable) return;
  const options = (type, selected) => `<option value="">${t('not_read')}</option>` +
    Object.keys(modelOptions?.[type] || {}).map(key => `<option value="${escape(key)}" ${key === selected ? 'selected' : ''}>${escape(featureName(type, key))}</option>`).join('');
  const varietyText = (draft.variety || []).map(key => featureName('varieties', key)).join(', ');
  $('recognized-fields').innerHTML = `<div class="recognition-fields">
    <details id="name-chip">${detailsSummary('coffee_name', draftName || t('no_catalog_name'))}
      <label class="label" for="confirm-name">${t('choose_name')}</label>
      <input id="confirm-name" type="search" maxlength="120" autocomplete="off" placeholder="${t('search_placeholder')}">
      <div class="candidates" id="confirm-candidates"></div>
      <button class="text-button" type="button" id="clear-name">${t('clear_name')}</button>
    </details>
    <details id="country-chip">${detailsSummary('country', draft.country && featureName('countries', draft.country))}
      <select id="confirm-country" aria-label="${t('country')}">${options('countries', draft.country)}</select>
    </details>
    <details id="processing-chip">${detailsSummary('processing', draft.processing.map(key => featureName('processing', key)).join(', '))}
      ${Object.keys(modelOptions?.processing || {}).map(key => `<label class="check"><input type="checkbox" name="confirm-processing" value="${key}" ${draft.processing.includes(key) ? 'checked' : ''}>${escape(featureName('processing', key))}</label>`).join('')}
    </details>
    <details id="variety-chip">${detailsSummary('variety', varietyText)}
      <input id="confirm-variety" type="text" maxlength="120" aria-label="${t('variety')}" value="${escape(varietyText)}">
    </details>
    ${draft.decaf ? `<span>${t('decaf')}</span>` : ''}${draft.espresso_or_dark ? `<span>${t('espresso')}</span>` : ''}
  </div>`;
  const changed = () => {
    cancelConfirmation();
    draftChanged = true;
    // A changed feature must not be overridden by the previous exact name match.
    draftName = ''; draft.name = null;
    updateChipSummary('name-chip', 'coffee_name', t('no_catalog_name'));
    $('confirm-recipe').disabled = false;
    $('not-this-coffee').hidden = false;
  };
  $('confirm-country').addEventListener('change', event => {
    changed(); draft.country = event.target.value || null;
    updateChipSummary('country-chip', 'country', draft.country && featureName('countries', draft.country));
  });
  document.querySelectorAll('[name=confirm-processing]').forEach(input => input.addEventListener('change', () => {
    changed(); draft.processing = [...document.querySelectorAll('[name=confirm-processing]:checked')].map(el => el.value);
    updateChipSummary('processing-chip', 'processing', draft.processing.map(key => featureName('processing', key)).join(', '));
  }));
  $('confirm-variety').addEventListener('input', event => {
    changed(); draft.variety = [event.target.value.trim()].filter(Boolean);
    updateChipSummary('variety-chip', 'variety', event.target.value);
  });
  $('clear-name').addEventListener('click', () => { changed(); $('name-chip').open = false; });
  renderNameCandidates(recognition.recommendation.candidates || []);
  $('confirm-name').addEventListener('input', () => {
    clearTimeout(nameTimer); nameRequest?.abort();
    const query = $('confirm-name').value.trim();
    if (!query) { renderNameCandidates(recognition.recommendation.candidates || []); return; }
    nameTimer = setTimeout(() => searchConfirmationNames(query), 300);
  });
}
function updateChipSummary(id, label, value) {
  const summary = $(id).querySelector('summary');
  summary.innerHTML = `<span><small>${t(label)}</small><br>${escape(value || t('not_read'))}</span>`;
}
function renderNameCandidates(candidates) {
  const container = $('confirm-candidates');
  if (!container) return;
  container.replaceChildren();
  candidates.forEach(candidate => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'button'; button.textContent = candidate.name;
    button.addEventListener('click', async () => {
      cancelConfirmation();
      const request = confirmRequest = new AbortController();
      $('confirm-recipe').disabled = true;
      setStatus('confirm-status', t('catalog_searching'));
      try {
        const result = await post('/api/recommend', JSON.stringify({text: candidate.name}), 'application/json', request.signal);
        if (confirmRequest !== request) return;
        recognition = {...recognition, recommendation: result};
        draft = structuredClone(result.label); draftName = result.kind === 'catalog_match' ? candidate.name : '';
        draftChanged = false;
        renderConfirmation();
      } catch (error) { if (error.name !== 'AbortError') setStatus('confirm-status', t('recipe_error'), true); }
      finally { if (confirmRequest === request) { confirmRequest = null; $('confirm-recipe').disabled = false; } }
    });
    container.append(button);
  });
}
async function searchConfirmationNames(query) {
  const request = nameRequest = new AbortController();
  try {
    const data = await api(`/api/search?q=${encodeURIComponent(query)}`, request.signal);
    if (nameRequest === request) renderNameCandidates(data.products);
  } catch (error) { if (error.name !== 'AbortError') setStatus('confirm-status', t('catalog_empty'), true); }
}
function confirmedText() {
  // Rebuild from the confirmed fields, never from the old OCR text: removed
  // fields must stay removed. Explicit labels prevent accidental inference.
  const lines = [];
  if (draftName) lines.push(`Название: ${draftName}`);
  if (draft.country) lines.push(`Страна: ${modelOptions.countries[draft.country][0]}`);
  if (draft.processing.length) lines.push(`Обработка: ${draft.processing.map(k => modelOptions.processing[k][0]).join(', ')}`);
  if (draft.variety.length) lines.push(`Разновидность: ${draft.variety.join(', ')}`);
  if (draft.decaf) lines.push('Decaf');
  if (draft.espresso_or_dark) lines.push('Espresso');
  return lines.join('\n');
}
async function confirmRecipe({general = false} = {}) {
  cancelConfirmation();
  const request = confirmRequest = new AbortController();
  $('confirm-recipe').disabled = true; $('general-recipe').disabled = true;
  try {
    let result = recognition.recommendation;
    if (general || draftChanged) {
      if (!general && !modelOptions) throw new Error(t('model_options_error'));
      result = await post('/api/recommend', JSON.stringify({text: general ? '' : confirmedText()}), 'application/json', request.signal);
    }
    if (confirmRequest !== request) return;
    showRecommendation(result);
  } catch (error) { if (error.name !== 'AbortError') setStatus('confirm-status', error.message, true); }
  finally { if (confirmRequest === request) { confirmRequest = null; $('confirm-recipe').disabled = false; $('general-recipe').disabled = false; } }
}
function renderRecipeRecognition() {
  const label = currentData.confirmed_label;
  $('recipe-recognition').hidden = true;
  $('recipe-photo-label').setAttribute('aria-expanded', 'false');
  $('recipe-photo').hidden = !photoPreviewData || !label;
  $('recipe-recognition').replaceChildren();
  if (!label) return;
  const fields = [[t('coffee_name'), currentData.recommendation_kind === 'catalog_match' ? currentData.product.name : label.name],
    [t('country'), label.country && featureName('countries', label.country)],
    [t('processing'), label.processing.map(k => featureName('processing', k)).join(', ')],
    [t('variety'), label.variety.map(k => featureName('varieties', k)).join(', ')]];
  fields.forEach(([name, value]) => {
    const line = document.createElement('p'); line.textContent = `${name}: ${value || t('not_read')}`;
    $('recipe-recognition').append(line);
  });
}
function searchInstead(useText) {
  const text = useText ? recognition?.text || '' : '';
  cancelPhotoRequests({keepPreview: true});
  show('find');
  $('query').value = text.slice(0, 120).replace(/\s+/g, ' ');
  $('query').focus({preventScroll: true});
  if ($('query').value) search($('query').value);
}
function wireRecognition() {
  $('confirm-back').addEventListener('click', () => back('find'));
  $('confirm-recipe').addEventListener('click', () => confirmRecipe());
  $('not-this-coffee').addEventListener('click', () => searchInstead(true));
  $('type-name').addEventListener('click', () => searchInstead(false));
  $('general-recipe').addEventListener('click', () => confirmRecipe({general: true}));
  $('photo-retake').addEventListener('click', () => $(matchMedia('(min-width: 900px)').matches ? 'gallery-input' : 'photo-input').click());
  $('recipe-photo-label').addEventListener('click', () => {
    $('recipe-recognition').hidden = !$('recipe-recognition').hidden;
    $('recipe-photo-label').setAttribute('aria-expanded', String(!$('recipe-recognition').hidden));
  });
}

async function handlePhoto(file) {
  if (!file) return;
  cancelPhotoRequests();
  recipeRequest?.abort();
  resetTimer();
  currentRecipe = currentData = currentProduct = null;
  recipeLoading = false;
  markSelected();
  show('find', {push: false});
  setStatus('status', t('status_reading'));
  $('photo-button').disabled = true;
  $('gallery-button').disabled = true;
  slowPhotoTimer = setTimeout(() => {
    setStatus('status', t('reading_slow'));
    $('photo-cancel').hidden = false;
  }, 5000);
  const generation = photoGeneration;
  photoRequest = new AbortController();
  try {
    const body = await photoBlob(file);
    if (generation !== photoGeneration) return;
    const preview = await previewDataUrl(body);
    if (generation !== photoGeneration) return;
    showPhotoPreview(preview);
    const data = await post('/api/label', body, 'image/jpeg', photoRequest.signal);
    if (generation !== photoGeneration) return;
    await modelOptionsReady;
    if (generation !== photoGeneration) return;
    recognition = data;
    draft = structuredClone(data.recommendation.label);
    draftName = data.recommendation.kind === 'catalog_match' ? data.recommendation.recipe_data.product.name : '';
    draftChanged = false;
    renderConfirmation();
    show('confirm');
    if (isExactRecognition()) $('confirm-recipe').focus({preventScroll: true});
  } catch (error) {
    if (error.name !== 'AbortError' && generation === photoGeneration) setStatus('status', error.message, true);
  } finally {
    if (generation === photoGeneration) {
      clearTimeout(slowPhotoTimer);
      $('photo-cancel').hidden = true;
      photoRequest = null;
      finishPhotoScan();
      $('photo-button').disabled = false;
      $('gallery-button').disabled = false;
    }
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
    saveRecent();
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
function localize() {
  document.documentElement.lang = LANG;
  document.title = t('app');
  photoButtonLabel();
  $('gallery-button').textContent = t('gallery_button');
  $('photo-cancel').textContent = t('cancel');
  $('settings-button').setAttribute('aria-label', t('settings'));
  $('language-label').textContent = t('language');
  $('language').value = LANG;
  $('confirm-photo').alt = t('photo_alt');
  $('scan-image').alt = t('photo_alt');
  $('recipe-photo-image').alt = t('photo_alt');
  $('recipe-photo-label').textContent = t('what_read');
  $('search-label').textContent = t('search_label');
  $('query').placeholder = t('search_placeholder');
  $('show-all').textContent = t('show_all');
  $('recents-title').textContent = t('recents_title');
  renderRecents();
  $('recipe-back').textContent = t('back');
  if ($('recipe-placeholder')) {
    $('recipe-placeholder').textContent = t('pick_coffee');
    $('recipe-placeholder').classList.add('desktop-only');
  }
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

}

function init() {
  loadPrefs();
  localize();
  history.replaceState({screen: 'find'}, '', location.pathname + location.search);
  document.body.dataset.screen = 'find';

  $('settings-button').addEventListener('click', () => {
    $('settings-panel').hidden = !$('settings-panel').hidden;
    $('settings-button').setAttribute('aria-expanded', String(!$('settings-panel').hidden));
  });
  $('language').addEventListener('change', () => {
    LANG = $('language').value;
    savePrefs(); localize();
    if (!photoRequest) setStatus('status', t('status_ready', modelOptions?.coffees || 0));
    if (currentData && !running && brewMode === 'local') renderRecipe(0, currentRecipe);
  });
  const wide = matchMedia('(min-width: 900px)');
  wide.addEventListener('change', photoButtonLabel);
  $('photo-button').addEventListener('click', () => $(wide.matches ? 'gallery-input' : 'photo-input').click());
  $('gallery-button').addEventListener('click', () => $('gallery-input').click());
  $('photo-cancel').addEventListener('click', () => {
    cancelPhotoRequests({keepPreview: true});
    setStatus('status', t('photo_cancelled'));
  });
  ['photo-input', 'gallery-input'].forEach(id => $(id).addEventListener('change', event => {
    handlePhoto(event.target.files[0]);
    event.target.value = '';
  }));
  $('search-form').addEventListener('submit', event => {
    event.preventDefault();
    clearTimeout(searchTimer);
    search($('query').value.trim());
  });
  $('query').addEventListener('input', () => {
    clearTimeout(searchTimer);
    const query = $('query').value.trim();
    $('recents').hidden = !!query || !$('recent-list').children.length;
    if (!query) {
      searchRequest?.abort();
      $('results').replaceChildren();
      $('results').hidden = true;
      setStatus('catalog-status', '');
      return;
    }
    searchTimer = setTimeout(() => search(query), 300);
  });
  $('show-all').addEventListener('click', () => { $('query').value = ''; renderRecents(); search(''); });

  $('recipe-back').addEventListener('click', () => back('find'));
  $('brew-start').addEventListener('click', () => {
    if (!currentRecipe?.duration_seconds) return;
    if (brewMode === 'machine') leaveMachineMode();
    show('brew');
    if (!running && elapsed === 0) { saveRecent(); toggleTimer(); }
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
    cancelPhotoRequests();
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

  wireRecognition();
  refreshMachine();
  setStatus('status', t('status_checking'));
  modelOptionsReady = api('/api/model').then(data => {
    modelOptions = data;
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
