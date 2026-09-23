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
    survey_eyebrow: 'PourPour pre-order',
    survey_title: '15% off your pre-order',
    survey_text: 'Take a short survey about how you brew coffee and get a 15% discount on your PourPour pre-order.',
    survey_button: 'Take the survey',
    builder_open: 'Build a recipe for my coffee',
    builder_title: 'Build a starting recipe',
    builder_intro: 'Your coffee and equipment shape a practical first brew. Tune it by taste afterward.',
    builder_mode_basic: 'Basic mode',
    builder_mode_pro: 'Pro mode',
    builder_step: (n) => `Step ${n} of 5`,
    builder_step_coffee: 'Coffee details',
    builder_step_tools: 'Your equipment',
    builder_step_recipe: 'Starting recipes',
    builder_next: 'Next: equipment',
    builder_build: 'Build recipes',
    builder_rebuild: 'Update recipes',
    builder_loading: 'Building your recipes…',
    builder_options_loading: 'Loading options…',
    builder_error: 'Could not build a recipe. Check the fields and try again.',
    builder_unknown: 'Not specified',
    builder_country: 'Country of origin',
    builder_processing: 'Processing',
    builder_roast_age: 'Roast age',
    builder_roast_date: 'Roast date',
    builder_roast: 'Roast level',
    builder_light: 'Light',
    builder_medium: 'Medium',
    builder_dark: 'Dark',
    builder_region: 'Region',
    builder_variety: 'Variety',
    builder_q_grade: 'Q grade',
    builder_water_ph: 'Water pH',
    builder_water_tds: 'Water TDS (ppm)',
    builder_age_fresh: 'Up to 2 weeks',
    builder_age_2w: 'More than 2 weeks',
    builder_age_1m: 'More than 1 month',
    builder_age_2m: 'More than 2 months',
    builder_age_4m: 'More than 4 months',
    builder_age_6m: 'More than 6 months',
    builder_age_date: 'Choose a date',
    builder_device: 'Brewer',
    builder_grinder: 'Grinder',
    builder_material: 'Brewer material',
    builder_filter: 'Filter',
    builder_dose: 'Coffee dose (g)',
    builder_water_amount: 'Water (g)',
    builder_custom_name: 'Your brewer name',
    builder_bed_height: 'Bed height at 15 g (mm)',
    builder_filter_fit: 'Filter fit',
    builder_fit_tight: 'Tight',
    builder_fit_good: 'Good',
    builder_fit_loose: 'Loose',
    builder_group_cone: 'Conical drippers',
    builder_group_flat: 'Flat-bottom drippers',
    builder_group_immersion: 'Immersion and hybrid',
    builder_group_machine: 'Automatic drip',
    builder_group_custom: 'My dripper',
    builder_help: (field) => `Why ${field} matters`,
    builder_help_country: 'Origin gives context, but does not silently change numeric parameters.',
    builder_help_processing: 'Processing changes the first grind and pour suggestion. It is a starting hypothesis.',
    builder_help_roast_age: 'Fresh coffee may release more gas; the bloom can be longer.',
    builder_help_roast_date: 'The date makes roast age explicit. Your coffee bag is the source.',
    builder_help_roast: 'Darker roasts usually start cooler and coarser than lighter roasts.',
    builder_help_device: 'The brewer determines whether the recipe uses pours, steeping or an automatic program.',
    builder_help_grinder: 'A setting is only shown when the comparison table covers that exact model.',
    builder_help_material: 'Glass and metal may absorb more heat; preheat the brewer.',
    builder_help_filter: 'A dense filter may slow the flow, so the first grind suggestion changes.',
    builder_help_dose: 'Dose and water set the starting brew ratio.',
    builder_help_water_amount: 'Water is the amount poured in, not the beverage yield.',
    builder_help_bed_height: 'A tall bed calls for a gentler pour near the center.',
    builder_help_filter_fit: 'How the paper sits affects flow; custom brewers need this input.',
    builder_help_water_tds: 'TDS alone is not water hardness; any adjustment based on it is especially uncertain.',
    builder_help_water_ph: 'pH is kept as context until a calibrated rule is available.',
    builder_help_context: 'Useful background, not a proven numerical adjustment.',
    builder_pick_option: 'Choose an option from the list, or leave this field empty.',
    builder_required_custom: 'Enter the name, bed height, filter fit and material for your dripper.',
    builder_calculated: 'Calculated from parameters · not a roaster recipe',
    builder_approximate: 'All settings are starting points. Adjust them by taste and drawdown.',
    builder_grind_nominal: 'Nominal particle target, not a measured particle size',
    builder_grind_unmapped: 'No reliable setting for this grinder; dial in by taste.',
    builder_variant_position: (i, n) => `${i} / ${n}`,
    builder_variant_brighter: 'Brighter',
    builder_variant_sweeter: 'Sweeter',
    builder_summary_brighter: 'More clarity and acidity.',
    builder_summary_sweeter: 'More body and longer contact.',
    builder_prev_variant: 'Previous recipe',
    builder_next_variant: 'Next recipe',
    builder_more_context: (n) => `+${n} more`,
    builder_increase: 'Increase',
    builder_decrease: 'Decrease',
    builder_process: 'Brew process',
    builder_start_col: 'Start',
    builder_scale_col: 'On scale',
    builder_action_col: 'Action and reason',
    builder_automatic: 'Set the brewer to its standard mode. There are no manual pours.',
    builder_reasons: 'Why these values?',
    builder_favorite: 'Add to favorites',
    builder_unfavorite: 'Remove from favorites',
    builder_brew: 'Brew this recipe',
    builder_timer_later: 'A timer for this brewing method arrives in the next phase.',
    builder_no_recipe: 'Complete the coffee and equipment steps to see recipes.',
    builder_actions: {
      'Смачиваем весь кофе': 'Wet all the coffee',
      'Вливаем тонкой струёй ближе к центру': 'Pour gently near the center',
      'Вливаем плавно по кругу': 'Pour evenly in circles',
      'Заливаем весь кофе': 'Add all the water',
      'Настаиваем': 'Steep',
      'Отжимаем': 'Press',
      'Открываем слив': 'Open the drain',
    },
    builder_whys: {
      'Даём газу выйти перед основными вливаниями.': 'Let gas escape before the main pours.',
      'Мягкая струя снижает турбулентность.': 'A gentle stream reduces turbulence.',
      'Равномерно поддерживаем уровень воды над слоем.': 'Keep water level even above the bed.',
      'Весь кофе настаивается одновременно.': 'All the coffee steeps at the same time.',
      'Контакт воды с кофе раскрывает вкус.': 'Contact with water extracts flavor.',
      'Завершаем контакт воды с кофе.': 'End contact between coffee and water.',
    },
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
    survey_eyebrow: 'Предзаказ PourPour',
    survey_title: 'Скидка 15% на предзаказ',
    survey_text: 'Пройдите короткий опрос о том, как вы завариваете кофе, и получите скидку 15% на предзаказ PourPour.',
    survey_button: 'Пройти опрос',
    builder_open: 'Собрать рецепт для своего кофе',
    builder_title: 'Собрать стартовый рецепт',
    builder_intro: 'Кофе и оборудование задают отправную точку. После заваривания подстроите её по вкусу.',
    builder_mode_basic: 'Обычный режим',
    builder_mode_pro: 'Pro-режим',
    builder_step: (n) => `Шаг ${n} из 5`,
    builder_step_coffee: 'О кофе',
    builder_step_tools: 'Оборудование',
    builder_step_recipe: 'Стартовые рецепты',
    builder_next: 'Далее: оборудование',
    builder_build: 'Собрать рецепты',
    builder_rebuild: 'Обновить рецепты',
    builder_loading: 'Собираем рецепты…',
    builder_options_loading: 'Загружаем варианты…',
    builder_error: 'Не удалось собрать рецепт. Проверьте поля и попробуйте ещё раз.',
    builder_unknown: 'Не указано',
    builder_country: 'Страна происхождения',
    builder_processing: 'Обработка',
    builder_roast_age: 'Возраст обжарки',
    builder_roast_date: 'Дата обжарки',
    builder_roast: 'Степень обжарки',
    builder_light: 'Светлая',
    builder_medium: 'Средняя',
    builder_dark: 'Тёмная',
    builder_region: 'Регион',
    builder_variety: 'Сорт',
    builder_q_grade: 'Q grade',
    builder_water_ph: 'pH воды',
    builder_water_tds: 'TDS воды (ppm)',
    builder_age_fresh: 'До 2 недель',
    builder_age_2w: 'Больше 2 недель',
    builder_age_1m: 'Больше месяца',
    builder_age_2m: 'Больше 2 месяцев',
    builder_age_4m: 'Больше 4 месяцев',
    builder_age_6m: 'Больше полугода',
    builder_age_date: 'Выбрать дату',
    builder_device: 'Устройство',
    builder_grinder: 'Кофемолка',
    builder_material: 'Материал воронки',
    builder_filter: 'Фильтр',
    builder_dose: 'Кофе (г)',
    builder_water_amount: 'Вода (г)',
    builder_custom_name: 'Название своей воронки',
    builder_bed_height: 'Высота слоя на 15 г (мм)',
    builder_filter_fit: 'Прилегание фильтра',
    builder_fit_tight: 'Плотное',
    builder_fit_good: 'Хорошее',
    builder_fit_loose: 'Слабое',
    builder_group_cone: 'Конические воронки',
    builder_group_flat: 'Плоскодонные воронки',
    builder_group_immersion: 'Иммерсия и гибриды',
    builder_group_machine: 'Капельные кофеварки',
    builder_group_custom: 'Своя воронка',
    builder_help: (field) => `Зачем нужно поле «${field}»`,
    builder_help_country: 'Страна даёт контекст, но сама по себе не меняет числа в рецепте.',
    builder_help_processing: 'Обработка влияет на стартовый помол и схему вливания. Это лишь гипотеза.',
    builder_help_roast_age: 'Свежий кофе может сильнее выделять газ; предсмачивание будет дольше.',
    builder_help_roast_date: 'Дата позволяет явно посчитать возраст кофе. Смотрите её на пачке.',
    builder_help_roast: 'Для тёмной обжарки обычно начинаем с меньшей температуры и более грубого помола.',
    builder_help_device: 'Устройство определяет, нужны ли вливания, настаивание или автоматический режим.',
    builder_help_grinder: 'Настройку показываем только для точной модели из таблицы соответствий.',
    builder_help_material: 'Стекло и металл могут забирать тепло; прогрейте воронку.',
    builder_help_filter: 'Плотная бумага может замедлить слив, поэтому стартовый помол меняется.',
    builder_help_dose: 'Доза и вода задают начальное соотношение.',
    builder_help_water_amount: 'Это влитая вода, а не вес готового напитка.',
    builder_help_bed_height: 'Высокий слой требует мягкого вливания ближе к центру.',
    builder_help_filter_fit: 'Посадка бумаги влияет на слив; для своей воронки этот параметр обязателен.',
    builder_help_water_tds: 'TDS не равен жёсткости воды; поправка по нему особенно неточна.',
    builder_help_water_ph: 'pH пока сохраняется как контекст, без численной поправки.',
    builder_help_context: 'Полезный контекст, но не доказанная численная поправка.',
    builder_pick_option: 'Выберите вариант из списка или оставьте поле пустым.',
    builder_required_custom: 'Для своей воронки укажите название, высоту слоя, посадку фильтра и материал.',
    builder_calculated: 'Собрано по параметрам · не рецепт обжарщика',
    builder_approximate: 'Все настройки стартовые. Подстройте по вкусу и времени слива.',
    builder_grind_nominal: 'Условная цель, а не измеренный размер частиц',
    builder_grind_unmapped: 'Для этой кофемолки нет проверенной настройки; подбирайте по вкусу.',
    builder_variant_position: (i, n) => `${i} / ${n}`,
    builder_variant_brighter: 'Ярче',
    builder_variant_sweeter: 'Слаще',
    builder_summary_brighter: 'Выше прозрачность и кислотность.',
    builder_summary_sweeter: 'Плотнее тело и длиннее контакт.',
    builder_prev_variant: 'Предыдущий рецепт',
    builder_next_variant: 'Следующий рецепт',
    builder_more_context: (n) => `Ещё ${n}`,
    builder_increase: 'Увеличить',
    builder_decrease: 'Уменьшить',
    builder_process: 'Процесс заваривания',
    builder_start_col: 'Старт',
    builder_scale_col: 'На весах',
    builder_action_col: 'Действие и причина',
    builder_automatic: 'Включите стандартный режим кофеварки. Ручных вливаний нет.',
    builder_reasons: 'Почему именно так?',
    builder_favorite: 'В избранное',
    builder_unfavorite: 'Убрать из избранного',
    builder_brew: 'Заварить',
    builder_timer_later: 'Таймер для этого метода появится в следующей фазе.',
    builder_no_recipe: 'Заполните шаги о кофе и оборудовании, чтобы получить рецепт.',
    builder_actions: {},
    builder_whys: {},
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
let LANG = 'ru';
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
  const known = STRINGS[LANG].instructions[text.toLowerCase()] || STRINGS[LANG].builder_actions[text];
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
const builder = {options: null, step: 0, mode: 'basic', draft: {}, variants: [], selected: 0,
  request: null, busy: false, updateTimer: null};
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
  if (currentRecipe?.origin === 'calculated') return;
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
const SCREENS = ['find', 'confirm', 'recipe', 'construct', 'brew'];
function currentScreen() { return document.body.dataset.screen; }

function show(screen, {push = true} = {}) {
  if (!SCREENS.includes(screen)) screen = 'find';
  if (screen === 'confirm' && !recognition) screen = 'find';
  if (screen === 'recipe' && !currentData && !recipeLoading) screen = 'find';
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
  const focusTarget = screen === 'find' ? null : screen === 'recipe' ? $('recipe-title')
    : screen === 'confirm' ? $('confirm-title') : screen === 'construct' ? $('builder-title') : $('brew-toggle');
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
// Parameter builder: coffee → equipment → calculated starting recipes.
// The roaster/catalog flow above stays separate and unchanged.
// ---------------------------------------------------------------------------
const BUILDER_FAVORITES_KEY = 'firstbrew.favorites.v1';
const builderOptionName = item => item?.[LANG === 'ru' ? 'name_ru' : 'name_en'] || '';
const builderOption = (item, selected) => `<option value="${escape(item.id)}"${item.id === selected ? ' selected' : ''}>${escape(builderOptionName(item))}</option>`;
const builderHelp = (label, key) => `<details class="builder-help"><summary aria-label="${escape(t('builder_help', label))}">?</summary><p>${escape(t(key))}</p></details>`;
const builderField = (id, label, control, help) => `<div class="builder-field"><div class="builder-field-head"><label for="${id}">${escape(label)}</label>${builderHelp(label, help)}</div>${control}</div>`;
const builderSelect = (id, options, selected = '') => `<select id="${id}">${options}</select>`;
const builderInput = (id, type, value = '', extra = '') => `<input id="${id}" type="${type}" value="${escape(value)}" ${extra}>`;
const builderUnknownOption = () => `<option value="">${escape(t('builder_unknown'))}</option>`;

function builderResolve(kind, text) {
  const value = String(text || '').trim().toLowerCase();
  if (!value) return null;
  return builder.options[kind].find(item => [item.id, item.name_ru, item.name_en]
    .some(name => name.toLowerCase() === value))?.id || null;
}

function captureBuilderDraft() {
  if (!$('cb-country')) return;
  const d = builder.draft;
  for (const key of ['country', 'processing', 'age', 'date', 'region', 'variety', 'q_grade',
    'water_ph', 'water_tds', 'device', 'grinder', 'material', 'filter', 'dose', 'water',
    'custom_name', 'bed_height', 'filter_fit', 'roast_pro']) {
    const node = $(`cb-${key.replaceAll('_', '-')}`);
    if (node) d[key] = node.value;
  }
  d.roast = document.querySelector('[name="cb-roast"]:checked')?.value || d.roast || 'light';
}

function renderBuilderFields() {
  if (!builder.options) return;
  const d = builder.draft;
  const items = builder.options;
  const countryValues = items.countries.map(item => `<option value="${escape(builderOptionName(item))}"></option>`).join('');
  const grinderValues = items.grinders.map(item => `<option value="${escape(builderOptionName(item))}"></option>`).join('');
  const processingOptions = builderUnknownOption() + items.processing.map(item => builderOption(item, d.processing)).join('');
  const materialOptions = builderUnknownOption() + items.materials.map(item => builderOption(item, d.material)).join('');
  const filterOptions = builderUnknownOption() + items.filters.map(item => builderOption(item, d.filter)).join('');
  const ageOptions = [
    ['', 'builder_unknown'], ['fresh', 'builder_age_fresh'], ['over_2_weeks', 'builder_age_2w'],
    ['over_1_month', 'builder_age_1m'], ['over_2_months', 'builder_age_2m'],
    ['over_4_months', 'builder_age_4m'], ['over_6_months', 'builder_age_6m'], ['date', 'builder_age_date'],
  ].map(([value, key]) => `<option value="${value}"${d.age === value ? ' selected' : ''}>${escape(t(key))}</option>`).join('');
  const deviceGroups = [
    ['builder_group_cone', item => item.method === 'percolation' && item.geometry === 'cone'],
    ['builder_group_flat', item => item.method === 'percolation' && item.geometry === 'flat'],
    ['builder_group_immersion', item => ['immersion', 'hybrid'].includes(item.method)],
    ['builder_group_machine', item => item.method === 'automatic_drip'],
    ['builder_group_custom', item => item.id === 'custom_dripper'],
  ].map(([label, predicate]) => `<optgroup label="${escape(t(label))}">${items.devices.filter(predicate)
    .map(item => builderOption(item, d.device || 'v60')).join('')}</optgroup>`).join('');
  const roastOptions = ['light', 'medium', 'dark'].map(value => `<label class="builder-roast-choice"><input type="radio" name="cb-roast" value="${value}"${(d.roast || 'light') === value ? ' checked' : ''}><span>${escape(t(`builder_${value}`))}</span></label>`).join('');
  const pro = builder.mode === 'pro';
  $('builder-fields').innerHTML = `<div class="builder-field-group" id="builder-coffee-fields">
    ${builderField('cb-country', t('builder_country'), `${builderInput('cb-country', 'search', d.country || '', 'list="builder-countries" autocomplete="off"')}<datalist id="builder-countries">${countryValues}</datalist>`, 'builder_help_country')}
    ${builderField('cb-processing', t('builder_processing'), builderSelect('cb-processing', processingOptions), 'builder_help_processing')}
    ${builderField('cb-age', t('builder_roast_age'), builderSelect('cb-age', ageOptions), 'builder_help_roast_age')}
    <div id="builder-date-field"${d.age === 'date' ? '' : ' hidden'}>${builderField('cb-date', t('builder_roast_date'), builderInput('cb-date', 'date', d.date || ''), 'builder_help_roast_date')}</div>
    ${builderField(pro ? 'cb-roast-pro' : 'cb-roast', t('builder_roast'), pro
      ? builderSelect('cb-roast-pro', [1, 2, 3, 4, 5, 6, 7].map(n => `<option value="${n}"${String(d.roast_pro || 2) === String(n) ? ' selected' : ''}>${n}</option>`).join(''))
      : `<div class="builder-roast-options" role="radiogroup" aria-label="${escape(t('builder_roast'))}">${roastOptions}</div>`, 'builder_help_roast')}
    ${pro ? `<div class="builder-pro-grid">
      ${builderField('cb-region', t('builder_region'), builderInput('cb-region', 'text', d.region || '', 'maxlength="120"'), 'builder_help_context')}
      ${builderField('cb-variety', t('builder_variety'), builderInput('cb-variety', 'text', d.variety || '', 'maxlength="120"'), 'builder_help_context')}
      ${builderField('cb-q-grade', t('builder_q_grade'), builderInput('cb-q-grade', 'number', d.q_grade || '', 'min="0" max="100" step="0.1" inputmode="decimal"'), 'builder_help_context')}
      ${builderField('cb-water-ph', t('builder_water_ph'), builderInput('cb-water-ph', 'number', d.water_ph || '', 'min="0" max="14" step="0.1" inputmode="decimal"'), 'builder_help_water_ph')}
      ${builderField('cb-water-tds', t('builder_water_tds'), builderInput('cb-water-tds', 'number', d.water_tds || '', 'min="0" max="1000" step="1" inputmode="numeric"'), 'builder_help_water_tds')}
    </div>` : ''}
  </div><div class="builder-field-group" id="builder-tool-fields">
    ${builderField('cb-device', t('builder_device'), builderSelect('cb-device', deviceGroups, d.device || 'v60'), 'builder_help_device')}
    ${builderField('cb-grinder', t('builder_grinder'), `${builderInput('cb-grinder', 'search', d.grinder || '', 'list="builder-grinders" autocomplete="off"')}<datalist id="builder-grinders">${grinderValues}</datalist>`, 'builder_help_grinder')}
    ${builderField('cb-material', t('builder_material'), builderSelect('cb-material', materialOptions), 'builder_help_material')}
    ${pro ? builderField('cb-filter', t('builder_filter'), builderSelect('cb-filter', filterOptions), 'builder_help_filter') : ''}
    <div id="builder-custom-fields"${(d.device || 'v60') === 'custom_dripper' ? '' : ' hidden'}>
      ${builderField('cb-custom-name', t('builder_custom_name'), builderInput('cb-custom-name', 'text', d.custom_name || '', 'maxlength="120"'), 'builder_help_context')}
      ${builderField('cb-bed-height', t('builder_bed_height'), builderInput('cb-bed-height', 'number', d.bed_height || '', 'min="1" max="100" step="1" inputmode="numeric"'), 'builder_help_bed_height')}
      ${builderField('cb-filter-fit', t('builder_filter_fit'), builderSelect('cb-filter-fit', builderUnknownOption() +
        ['tight', 'good', 'loose'].map(value => `<option value="${value}"${d.filter_fit === value ? ' selected' : ''}>${escape(t(`builder_fit_${value}`))}</option>`).join('')), 'builder_help_filter_fit')}
    </div>
    <div class="builder-pro-grid">
      ${builderField('cb-dose', t('builder_dose'), builderInput('cb-dose', 'number', d.dose || '15', 'min="5" max="40" step="1" inputmode="numeric"'), 'builder_help_dose')}
      ${builderField('cb-water', t('builder_water_amount'), builderInput('cb-water', 'number', d.water || '250', 'min="80" max="600" step="1" inputmode="numeric"'), 'builder_help_water_amount')}
    </div>
  </div>`;
  $('cb-age').addEventListener('change', () => { $('builder-date-field').hidden = $('cb-age').value !== 'date'; });
  $('cb-device').addEventListener('change', () => { $('builder-custom-fields').hidden = $('cb-device').value !== 'custom_dripper'; });
  updateBuilderStep();
}

function updateBuilderStep() {
  const titles = ['builder_step_coffee', 'builder_step_tools', 'builder_step_recipe'];
  $('builder-title').textContent = t(titles[builder.step]);
  $('builder-intro').textContent = t('builder_intro');
  $('builder-mode').textContent = t(builder.mode === 'basic' ? 'builder_mode_pro' : 'builder_mode_basic');
  $('builder-progress-text').textContent = `${t('builder_step', builder.step + 1)} · ${t(titles[builder.step])}`;
  $('builder-progress-fill').style.width = `${(builder.step + 1) * 20}%`;
  $('screen-construct').dataset.step = String(builder.step);
  $('builder-coffee-fields')?.classList.toggle('active', builder.step === 0);
  $('builder-tool-fields')?.classList.toggle('active', builder.step === 1);
  $('builder-result-pane').hidden = builder.step < 2 && !matchMedia('(min-width: 900px)').matches;
  $('builder-next').textContent = t(builder.step === 0 ? 'builder_next' : builder.step === 1 ? 'builder_build' : 'builder_brew');
  $('builder-next').disabled = builder.busy || !builder.options || (builder.step === 2 && builder.variants[builder.selected]?.method !== 'percolation');
  $('builder-rebuild').textContent = t('builder_rebuild');
  $('builder-rebuild').hidden = !builder.variants.length;
  $('builder-cta').dataset.step = String(builder.step);
}

function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function builderParams() {
  captureBuilderDraft();
  const d = builder.draft;
  const params = {device_id: d.device || 'v60', roast_level: builder.mode === 'pro' ? Number(d.roast_pro || 2) : d.roast || 'light',
    dose_g: Number(d.dose || 15), water_g: Number(d.water || 250)};
  for (const [kind, input, key] of [['countries', d.country, 'country'], ['grinders', d.grinder, 'grinder_id']]) {
    if (String(input || '').trim()) {
      const id = builderResolve(kind, input);
      if (!id) throw new Error(t('builder_pick_option'));
      params[key] = id;
    }
  }
  if (d.processing) params.processing = d.processing;
  if (d.age === 'date') {
    if (!d.date) throw new Error(t('builder_roast_date'));
    params.roast_date = d.date;
    params.as_of_date = localToday();
  } else if (d.age) params.roast_age_band = d.age;
  if (d.material) params.material = d.material;
  if (builder.mode === 'pro') {
    if (d.filter) params.filter_id = d.filter;
    for (const [input, output] of [['region', 'region'], ['variety', 'variety']]) {
      if (String(d[input] || '').trim()) params[output] = d[input].trim();
    }
    for (const [input, output] of [['q_grade', 'q_grade'], ['water_ph', 'water_ph'], ['water_tds', 'water_tds_ppm']]) {
      if (String(d[input] || '').trim()) params[output] = Number(d[input]);
    }
  }
  if (params.device_id === 'custom_dripper') {
    if (!d.custom_name?.trim() || !d.bed_height || !d.filter_fit || !d.material) throw new Error(t('builder_required_custom'));
    params.device_name = d.custom_name.trim();
    params.bed_height_mm_at_15g = Number(d.bed_height);
    params.filter_fit = d.filter_fit;
  }
  return params;
}

async function beginBuilder() {
  builder.step = 0;
  show('construct');
  setStatus('builder-status', builder.options ? '' : t('builder_options_loading'));
  if (!builder.options) {
    try {
      builder.options = await api('/api/catalog/options');
      renderBuilderFields();
      if (!builder.variants.length) renderBuilderResult();
      setStatus('builder-status', '');
    } catch (error) { setStatus('builder-status', error.message || t('builder_error'), true); }
  } else updateBuilderStep();
}

async function buildBuilderRecipes() {
  let params;
  try { params = builderParams(); }
  catch (error) { setStatus('builder-status', error.message, true); return; }
  builder.request?.abort();
  const request = builder.request = new AbortController();
  builder.busy = true;
  updateBuilderStep();
  setStatus('builder-status', t('builder_loading'));
  try {
    const data = await post('/api/recipes/build', JSON.stringify({params}), 'application/json', request.signal);
    if (builder.request !== request) return;
    builder.variants = data.variants;
    builder.selected = Math.min(builder.selected, builder.variants.length - 1);
    builder.step = 2;
    setStatus('builder-status', '');
    renderBuilderResult();
    updateBuilderStep();
    $('builder-title').focus({preventScroll: true});
  } catch (error) { if (error.name !== 'AbortError') setStatus('builder-status', error.message || t('builder_error'), true); }
  finally { if (builder.request === request) { builder.busy = false; updateBuilderStep(); } }
}

function builderContext(recipe) {
  const d = builder.draft;
  const chips = [];
  const country = builder.options.countries.find(item => item.id === builderResolve('countries', d.country));
  const processing = builder.options.processing.find(item => item.id === d.processing);
  const device = builder.options.devices.find(item => item.id === recipe.device_id);
  if (country) chips.push(builderOptionName(country));
  if (processing) chips.push(builderOptionName(processing));
  chips.push(recipe.device_id === 'custom_dripper' ? d.custom_name : builderOptionName(device));
  chips.push(t(`builder_${builder.mode === 'pro' ? Number(d.roast_pro || 2) <= 2 ? 'light' : Number(d.roast_pro) <= 5 ? 'medium' : 'dark' : d.roast || 'light'}`));
  return chips.filter(Boolean);
}

function builderFavoriteKey(recipe) {
  return JSON.stringify([recipe.device_id, recipe.id, recipe.dose_g, recipe.water_g,
    recipe.temperature_c, recipe.grind?.target_particle_microns]);
}
function builderFavorites() {
  try {
    const stored = JSON.parse(localStorage.getItem(BUILDER_FAVORITES_KEY) || '[]');
    return Array.isArray(stored) ? stored.filter(value => typeof value === 'string').slice(0, 100) : [];
  } catch (error) { return []; }
}
function toggleBuilderFavorite() {
  const key = builderFavoriteKey(builder.variants[builder.selected]);
  const saved = builderFavorites();
  const next = saved.includes(key) ? saved.filter(value => value !== key) : [key, ...saved].slice(0, 100);
  try { localStorage.setItem(BUILDER_FAVORITES_KEY, JSON.stringify(next)); } catch (error) { /* storage unavailable */ }
  renderBuilderResult();
}

function renderBuilderResult() {
  const recipe = builder.variants[builder.selected];
  if (!recipe) { $('builder-result').innerHTML = `<p class="note">${t('builder_no_recipe')}</p>`; return; }
  const chips = builderContext(recipe);
  const shown = chips.slice(0, 2).map(value => `<span class="builder-chip">${escape(value)}</span>`).join('');
  const rest = chips.length > 2 ? `<details class="builder-more"><summary>${t('builder_more_context', chips.length - 2)}</summary>${chips.slice(2).map(value => `<span class="builder-chip">${escape(value)}</span>`).join('')}</details>` : '';
  const grind = recipe.grind.setting == null ? t('builder_grind_unmapped')
    : `${escape(recipe.grind.setting)} · ${escape(LANG === 'ru' ? recipe.grind.scale_label : recipe.grind.scale_label_en)}`;
  const rows = recipe.steps.map(step => {
    const action = LANG === 'ru' ? step.instruction : STRINGS.en.builder_actions[step.instruction] || step.instruction;
    const why = LANG === 'ru' ? step.why : STRINGS.en.builder_whys[step.why] || step.why;
    return `<tr><td>${clock(step.start_seconds)}</td><td>${step.total_water_g == null ? '—' : grams(step.total_water_g)}</td><td><strong>${escape(action)}</strong><small>${escape(why)}</small></td></tr>`;
  }).join('');
  const reasons = recipe.reasons.map(reason => `<li>${escape(LANG === 'ru' ? reason.text_ru : reason.text_en)}</li>`).join('');
  const favored = builderFavorites().includes(builderFavoriteKey(recipe));
  $('builder-result').innerHTML = `<div class="builder-recipe">
    <p class="builder-origin">${t('builder_calculated')}</p>
    <div class="builder-variant-bar" role="group" aria-label="${t('variant')}">
      <button class="button" type="button" id="builder-prev-variant" aria-label="${t('builder_prev_variant')}"${builder.selected === 0 ? ' disabled' : ''}>←</button>
      <span>${t('builder_variant_position', builder.selected + 1, builder.variants.length)}</span>
      <button class="button" type="button" id="builder-next-variant" aria-label="${t('builder_next_variant')}"${builder.selected === builder.variants.length - 1 ? ' disabled' : ''}>→</button>
    </div>
    <h2 class="title" id="builder-recipe-title">${t(`builder_variant_${recipe.id}`)}</h2>
    <p class="subtitle">${t(`builder_summary_${recipe.id}`)}</p>
    <div class="builder-context">${shown}${rest}</div>
    <p class="note builder-caution">${t('builder_approximate')}</p>
    <div class="builder-tiles">
      <div class="builder-tile"><span>${t('coffee')}</span><strong>${grams(recipe.dose_g)}</strong><div class="builder-quantity"><button type="button" data-adjust="dose_g:-1" aria-label="${t('builder_decrease')} ${t('coffee')}"${recipe.dose_g <= 5 ? ' disabled' : ''}>−</button><button type="button" data-adjust="dose_g:1" aria-label="${t('builder_increase')} ${t('coffee')}"${recipe.dose_g >= 40 ? ' disabled' : ''}>+</button></div></div>
      <div class="builder-tile"><span>${t('water')}</span><strong>${grams(recipe.water_g)}</strong><div class="builder-quantity"><button type="button" data-adjust="water_g:-10" aria-label="${t('builder_decrease')} ${t('water')}"${recipe.water_g <= 80 ? ' disabled' : ''}>−</button><button type="button" data-adjust="water_g:10" aria-label="${t('builder_increase')} ${t('water')}"${recipe.water_g >= 600 ? ' disabled' : ''}>+</button></div></div>
      <div class="builder-tile"><span>${t('temperature')}</span><strong>${celsius(recipe.temperature_c)}</strong></div>
      <div class="builder-tile"><span>${t('ratio')}</span><strong>${escape(num(recipe.ratio))}</strong></div>
      <div class="builder-tile builder-tile-wide"><span>${t('grind')}</span><strong>${grind}</strong><small>${t('builder_grind_nominal')}: ${num(recipe.grind.target_particle_microns)} µm</small></div>
    </div>
    <h3 class="section">${t('builder_process')}</h3>
    ${rows ? `<div class="builder-table-wrap"><table class="builder-table"><thead><tr><th>${t('builder_start_col')}</th><th>${t('builder_scale_col')}</th><th>${t('builder_action_col')}</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<p class="note">${t('builder_automatic')}</p>`}
    <details class="builder-reasons"><summary>${t('builder_reasons')}</summary><ul>${reasons}</ul></details>
    <button type="button" class="button builder-favorite" id="builder-favorite" aria-pressed="${favored}">${t(favored ? 'builder_unfavorite' : 'builder_favorite')}</button>
    ${recipe.method === 'percolation' ? '' : `<p class="note">${t('builder_timer_later')}</p>`}
  </div>`;
  $('builder-prev-variant').addEventListener('click', () => { builder.selected--; renderBuilderResult(); });
  $('builder-next-variant').addEventListener('click', () => { builder.selected++; renderBuilderResult(); });
  $('builder-favorite').addEventListener('click', toggleBuilderFavorite);
  updateBuilderStep();
  document.querySelectorAll('[data-adjust]').forEach(button => button.addEventListener('click', () => adjustBuilderQuantity(button.dataset.adjust)));
}

function brewBuilderRecipe() {
  const recipe = builder.variants[builder.selected];
  if (!recipe || recipe.method !== 'percolation') return;
  currentRecipe = recipe;
  if (brewMode === 'machine') leaveMachineMode();
  resetTimer();
  show('brew');
  toggleTimer();
}

async function adjustBuilderQuantity(spec) {
  if (builder.busy) return;
  const [field, deltaText] = spec.split(':');
  const delta = Number(deltaText);
  const selected = builder.variants[builder.selected];
  const target = selected[field] + delta;
  builder.busy = true;
  document.querySelectorAll('[data-adjust]').forEach(button => { button.disabled = true; });
  try {
    const replies = await Promise.all(builder.variants.map(recipe => {
      const dose_g = field === 'dose_g' ? target : null;
      const water_g = field === 'water_g' ? Math.round(recipe.water_g * target / selected.water_g) : null;
      return post('/api/recipes/rescale', JSON.stringify({recipe, dose_g, water_g}), 'application/json');
    }));
    builder.variants = replies.map(reply => reply.recipe);
    setStatus('builder-status', '');
    renderBuilderResult();
  } catch (error) {
    setStatus('builder-status', error.message || t('builder_error'), true);
    renderBuilderResult();
  } finally { builder.busy = false; }
}

function wireBuilder() {
  $('open-builder').addEventListener('click', beginBuilder);
  $('builder-back').addEventListener('click', () => {
    if (builder.step > 0) { captureBuilderDraft(); builder.step--; updateBuilderStep(); $('builder-title').focus({preventScroll: true}); }
    else back('find');
  });
  $('builder-mode').addEventListener('click', () => {
    captureBuilderDraft();
    builder.mode = builder.mode === 'basic' ? 'pro' : 'basic';
    if (builder.step === 2 && !matchMedia('(min-width: 900px)').matches) builder.step = 0;
    renderBuilderFields();
    scheduleBuilderUpdate();
  });
  $('builder-form').addEventListener('change', scheduleBuilderUpdate);
  $('builder-next').addEventListener('click', () => {
    if (builder.step === 0) { captureBuilderDraft(); builder.step = 1; updateBuilderStep(); $('builder-title').focus({preventScroll: true}); }
    else if (builder.step === 1) buildBuilderRecipes();
    else brewBuilderRecipe();
  });
  $('builder-rebuild').addEventListener('click', buildBuilderRecipes);
}

function scheduleBuilderUpdate() {
  clearTimeout(builder.updateTimer);
  if (!builder.variants.length || !matchMedia('(min-width: 900px)').matches) return;
  builder.updateTimer = setTimeout(buildBuilderRecipes, 500);
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
  $('language-label').textContent = t('language');
  $('language').value = LANG;
  $('survey-eyebrow').textContent = t('survey_eyebrow');
  $('survey-title').textContent = t('survey_title');
  $('survey-text').textContent = t('survey_text');
  $('survey-link').textContent = `${t('survey_button')} ↗`;
  $('open-builder').textContent = t('builder_open');
  $('builder-back').textContent = t('back');
  $('builder-language-label').textContent = t('language');
  $('builder-language').value = LANG;
  if (builder.options) {
    renderBuilderFields();
    if (builder.variants.length) renderBuilderResult();
  } else updateBuilderStep();
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

  const changeLanguage = event => {
    captureBuilderDraft();
    LANG = event.target.value;
    savePrefs(); localize();
    if (!photoRequest) setStatus('status', t('status_ready', modelOptions?.coffees || 0));
    if (currentData && currentRecipe?.origin !== 'calculated' && !running && brewMode === 'local') renderRecipe(0, currentRecipe);
  };
  $('language').addEventListener('change', changeLanguage);
  $('builder-language').addEventListener('change', changeLanguage);
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
  wireBuilder();

  $('recipe-back').addEventListener('click', () => back('find'));
  $('brew-start').addEventListener('click', () => {
    if (!currentRecipe?.duration_seconds) return;
    if (brewMode === 'machine') leaveMachineMode();
    show('brew');
    if (!running && elapsed === 0) { saveRecent(); toggleTimer(); }
  });
  $('machine-start').addEventListener('click', startMachineBrew);
  $('brew-back').addEventListener('click', () => back(currentRecipe?.origin === 'calculated' ? 'construct' : 'recipe'));
  $('brew-toggle').addEventListener('click', () => brewMode === 'machine' ? machineToggle() : toggleTimer());
  $('brew-reset').addEventListener('click', () => {
    if (brewMode === 'machine') { machineStop(); return; }
    resetTimer();
    $('brew-toggle').focus({preventScroll: true});
  });
  $('brew-again').addEventListener('click', () => {
    if (brewMode === 'machine') { back('recipe'); startMachineBrew(); return; }
    resetTimer();
    back(currentRecipe?.origin === 'calculated' ? 'construct' : 'recipe');
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
