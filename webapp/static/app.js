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
    builder_favorite: 'Save to my recipes',
    builder_unfavorite: 'Remove from my recipes',
    builder_brew: 'Brew this recipe',
    builder_machine: 'Send to First Brew machine',
    builder_machine_error: 'Could not send the recipe to the machine.',
    builder_total_time: 'Total time',
    builder_start_timer: 'Start timer',
    builder_step_count: (n, total) => `Step ${n} / ${total}`,
    builder_pour_now: 'Pour now',
    builder_on_scale: 'On scale',
    builder_pour_rate: 'Pour rate',
    builder_rate_value: (value) => `${value} g/s`,
    builder_not_applicable: '—',
    builder_wait: 'Wait',
    builder_pour_phase: 'Pouring',
    builder_wait_phase: 'Waiting',
    builder_drawdown: 'Let the coffee drain',
    builder_automatic_wait: 'Brewer running',
    builder_next_action: (action) => `Next: ${action}`,
    builder_prev_step: 'Previous step',
    builder_next_step: 'Next step',
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
      'Шаг из рецепта обжарщика.': 'Step from the roaster recipe.',
    },
    builder_close: 'Close the recipe builder',
    builder_step_result: 'Result',
    builder_step_correction: 'Correction',
    builder_rate: 'Rate the cup',
    builder_get_correction: 'Get a correction',
    builder_brew_corrected: 'Brew corrected',
    builder_save_own: 'Save as mine',
    builder_saved_own: 'Saved',
    builder_saved_status: 'Recipe saved on this device.',
    builder_save_error: 'Could not save on this device.',
    builder_done_text: 'Let it drain, taste the cup and rate it to get a correction.',
    builder_machine_done_text: 'The machine has finished. Let it drain, taste the cup and rate it to get a correction.',
    feedback_intro: 'Mark 1–3 impressions of the cup, or enter refractometer readings.',
    feedback_rating: 'Rating',
    feedback_mode: 'How to rate the cup',
    feedback_by_taste: 'By taste',
    feedback_by_meter: 'Refractometer',
    feedback_count: (n, max) => `Selected ${n} of ${max}`,
    feedback_conflicts_hint: 'Impressions that contradict your choice switch off.',
    taste_help_label: (name) => `What “${name}” means`,
    taste_columns: {acidity_sweetness: 'Acidity and sweetness', body_strength: 'Body and strength', finish_clarity: 'Finish and clarity'},
    taste_names: {sour: 'Sour', sharp: 'Sharp', flat: 'Flat', sweet: 'Sweet', balanced: 'Balanced',
      watery: 'Watery', hollow: 'Hollow', syrupy: 'Syrupy', heavy: 'Heavy', bitter: 'Bitter', dry: 'Dry',
      astringent: 'Astringent', muddy: 'Muddy', rough: 'Rough'},
    taste_help: {
      sour: 'Tart, unripe-fruit acidity with little sweetness behind it.',
      sharp: 'Acidity that stings the tongue and fades quickly, without roundness.',
      flat: 'Flavor is there but dull: nothing stands out.',
      sweet: 'Natural sweetness comes through: ripe fruit, caramel, honey.',
      balanced: 'Acidity, sweetness and bitterness sit together; nothing sticks out.',
      watery: 'Thin, as if extra water were added; flavor fades quickly.',
      hollow: 'There is a start and an aftertaste, but the middle is empty.',
      syrupy: 'Dense, coating body: the cup feels thick in the mouth.',
      heavy: 'Thick and muted: the weight covers the aroma.',
      bitter: 'Bitterness lingers and covers the rest of the cup.',
      dry: 'The mouth feels dry after a sip, like after strong tea.',
      astringent: 'Puckers the tongue and gums, like an unripe persimmon.',
      muddy: 'Flavors blur together; it is hard to tell anything apart.',
      rough: 'A scratchy, coarse aftertaste.',
    },
    measure_tds: 'Beverage TDS (%)',
    measure_yield: 'Beverage weight (g)',
    measure_dose: 'Coffee dose (g)',
    measure_drawdown: 'Drawdown time (s)',
    measure_help_tds: 'The refractometer reading of the brewed coffee, not of your water.',
    measure_help_yield: 'Weigh the finished coffee. It is lighter than the water poured: the grounds keep some.',
    measure_help_dose: 'The coffee you actually brewed. It must match the recipe.',
    measure_help_drawdown: 'From the first pour until the water has drained. Kept with the result; it does not change the calculation.',
    measure_extraction: (value) => `Extraction ≈ ${value} %`,
    measure_formula: 'Extraction = beverage weight × TDS ÷ dose.',
    measure_invalid_tds: 'Enter TDS from 0.1 to 5 %.',
    measure_invalid_yield: (max) => `Beverage weight is 1 g to ${max}: not more than the water poured.`,
    measure_dose_mismatch: (dose) => `The dose must match the recipe (${dose}). If you brewed another dose, change it on the recipe first.`,
    measure_invalid_drawdown: 'Enter a drawdown time from 1 to 1200 s.',
    correction_loading: 'Working out the correction…',
    correction_by_taste: 'Correction from taste',
    correction_by_meter: 'Correction from measurement',
    correction_changes: 'What changes',
    correction_no_changes: 'Parameters stay the same.',
    correction_at_limit: 'Parameters are already at the edge of the starting range. Change them by hand if needed.',
    correction_recipe: 'Corrected recipe',
    correction_same_recipe: 'Recipe unchanged',
    correction_placeholder: 'Mark the taste or enter measurements: the diagnosis, chart and corrected recipe appear here.',
    correction_revision: (n) => `correction ${n}`,
    correction_edited: 'Changed by hand after the correction.',
    change_finer: 'finer',
    change_coarser: 'coarser',
    change_target: (before, after) => `nominal target ${before} → ${after} µm`,
    chart_title: 'Extraction and strength',
    chart_x: 'Extraction, %',
    chart_y: 'Strength (TDS), %',
    chart_under: '← Under-extracted',
    chart_over: 'Over-extracted →',
    chart_weak: 'Weak',
    chart_strong: 'Strong',
    chart_zone: 'Balance reference',
    chart_cup: (ey, tds) => `Your cup: ${ey} % · ${tds} %`,
    chart_estimate: 'Taste estimate',
    chart_recipe: (ratio) => `Recipe line ${ratio}`,
    chart_note_measured: 'The point comes from your measurement. The zone is the SCA reference (18–22 %, 1.15–1.45 %), not a rule for your taste.',
    chart_note_estimate: 'Without a refractometer the position is only an estimate: the band sits on your recipe’s ratio line and shows the likely extraction range. Diagonals assume the grounds keep about 2 g of water per gram of coffee.',
    chart_note_outside: 'The measurement is outside the chart, so the point sits on its edge.',
    chart_desc_measured: (ey, tds) => `Your cup: extraction ${ey} %, strength ${tds} %.`,
    chart_desc_estimate: (low, high) => `Estimated from taste: extraction about ${low}–${high} %.`,
    builder_photo: 'Fill in from a photo of the bag',
    builder_photo_unreadable: 'Could not read the label. Fill in the fields by hand or try another photo.',
    builder_catalog_found: (name) => `“${name}” is in the roaster catalog: try the roaster recipe first.`,
    builder_catalog_open: 'Open the roaster recipe',
    combo_show: 'Show the list',
    combo_empty: 'Nothing found',
    rate_incomplete: 'The roaster recipe is missing pour times or amounts, so it cannot be rated and corrected. Build a recipe from parameters instead.',
    recipe_builder_title: 'Want a recipe for your own brewer and grinder?',
    recipe_builder_text: 'Build one from parameters: what we know about this coffee is already filled in.',
    recipe_builder: 'Build from parameters',
    confirm_builder: 'Build a recipe for this coffee',
    confirm_reference: 'Show a similar roaster recipe',
    builder_manual: 'Enter the details by hand',
    prefill_photo: 'Recognized from the photo',
    prefill_catalog: 'From the roaster catalog',
    prefill_note: 'We filled in what we know about this coffee. Check it and add the rest: roast date, roast level and your equipment.',
    origin_roaster: 'Roaster recipe, unchanged',
    origin_roaster_corrected: 'Corrected from your rating · based on the roaster recipe, no longer the roaster’s',
    builder_summary_roaster: 'Based on the roaster recipe.',
    grind_roaster_source: 'The roaster’s setting for their grinder. On yours, adjust by taste.',
    grind_roaster_moved: (n, finer) => `${n} step${n === 1 ? '' : 's'} ${finer ? 'finer' : 'coarser'} than the roaster setting`,
    change_roaster_own: 'on your grinder, move one step the same way',
    own_text_origin_roaster: (name) => `Corrected in First Brew from the roaster recipe “${name}”. It is no longer the roaster’s recipe.`,
    mine_open: (n) => `My recipes · ${n}`,
    mine_title: 'My recipes',
    mine_intro: 'Stored only on this device. No account needed.',
    mine_empty: 'Nothing here yet. Build a recipe, then save it or its corrected version.',
    mine_deleted: 'Recipe deleted.',
    own_source_built: 'Starting recipe',
    own_source_shared: 'Opened from a link',
    own_saved_on: (date) => `Saved ${date}`,
    own_brewed: (n) => `Brewed: ${n}`,
    own_unsaved: 'This recipe came from a link and is not saved on this device yet.',
    own_feedback_taste: (list) => `Corrected from taste: ${list}.`,
    own_feedback_meter: (value) => `Corrected from a measurement: extraction ${value} %.`,
    own_name: 'Name',
    own_name_help: 'Your own name to tell recipes apart. Leave it empty to use the default.',
    own_name_saved: 'Name saved.',
    own_share_title: 'Share',
    own_share: 'Share…',
    own_copy_text: 'Copy text',
    own_copy_link: 'Copy link',
    own_show_text: 'Show recipe text',
    own_text_label: 'Recipe text',
    own_copied_text: 'Text copied.',
    own_copied_link: 'Link copied. The recipe travels inside the link; the server does not store it.',
    own_copy_failed: 'Could not copy. Select the text below by hand.',
    own_text_origin: 'Calculated from parameters in First Brew. Not a roaster recipe.',
    own_text_target: (n) => `nominal target ${n} µm`,
    own_text_link: (url) => `Open in First Brew: ${url}`,
    own_delete: 'Delete recipe',
    own_delete_question: (name) => `Delete “${name}” from this device? This cannot be undone.`,
    own_delete_confirm: 'Delete',
    own_save: 'Save to my recipes',
    own_link_loading: 'Opening the shared recipe…',
    own_link_broken: 'The recipe link is damaged or out of date.',
    own_link_unsupported: 'This browser cannot open a compressed link. Update it or open the link in another browser.',
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
    lock_eyebrow: 'In the membership',
    lock_view: 'See the membership',
    lock_later: 'Not now',
    lock_inline: (benefit) => `🔒 ${benefit} It comes with the membership.`,
    demo_notice: 'Demo: payment is not connected',
    plans_title: 'One membership. Three ways in.',
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
    builder_favorite: 'Сохранить в мои рецепты',
    builder_unfavorite: 'Убрать из моих рецептов',
    builder_brew: 'Заварить',
    builder_machine: 'Отправить на машину First Brew',
    builder_machine_error: 'Не удалось передать рецепт на машину.',
    builder_total_time: 'Общее время',
    builder_start_timer: 'Запустить таймер',
    builder_step_count: (n, total) => `Шаг ${n} / ${total}`,
    builder_pour_now: 'Влить сейчас',
    builder_on_scale: 'На весах',
    builder_pour_rate: 'Скорость струи',
    builder_rate_value: (value) => `${value} г/с`,
    builder_not_applicable: '—',
    builder_wait: 'Ждём',
    builder_pour_phase: 'Вливание',
    builder_wait_phase: 'Ожидание',
    builder_drawdown: 'Дождитесь слива',
    builder_automatic_wait: 'Кофеварка работает',
    builder_next_action: (action) => `Далее: ${action}`,
    builder_prev_step: 'Предыдущий шаг',
    builder_next_step: 'Следующий шаг',
    builder_no_recipe: 'Заполните шаги о кофе и оборудовании, чтобы получить рецепт.',
    builder_actions: {},
    builder_whys: {},
    builder_close: 'Закрыть конструктор',
    builder_step_result: 'Результат',
    builder_step_correction: 'Правка',
    builder_rate: 'Оценить вкус',
    builder_get_correction: 'Получить правку',
    builder_brew_corrected: 'Заварить исправленный',
    builder_save_own: 'Сохранить как свой',
    builder_saved_own: 'Сохранено',
    builder_saved_status: 'Рецепт сохранён на этом устройстве.',
    builder_save_error: 'Не удалось сохранить на этом устройстве.',
    builder_done_text: 'Дайте воде стечь, попробуйте чашку и оцените вкус — получите правку.',
    builder_machine_done_text: 'Машина закончила. Дайте воде стечь, попробуйте чашку и оцените вкус — получите правку.',
    feedback_intro: 'Отметьте 1–3 ощущения от чашки или введите данные рефрактометра.',
    feedback_rating: 'Оцениваем',
    feedback_mode: 'Способ оценки чашки',
    feedback_by_taste: 'По вкусу',
    feedback_by_meter: 'Рефрактометр',
    feedback_count: (n, max) => `Выбрано ${n} из ${max}`,
    feedback_conflicts_hint: 'Ощущения, которые противоречат выбранным, отключаются.',
    taste_help_label: (name) => `Что значит «${name}»`,
    taste_columns: {acidity_sweetness: 'Кислотность и сладость', body_strength: 'Тело и крепость', finish_clarity: 'Финиш и чистота'},
    taste_names: {sour: 'Кисло', sharp: 'Резко', flat: 'Плоско', sweet: 'Сладко', balanced: 'Сбалансированно',
      watery: 'Водянисто', hollow: 'Пусто', syrupy: 'Сиропно', heavy: 'Тяжело', bitter: 'Горько', dry: 'Сухо',
      astringent: 'Терпко', muddy: 'Неясно', rough: 'Грубо'},
    taste_help: {
      sour: 'Острая кислинка, как у недозрелого фрукта; сладости за ней почти нет.',
      sharp: 'Кислотность колет язык и быстро уходит, без мягкости.',
      flat: 'Вкус есть, но тусклый: ничего не выделяется.',
      sweet: 'Чувствуется естественная сладость: спелый фрукт, карамель, мёд.',
      balanced: 'Кислотность, сладость и горчинка в согласии; ничего не выпирает.',
      watery: 'Жидко, будто добавили воды; вкус быстро пропадает.',
      hollow: 'Начало и послевкусие есть, а середина вкуса пустая.',
      syrupy: 'Плотное, обволакивающее тело: чашка ощущается густой.',
      heavy: 'Густо и глухо: тяжесть заглушает аромат.',
      bitter: 'Горечь задерживается на языке и перебивает остальное.',
      dry: 'После глотка во рту сухо, как после крепкого чая.',
      astringent: 'Вяжет язык и дёсны, как незрелая хурма.',
      muddy: 'Вкусы смазаны: трудно что-то различить.',
      rough: 'Шершавое, царапающее послевкусие.',
    },
    measure_tds: 'TDS напитка (%)',
    measure_yield: 'Выход напитка (г)',
    measure_dose: 'Доза кофе (г)',
    measure_drawdown: 'Время слива (с)',
    measure_help_tds: 'Показание рефрактометра для готового кофе, а не для воды.',
    measure_help_yield: 'Взвесьте готовый напиток. Он легче влитой воды: часть остаётся в кофе.',
    measure_help_dose: 'Сколько кофе вы заварили. Должно совпадать с рецептом.',
    measure_help_drawdown: 'От первого вливания до конца слива. Сохраняется с результатом, в расчёт не входит.',
    measure_extraction: (value) => `Экстракция ≈ ${value} %`,
    measure_formula: 'Экстракция = выход × TDS ÷ доза.',
    measure_invalid_tds: 'Введите TDS от 0,1 до 5 %.',
    measure_invalid_yield: (max) => `Выход — от 1 г до ${max}: не больше влитой воды.`,
    measure_dose_mismatch: (dose) => `Доза должна совпадать с рецептом (${dose}). Если заваривали другую дозу, сначала измените её в рецепте.`,
    measure_invalid_drawdown: 'Введите время слива от 1 до 1200 с.',
    correction_loading: 'Считаем правку…',
    correction_by_taste: 'Правка по вкусу',
    correction_by_meter: 'Правка по измерению',
    correction_changes: 'Что меняем',
    correction_no_changes: 'Параметры не меняем.',
    correction_at_limit: 'Параметры уже на границе стартового диапазона. При необходимости меняйте их вручную.',
    correction_recipe: 'Исправленный рецепт',
    correction_same_recipe: 'Рецепт без изменений',
    correction_placeholder: 'Отметьте вкус или введите измерения — здесь появятся диагноз, диаграмма и исправленный рецепт.',
    correction_revision: (n) => `правка ${n}`,
    correction_edited: 'Изменено вручную после правки.',
    change_finer: 'мельче',
    change_coarser: 'грубее',
    change_target: (before, after) => `условная цель ${before} → ${after} мкм`,
    chart_title: 'Экстракция и крепость',
    chart_x: 'Экстракция, %',
    chart_y: 'Крепость (TDS), %',
    chart_under: '← Недоэкстракция',
    chart_over: 'Переэкстракция →',
    chart_weak: 'Слабо',
    chart_strong: 'Крепко',
    chart_zone: 'Зона баланса',
    chart_cup: (ey, tds) => `Ваша чашка: ${ey} % · ${tds} %`,
    chart_estimate: 'Оценка по вкусу',
    chart_recipe: (ratio) => `Линия рецепта ${ratio}`,
    chart_note_measured: 'Точка рассчитана по вашему измерению. Зона — ориентир SCA (18–22 %, 1,15–1,45 %), а не правило для вашего вкуса.',
    chart_note_estimate: 'Без рефрактометра положение только оценочное: полоса лежит на линии соотношения вашего рецепта и показывает вероятный диапазон экстракции. Диагонали считают, что в гуще остаётся около 2 г воды на грамм кофе.',
    chart_note_outside: 'Измерение за пределами диаграммы, поэтому точка стоит на её краю.',
    chart_desc_measured: (ey, tds) => `Ваша чашка: экстракция ${ey} %, крепость ${tds} %.`,
    chart_desc_estimate: (low, high) => `Оценка по вкусу: экстракция примерно ${low}–${high} %.`,
    builder_photo: 'Заполнить по фото пачки',
    builder_photo_unreadable: 'Не удалось прочитать этикетку. Заполните поля вручную или попробуйте другое фото.',
    builder_catalog_found: (name) => `«${name}» есть в каталоге обжарщика — сначала стоит попробовать его рецепт.`,
    builder_catalog_open: 'Открыть рецепт обжарщика',
    combo_show: 'Показать список',
    combo_empty: 'Ничего не найдено',
    rate_incomplete: 'В рецепте обжарщика не хватает времени или объёма вливаний, поэтому его нельзя оценить и исправить. Соберите рецепт по параметрам.',
    recipe_builder_title: 'Нужен рецепт под вашу воронку и кофемолку?',
    recipe_builder_text: 'Соберите по параметрам — то, что известно об этом кофе, уже заполнено.',
    recipe_builder: 'Собрать по параметрам',
    confirm_builder: 'Собрать рецепт для этого кофе',
    confirm_reference: 'Показать похожий рецепт обжарщика',
    builder_manual: 'Заполнить параметры вручную',
    prefill_photo: 'Распознано по фото',
    prefill_catalog: 'Из каталога обжарщика',
    prefill_note: 'Мы заполнили то, что известно об этом кофе. Проверьте и добавьте остальное: дату и степень обжарки, своё оборудование.',
    origin_roaster: 'Рецепт обжарщика без изменений',
    origin_roaster_corrected: 'Исправлено по вашей оценке · на основе рецепта обжарщика, уже не его рецепт',
    builder_summary_roaster: 'На основе рецепта обжарщика.',
    grind_roaster_source: 'Настройка обжарщика для его кофемолки. На своей подстройте по вкусу.',
    grind_roaster_moved: (n, finer) => `${finer ? 'Мельче' : 'Грубее'} настройки обжарщика на ${n} ${n === 1 ? 'шаг' : n < 5 ? 'шага' : 'шагов'}`,
    change_roaster_own: 'на своей кофемолке — на шаг в ту же сторону',
    own_text_origin_roaster: (name) => `Исправлено в First Brew на основе рецепта обжарщика «${name}» — это уже не рецепт обжарщика.`,
    mine_open: (n) => `Мои рецепты · ${n}`,
    mine_title: 'Мои рецепты',
    mine_intro: 'Хранятся только на этом устройстве, без регистрации.',
    mine_empty: 'Пока пусто. Соберите рецепт в конструкторе и сохраните его или исправленную версию.',
    mine_deleted: 'Рецепт удалён.',
    own_source_built: 'Стартовый вариант',
    own_source_shared: 'Получено по ссылке',
    own_saved_on: (date) => `Сохранён ${date}`,
    own_brewed: (n) => `Заварено: ${n}`,
    own_unsaved: 'Рецепт открыт по ссылке и пока не сохранён на этом устройстве.',
    own_feedback_taste: (list) => `Исправлен по вкусу: ${list}.`,
    own_feedback_meter: (value) => `Исправлен по измерению: экстракция ${value} %.`,
    own_name: 'Название',
    own_name_help: 'Своё название, чтобы отличать рецепты. Пустое поле — название по умолчанию.',
    own_name_saved: 'Название сохранено.',
    own_share_title: 'Поделиться',
    own_share: 'Поделиться…',
    own_copy_text: 'Скопировать текст',
    own_copy_link: 'Скопировать ссылку',
    own_show_text: 'Показать текст рецепта',
    own_text_label: 'Текст рецепта',
    own_copied_text: 'Текст скопирован.',
    own_copied_link: 'Ссылка скопирована. Рецепт передаётся в самой ссылке, сервер его не хранит.',
    own_copy_failed: 'Не удалось скопировать. Выделите текст ниже вручную.',
    own_text_origin: 'Собрано по параметрам в First Brew — не рецепт обжарщика.',
    own_text_target: (n) => `условная цель ${n} мкм`,
    own_text_link: (url) => `Открыть в First Brew: ${url}`,
    own_delete: 'Удалить рецепт',
    own_delete_question: (name) => `Удалить «${name}» с этого устройства? Отменить это нельзя.`,
    own_delete_confirm: 'Удалить',
    own_save: 'Сохранить себе',
    own_link_loading: 'Открываем рецепт по ссылке…',
    own_link_broken: 'Ссылка на рецепт повреждена или устарела.',
    own_link_unsupported: 'Этот браузер не может открыть сжатую ссылку. Обновите его или откройте ссылку в другом браузере.',
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
    lock_eyebrow: 'В подписке',
    lock_view: 'Посмотреть подписку',
    lock_later: 'Не сейчас',
    lock_inline: (benefit) => `🔒 ${benefit} Это входит в подписку.`,
    demo_notice: 'Демо: оплата не подключена',
    plans_title: 'Одна подписка. Три способа начать.',
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
let timerStarted = false;
let wakeLock = null, audio = null;
// Machine mode: the brew screen mirrors telemetry from the machine instead of the local timer.
let brewOrigin = 'recipe';  // screen the timer returns to: recipe, construct or own
let brewName = null;  // a saved recipe's own name on the timer
let brewMode = 'local', machineInfo = null, machineState = null, machineOnline = false, machineEvents = null;
let machineHeatStart = null, machineLastStep = -1, machineStopped = false;
const builder = {options: null, step: 0, mode: 'basic', draft: {}, variants: [], selected: 0,
  request: null, busy: false, updateTimer: null,
  // Result and correction (steps 4–5): the brewed recipe, the feedback and the engine's reply.
  rated: null, feedbackMode: 'taste', tastes: [], tasteHelp: null,
  measure: {tds: '', yield: '', dose: '', drawdown: ''},
  correction: null, correctionRequest: null, correctionTimer: null,
  ratingOrigin: 'builder', ratedChips: null, ratedName: null,
  adjustCounted: null};  // the rated recipe whose free correction is already used
const MACHINE_ACTIVE = ['PREHEAT', 'READY', 'BREWING', 'PAUSED'];
const prefs = {vibrate: true, sound: true};

// ---------------------------------------------------------------------------
// Membership: plans and rights come from /api/plans (data/plans.json). There are no
// payments: the plan is a demo state on this device. Every access check goes
// through can(); the machine is the owner's right and never needs a paid plan.
// ---------------------------------------------------------------------------
const MEMBERSHIP_KEY = 'firstbrew.membership.v1';
const LOCK = '🔒';
let PLANS = null;
const membership = loadMembership();
function loadMembership() {
  const state = {plan: 'free', machineOwner: false, demo: true, includedUntil: null,
    used: {builder: 0, adjust: 0}, upgradeShownAt: 0};
  try {
    const saved = JSON.parse(localStorage.getItem(MEMBERSHIP_KEY) || '{}');
    if (['free', 'member'].includes(saved.plan)) state.plan = saved.plan;
    if (typeof saved.machineOwner === 'boolean') state.machineOwner = saved.machineOwner;
    if (typeof saved.includedUntil === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(saved.includedUntil)) state.includedUntil = saved.includedUntil;
    for (const key of ['builder', 'adjust']) {
      if (Number.isInteger(saved.used?.[key]) && saved.used[key] >= 0) state.used[key] = saved.used[key];
    }
    if (Number.isFinite(saved.upgradeShownAt)) state.upgradeShownAt = saved.upgradeShownAt;
  } catch (error) { /* private mode: the demo state lives in memory for this visit */ }
  return state;
}
function saveMembership() {
  try { localStorage.setItem(MEMBERSHIP_KEY, JSON.stringify(membership)); } catch (error) { /* in memory only */ }
}
// Included months of a machine bundle end on their date; the machine stays the owner's.
function entitlement() {
  const expired = membership.plan === 'member' && membership.includedUntil && localToday() > membership.includedUntil;
  return {plan: expired ? 'free' : membership.plan, machineOwner: membership.machineOwner, demo: true,
    includedUntil: membership.includedUntil};
}
function limit(name) { return PLANS?.limits?.[name] ?? 0; }
// What a free limit has already used on this device.
function used(name) {
  if (name === 'own_recipes_free') return ownEntries().length;
  if (name === 'free_builder_tries') return membership.used.builder;
  if (name === 'free_adjustments') return membership.used.adjust;
  return 0;
}
function can(feature) {
  const rule = PLANS?.entitlements?.[feature];
  if (!rule) return true;  // the plans have not loaded: nothing is locked by accident
  if (rule.access === 'free') return true;
  const state = entitlement();
  if (rule.access === 'machine_owner') return state.machineOwner === true;
  if (state.plan === 'member') return true;
  return Boolean(rule.free_limit) && used(rule.free_limit) < limit(rule.free_limit);
}
function countUse(name) {
  membership.used[name] = (membership.used[name] || 0) + 1;
  saveMembership();
}
function benefit(feature) {
  return PLANS?.entitlements?.[feature]?.benefit?.[LANG] || '';
}
const locked = (feature, text) => can(feature) ? text : `${LOCK} ${text}`;

// One sheet for every closed feature: one phrase of benefit, closed with one tap.
// Never during a brew, and once per screen per visit; after that a quiet line instead.
const lockSheet = {shownOn: new Set(), returnFocus: null};
function requireFeature(feature, statusId) {
  if (can(feature)) return true;
  const screen = currentScreen();
  if (screen === 'brew' || lockSheet.shownOn.has(screen)) {
    if (statusId && $(statusId)) setStatus(statusId, t('lock_inline', benefit(feature)));
    return false;
  }
  lockSheet.shownOn.add(screen);
  lockSheet.returnFocus = document.activeElement;
  setText('lock-title', benefit(feature));
  $('lock-sheet').hidden = false;
  $('lock-plans').focus({preventScroll: true});
  return false;
}
function closeLockSheet() {
  if ($('lock-sheet').hidden) return;
  $('lock-sheet').hidden = true;
  lockSheet.returnFocus?.focus?.({preventScroll: true});
}
function wireLockSheet() {
  $('lock-later').addEventListener('click', closeLockSheet);
  $('lock-sheet').addEventListener('click', event => { if (event.target === $('lock-sheet')) closeLockSheet(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeLockSheet(); });
  $('lock-plans').addEventListener('click', () => { closeLockSheet(); openPlans(); });
}
async function loadPlans() {
  try {
    PLANS = await api('/api/plans');
    entitlementChanged();
  } catch (error) { PLANS = null; }
}
// Redraw everything that shows a lock or a plan.
function entitlementChanged() {
  updateCtaBar();
  if (builder.options) { updateBuilderStep(); renderBuilderResult(); }
  if (currentScreen() === 'plans') renderPlans();
}

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
const SCREENS = ['find', 'confirm', 'recipe', 'construct', 'brew', 'mine', 'own', 'plans'];
function currentScreen() { return document.body.dataset.screen; }

function show(screen, {push = true} = {}) {
  if (!SCREENS.includes(screen)) screen = 'find';
  if (screen === 'confirm' && !recognition) screen = 'find';
  if (screen === 'recipe' && !currentData && !recipeLoading) screen = 'find';
  if (screen === 'brew' && !currentRecipe) screen = currentData ? 'recipe' : 'find';
  if (screen === 'own' && !own.entry) screen = 'mine';
  if (currentScreen() === 'confirm' && screen !== 'confirm') cancelConfirmation();
  document.body.dataset.screen = screen;
  if (screen === 'confirm') renderConfirmation();
  if (screen === 'mine') renderMine();
  if (screen === 'own') renderOwn();
  if (screen === 'plans') renderPlans();
  if (screen === 'recipe' && machineInfo?.enabled) refreshMachine();
  if (screen === 'brew' && brewMode === 'machine') renderMachine();
  if (push && history.state?.screen !== screen) {
    history.pushState({screen}, '', screen === 'find' ? location.pathname : `#${screen}`);
  }
  window.scrollTo(0, 0);
  const focusTarget = screen === 'find' ? null : screen === 'recipe' ? $('recipe-title')
    : screen === 'confirm' ? $('confirm-title') : screen === 'construct' ? builderFocusTarget()
    : screen === 'mine' ? $('mine-title') : screen === 'own' ? $('own-title')
    : screen === 'plans' ? $('plans-title') : $('brew-toggle');
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
    <div class="recipe-alt"><p><strong>${t('recipe_builder_title')}</strong> ${t('recipe_builder_text')}</p>
      <button type="button" class="button" id="recipe-builder">${t('recipe_builder')}</button></div>
    <p class="source"><a href="${escape(currentData.product.url)}" target="_blank" rel="noopener noreferrer">${suggested ? t('reference_page') : t('coffee_page')} ↗</a></p></div>`;
  document.querySelectorAll('[data-variant]').forEach(button => button.addEventListener('click', () => {
    renderRecipe(Number(button.dataset.variant));
    $('recipe-title').focus({preventScroll: true});
  }));
  $('edit-recipe').addEventListener('click', () => openRecipeEditor(index));
  $('recipe-builder').addEventListener('click', () => {
    // A reference recipe belongs to another coffee: only the confirmed label describes this one.
    const sameCoffee = ['catalog_match', undefined, null].includes(currentData.recommendation_kind);
    openPrefilledBuilder({label: currentData.confirmed_label || null, url: sameCoffee ? currentData.product?.url : null,
      name: sameCoffee ? currentData.product?.name || '' : ''});
  });
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

// The machine button needs a connected machine and its owner; a plan never matters.
function machineConnected() {
  return Boolean(machineInfo?.enabled && machineOnline) && can('machine_brew');
}

function updateCtaBar() {
  const available = machineConnected() && Boolean(currentRecipe?.duration_seconds);
  $('machine-start').hidden = !available;
  $('machine-start').textContent = t('machine_button');
  $('recipe-cta').dataset.machine = String(available);
  if ($('builder-machine')) $('builder-machine').hidden = !machineConnected();
  if ($('correction-machine')) $('correction-machine').hidden = !machineConnected();
  if ($('own-machine')) $('own-machine').hidden = !machineConnected();
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
  updateConfirmActions();
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
    updateConfirmActions();
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
// Found in the catalog: the roaster recipe comes first. Otherwise: build from what was read.
function updateConfirmActions() {
  const unreadable = isUnreadable();
  const found = !unreadable && recognition?.recommendation.kind === 'catalog_match' && !draftChanged;
  $('confirm-builder').textContent = t(unreadable ? 'builder_manual' : found ? 'recipe_builder' : 'confirm_builder');
  $('confirm-recipe').textContent = t(found ? 'confirm_recipe' : 'confirm_reference');
  $('confirm-builder').classList.toggle('primary', !found && !unreadable);
  $('confirm-recipe').classList.toggle('primary', found);
  $('confirm-builder').disabled = false;
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
  $('confirm-builder').addEventListener('click', () => {
    const unreadable = isUnreadable();
    const found = !unreadable && recognition.recommendation.kind === 'catalog_match' && !draftChanged;
    $('confirm-builder').disabled = true;
    openPrefilledBuilder({label: unreadable ? null : structuredClone(draft),
      url: found ? recognition.recommendation.recipe_data?.product?.url : null, name: found ? draftName : ''});
  });
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
const builderOptionName = item => item?.[LANG === 'ru' ? 'name_ru' : 'name_en'] || '';
const builderOption = (item, selected) => `<option value="${escape(item.id)}"${item.id === selected ? ' selected' : ''}>${escape(builderOptionName(item))}</option>`;
const builderHelp = (label, key) => `<details class="builder-help"><summary aria-label="${escape(t('builder_help', label))}">?</summary><p>${escape(t(key))}</p></details>`;
const builderField = (id, label, control, help) => {
  const origin = builder.prefill?.fields.get(id);
  const badge = origin ? `<span class="builder-recognized" id="${id}-recognized">${t(origin === 'photo' ? 'prefill_photo' : 'prefill_catalog')}</span>` : '';
  return `<div class="builder-field"><div class="builder-field-head"><label for="${id}">${escape(label)}</label>${builderHelp(label, help)}</div>${badge}${control}</div>`;
};
// A text field with its own list: opens on focus or tap, filters while typing (RU and EN names).
const builderCombo = (id, value) => `<div class="combo">
  <input id="${id}" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${id}-list" autocomplete="off" autocapitalize="off" spellcheck="false" value="${escape(value)}">
  <button type="button" class="combo-toggle" data-combo-toggle="${id}" tabindex="-1" aria-label="${escape(t('combo_show'))}"></button>
  <ul class="combo-list" id="${id}-list" role="listbox" hidden></ul>
</div>`;
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
    ${builderField('cb-country', t('builder_country'), builderCombo('cb-country', d.country || ''), 'builder_help_country')}
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
    ${builderField('cb-grinder', t('builder_grinder'), builderCombo('cb-grinder', d.grinder || ''), 'builder_help_grinder')}
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
  const titles = ['builder_step_coffee', 'builder_step_tools', 'builder_step_recipe',
    'builder_step_result', 'builder_step_correction'];
  const step = builder.step, rating = step >= 3;
  const wide = matchMedia('(min-width: 900px)').matches;
  $('builder-title').textContent = t(titles[step]);
  $('builder-intro').textContent = t(rating ? 'feedback_intro' : 'builder_intro');
  $('builder-mode').textContent = t(builder.mode === 'basic' ? 'builder_mode_pro' : 'builder_mode_basic');
  $('builder-mode').hidden = rating;
  $('builder-form').hidden = rating;
  $('builder-feedback').hidden = !rating;
  $('builder-result').hidden = rating;
  $('builder-correction').hidden = !rating;
  $('builder-progress-text').textContent = `${t('builder_step', step + 1)} · ${t(titles[step])}`;
  $('builder-progress-fill').style.width = `${(step + 1) * 20}%`;
  $('screen-construct').dataset.step = String(step);
  $('builder-coffee-fields')?.classList.toggle('active', step === 0);
  $('builder-tool-fields')?.classList.toggle('active', step === 1);
  // Phone: one pane per step. Desktop: form or feedback on the left, live result on the right.
  $('builder-result-pane').hidden = !wide && (step < 2 || step === 3);
  const variant = builder.variants[builder.selected];
  const correction = builder.correction;
  const unchanged = correction && !correction.changes.length;
  const nextLabel = t(['builder_next', 'builder_build', 'builder_brew', 'builder_get_correction',
    unchanged ? 'builder_brew' : 'builder_brew_corrected'][step]);
  $('builder-next').textContent = step === 1 ? locked('builder', nextLabel)
    : step === 3 && builder.adjustCounted !== builder.rated ? locked('recipe_adjust', nextLabel) : nextLabel;
  $('builder-next').disabled = builder.busy || !builder.options || (step === 2 && !variant) ||
    (step === 3 && !feedbackPayload()) || (step === 4 && !correction);
  const secondary = step === 2 ? variant : step === 4 ? correction : null;
  const saved = step === 4 && Boolean(correction) && ownEntries().some(entry => entry.key === ownRecipeKey(correction.recipe));
  $('builder-secondary').hidden = !secondary;
  $('builder-secondary').textContent = step === 2 ? t('builder_rate') : saved ? t('builder_saved_own') : locked('own_recipes', t('builder_save_own'));
  $('builder-secondary').disabled = saved || builder.busy;
  document.querySelector('.builder-cta-buttons').classList.toggle('pair', Boolean(secondary));
  $('builder-rebuild').textContent = locked('builder', t('builder_rebuild'));
  $('builder-rebuild').hidden = !builder.variants.length;
  $('builder-photo').textContent = t('builder_photo');
  $('builder-photo').hidden = step !== 0 || !modelOptions?.ocr?.available;
  const match = builder.catalogMatch;
  $('builder-catalog').hidden = !match || step > 1;
  if (match) {
    setText('builder-catalog-text', t('builder_catalog_found', match.recipe_data.product.name));
    setText('builder-catalog-open', t('builder_catalog_open'));
  }
  $('builder-cta').dataset.step = String(step);
}

// Where focus lands after a step change: the visible heading of that step.
function builderFocusTarget() {
  const wide = matchMedia('(min-width: 900px)').matches;
  if (!wide && builder.step === 4) return $('correction-title') || $('builder-title');
  if (!wide && builder.step === 2) return $('builder-recipe-title') || $('builder-title');
  return $('builder-title');
}

// Status next to what the person is looking at: the form, or the sticky action bar.
function builderStatusId() {
  return matchMedia('(min-width: 900px)').matches || [0, 1, 3].includes(builder.step) ? 'builder-status' : 'builder-cta-status';
}
function builderStatus(text, error = false) {
  const id = builderStatusId();
  setStatus(id, text, error);
  setStatus(id === 'builder-status' ? 'builder-cta-status' : 'builder-status', '');
}

const COMBO_SOURCES = {'cb-country': 'countries', 'cb-grinder': 'grinders'};
function comboOptions(input) {
  const query = input.value.trim().toLowerCase();
  const items = builder.options[COMBO_SOURCES[input.id]].map(item => ({label: builderOptionName(item),
    keys: [item.id, item.name_ru, item.name_en].map(value => value.toLowerCase())}))
    .sort((a, b) => a.label.localeCompare(b.label, LANG));
  // An exact choice shows the whole list again, so another value is one tap away.
  if (!query || items.some(item => item.keys.includes(query))) return items;
  return items.filter(item => item.keys.some(key => key.includes(query)));
}
function openCombo(input) {
  const list = $(`${input.id}-list`);
  const items = comboOptions(input);
  list.innerHTML = items.length
    ? items.map((item, index) => `<li role="option" id="${input.id}-option-${index}" data-value="${escape(item.label)}" aria-selected="${item.label === input.value}">${escape(item.label)}</li>`).join('')
    : `<li class="combo-empty" role="option" aria-disabled="true">${escape(t('combo_empty'))}</li>`;
  list.hidden = false;
  input.setAttribute('aria-expanded', 'true');
  input.removeAttribute('aria-activedescendant');
}
function closeCombo(input) {
  const list = $(`${input.id}-list`);
  if (!list || list.hidden) return;
  list.hidden = true;
  input.setAttribute('aria-expanded', 'false');
  input.removeAttribute('aria-activedescendant');
}
function moveCombo(input, delta) {
  if ($(`${input.id}-list`).hidden) openCombo(input);
  const options = [...$(`${input.id}-list`).querySelectorAll('[role="option"]:not([aria-disabled])')];
  if (!options.length) return;
  const current = options.findIndex(option => option.id === input.getAttribute('aria-activedescendant'));
  const next = options[Math.max(0, Math.min(options.length - 1, current + delta))];
  options.forEach(option => option.classList.toggle('active', option === next));
  input.setAttribute('aria-activedescendant', next.id);
  next.scrollIntoView({block: 'nearest'});
}
function pickCombo(input, value) {
  input.value = value;
  closeCombo(input);
  input.dispatchEvent(new Event('change', {bubbles: true}));
}
function wireCombos() {
  const fields = $('builder-fields');
  const comboInput = target => target?.matches?.('[role="combobox"]') ? target : null;
  fields.addEventListener('focusin', event => { const input = comboInput(event.target); if (input) openCombo(input); });
  fields.addEventListener('focusout', event => {
    const input = comboInput(event.target);
    if (input) setTimeout(() => { if (document.activeElement !== input) closeCombo(input); }, 120);
  });
  fields.addEventListener('input', event => { const input = comboInput(event.target); if (input) openCombo(input); });
  fields.addEventListener('keydown', event => {
    const input = comboInput(event.target);
    if (!input) return;
    const list = $(`${input.id}-list`);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      moveCombo(input, event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Enter' && !list.hidden) {
      event.preventDefault();
      const active = $(input.getAttribute('aria-activedescendant') || '');
      if (active) pickCombo(input, active.dataset.value); else closeCombo(input);
    } else if (event.key === 'Escape' && !list.hidden) {
      event.preventDefault();
      closeCombo(input);
    } else if (event.key === 'Tab') closeCombo(input);
  });
  // Keep focus in the field while an option or the arrow is pressed.
  fields.addEventListener('mousedown', event => {
    if (event.target.closest('.combo-list, .combo-toggle')) event.preventDefault();
  });
  fields.addEventListener('click', event => {
    const option = event.target.closest('.combo-list [role="option"]:not([aria-disabled])');
    if (option) { pickCombo($(option.closest('.combo-list').id.replace(/-list$/, '')), option.dataset.value); return; }
    const toggle = event.target.closest('[data-combo-toggle]');
    if (!toggle) return;
    const input = $(toggle.dataset.comboToggle);
    if ($(`${input.id}-list`).hidden) { input.focus({preventScroll: true}); openCombo(input); } else closeCombo(input);
  });
}

// Prefill the builder from what is known about a coffee: the confirmed photo label first,
// then the saved catalog profile. Anything unknown stays empty for the person to fill in.
const PROCESSING_FROM_LABEL = [[['anaerobic', 'washed'], 'washed_anaerobic'], [['anaerobic', 'natural'], 'natural_anaerobic'],
  [['washed'], 'washed'], [['natural'], 'natural'], [['honey'], 'honey']];
async function openPrefilledBuilder({label = null, url = null, name = '', keep = false, catalogMatch = null} = {}) {
  if (!await ensureBuilderOptions()) { setStatus(currentScreen() === 'confirm' ? 'confirm-status' : 'cta-status', t('builder_error'), true); return; }
  let profile = null;
  if (url) {
    try { profile = (await api(`/api/coffee/profile?url=${encodeURIComponent(url)}`)).profile; } catch (error) { profile = null; }
  }
  const known = value => Array.isArray(value) ? value.length > 0 : typeof value === 'string' && value.trim() !== '';
  const pick = (photo, catalog) => known(photo) ? ['photo', photo] : known(catalog) ? ['catalog', catalog] : [null, null];
  const lowerName = name.toLowerCase();
  const nameCountry = builder.options.countries.filter(item => lowerName.startsWith(item.name_ru.toLowerCase()))
    .sort((a, b) => b.name_ru.length - a.name_ru.length)[0]?.id;
  const draft = {}, fields = new Map();
  const [countryFrom, country] = pick(label?.country, profile?.country || nameCountry);
  const countryItem = builder.options.countries.find(item => item.id === country);
  if (countryItem) { draft.country = builderOptionName(countryItem); fields.set('cb-country', countryFrom); }
  const [processingFrom, processing] = pick(label?.processing, profile?.processing);
  const processingId = processing && PROCESSING_FROM_LABEL.find(([keys]) => keys.every(key => processing.includes(key)))?.[1];
  if (processingId) { draft.processing = processingId; fields.set('cb-processing', processingFrom); }
  const [varietyFrom, variety] = pick(label?.variety, profile?.variety);
  if (variety) { draft.variety = variety.map(key => featureName('varieties', key)).join(', ').slice(0, 120); fields.set('cb-variety', varietyFrom); }
  const [regionFrom, region] = pick(label?.region, profile?.region);
  if (region) { draft.region = region.trim().slice(0, 120); fields.set('cb-region', regionFrom); }
  if (label?.espresso_or_dark) {
    Object.assign(draft, {roast: 'dark', roast_pro: '6'});
    fields.set('cb-roast', 'photo').set('cb-roast-pro', 'photo');
  }
  if (keep) captureBuilderDraft();
  Object.assign(builder, {draft: keep ? {...builder.draft, ...draft} : draft, prefill: {fields}, catalogMatch,
    variants: [], selected: 0, correction: null, rated: null, step: 0, ratingOrigin: 'builder'});
  renderBuilderFields();
  renderBuilderResult();
  renderBuilderCorrection();
  show('construct');
  setStatus('builder-status', fields.size ? t('prefill_note') : '');
}

// Quick mode: a photo of the bag fills the coffee fields without leaving the builder.
// A coffee from the catalog is offered with its roaster recipe first.
async function builderPhoto(file) {
  if (!file) return;
  $('builder-photo').disabled = true;
  setStatus('builder-status', t('status_reading'));
  try {
    const data = await post('/api/label', await photoBlob(file), 'image/jpeg');
    const recommendation = data.recommendation;
    if (data.photo_state === 'unreadable') { setStatus('builder-status', t('builder_photo_unreadable'), true); return; }
    const found = recommendation.kind === 'catalog_match' && recommendation.recipe_data;
    await openPrefilledBuilder({label: recommendation.label, keep: true, catalogMatch: found ? recommendation : null,
      url: found ? recommendation.recipe_data.product.url : null, name: found ? recommendation.recipe_data.product.name : ''});
  } catch (error) {
    setStatus('builder-status', error.message || t('err_label'), true);
  } finally { $('builder-photo').disabled = false; }
}
function openCatalogRecommendation(recommendation) {
  resetTimer();
  currentData = {...recommendation.recipe_data, confirmed_label: structuredClone(recommendation.label)};
  currentProduct = currentData.product;
  recipeLoading = false;
  markSelected();
  renderRecipe(0);
  show('recipe');
}

// Any roaster recipe can be rated: the engine takes an unchanged copy, the correction is a new recipe.
const ROASTER_PAGE = /^https:\/\/theweldercatherine\.ru\/catalog\/[\w\-./%]{1,250}$/;
function roasterSource() {
  const kind = currentData.recommendation_kind || 'catalog';
  const reference = ['closest_reference', 'suggested_baseline'].includes(kind);
  const url = currentData.product?.url || '';
  return {name: ((reference && currentData.reference_name) || currentData.product.name).slice(0, 180),
    url: ROASTER_PAGE.test(url) ? url : null, kind};
}
function roasterChips() {
  const label = currentData.confirmed_label, chips = [];
  if (label?.country) chips.push(featureName('countries', label.country));
  (label?.processing || []).forEach(key => chips.push(featureName('processing', key)));
  if (!label && currentData.product?.region?.trim()) chips.push(currentData.product.region.trim());
  if (currentRecipe?.device) chips.push(currentRecipe.device);
  return chips.slice(0, 5);
}
async function rateRoasterRecipe() {
  const recipe = currentRecipe, onBrew = currentScreen() === 'brew';
  if (!recipe || !currentData) return;
  const fail = message => onBrew ? setText('brew-done-text', message) : setStatus('cta-status', message, true);
  if (!await ensureBuilderOptions()) { fail(t('builder_error')); return; }
  let reply;
  try {
    const payload = {device: recipe.device, grinder: recipe.grinder, grind_setting: recipe.grind_setting,
      coffee_g: recipe.coffee_g, water_g: recipe.water_g, temperature_c: recipe.temperature_c,
      duration_seconds: recipe.duration_seconds, steps: recipe.steps.map(step => ({instruction: step.instruction,
        water_g: step.water_g, start_seconds: step.start_seconds, stop_seconds: step.stop_seconds}))};
    reply = await post('/api/recipes/adopt', JSON.stringify({recipe: payload, source: roasterSource()}), 'application/json');
  } catch (error) { fail(t('rate_incomplete')); return; }
  setStatus('cta-status', '');
  openBuilderRating(reply.recipe, {fresh: true, origin: 'recipe', chips: roasterChips()});
  if (onBrew) {
    history.replaceState({screen: 'construct'}, '', '#construct');
    show('construct', {push: false});
  } else show('construct');
}

// Where a calculated recipe comes from, in one line.
function calculatedOrigin(recipe) {
  if (recipe.basis !== 'roaster') return t('builder_calculated');
  return t(recipe.revision ? 'origin_roaster_corrected' : 'origin_roaster');
}
function grindInfo(recipe) {
  const grind = recipe.grind || {};
  if (recipe.basis === 'roaster') {
    const offset = grind.steps_from_source || 0;
    return {value: grind.setting ?? grind.source_setting ?? null, scale: grind.grinder_label || '',
      note: offset ? t('grind_roaster_moved', Math.abs(offset), offset < 0) : t('grind_roaster_source')};
  }
  return {value: grind.setting ?? null, scale: (LANG === 'ru' ? grind.scale_label : grind.scale_label_en) || '',
    note: `${t('builder_grind_nominal')}: ${num(grind.target_particle_microns)} µm`};
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
  builder.ratingOrigin = 'builder';
  builder.prefill = builder.catalogMatch = null;
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
  if (!requireFeature('builder', builderStatusId())) return;
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
    if (entitlement().plan !== 'member') countUse('builder');
    builder.selected = Math.min(builder.selected, builder.variants.length - 1);
    builder.rated = builder.correction = null;
    renderBuilderCorrection();
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

// "Save to my recipes" on a starting recipe: the same list as corrected recipes.
function builderFavored(recipe) {
  const key = ownRecipeKey(recipe);
  return ownEntries().some(entry => entry.key === key);
}
function toggleBuilderFavorite() {
  const recipe = builder.variants[builder.selected];
  const key = ownRecipeKey(recipe);
  const entries = ownEntries();
  const saved = entries.some(entry => entry.key === key)
    ? writeOwnEntries(entries.filter(entry => entry.key !== key))
    : saveNewOwn(newOwnEntry(recipe, {source: 'built', context_chips: builderContext(recipe)}), builderStatusId());
  if (saved === null) return;
  builderStatus(saved ? '' : t('builder_save_error'), !saved);
  renderBuilderResult();
}

// Shared pieces of a calculated recipe: number tiles, the brew table and the reasons.
function calculatedTiles(recipe, attribute, editableTemperature = false) {
  const control = (field, delta, label, disabled) => `<button type="button" ${attribute}="${field}:${delta}" aria-label="${escape(label)}"${disabled ? ' disabled' : ''}>${delta < 0 ? '−' : '+'}</button>`;
  const quantity = (field, step, label, low, high) => !attribute ? '' : `<div class="builder-quantity">${control(field, -step, `${t('builder_decrease')} ${label}`, recipe[field] <= low)}${control(field, step, `${t('builder_increase')} ${label}`, recipe[field] >= high)}</div>`;
  const info = grindInfo(recipe);
  const grind = info.value == null ? t('builder_grind_unmapped') : [info.value, info.scale].filter(Boolean).map(escape).join(' · ');
  return `<div class="builder-tiles">
      <div class="builder-tile"><span>${t('coffee')}</span><strong>${grams(recipe.dose_g)}</strong>${quantity('dose_g', 1, t('coffee'), 5, 40)}</div>
      <div class="builder-tile"><span>${t('water')}</span><strong>${grams(recipe.water_g)}</strong>${quantity('water_g', 10, t('water'), 80, 600)}</div>
      <div class="builder-tile"><span>${t('temperature')}</span><strong>${celsius(recipe.temperature_c)}</strong>${editableTemperature ? quantity('temperature_c', 1, t('temperature'), 80, 99) : ''}</div>
      <div class="builder-tile"><span>${t('ratio')}</span><strong>${escape(num(recipe.ratio))}</strong></div>
      <div class="builder-tile builder-tile-wide"><span>${t('grind')}</span><strong>${grind}</strong><small>${escape(info.note)}</small></div>
    </div>`;
}

function calculatedSteps(recipe) {
  const rows = recipe.steps.map(step => {
    const action = stepName(step.instruction);
    const why = LANG === 'ru' ? step.why : STRINGS.en.builder_whys[step.why] || step.why;
    return `<tr><td>${clock(step.start_seconds)}</td><td>${step.total_water_g == null ? '—' : grams(step.total_water_g)}</td><td><strong>${escape(action)}</strong><small>${escape(why)}</small></td></tr>`;
  }).join('');
  return rows ? `<div class="builder-table-wrap"><table class="builder-table"><thead><tr><th>${t('builder_start_col')}</th><th>${t('builder_scale_col')}</th><th>${t('builder_action_col')}</th></tr></thead><tbody>${rows}</tbody></table></div>`
    : `<p class="note">${t('builder_automatic')}</p>`;
}

function calculatedReasons(recipe) {
  const reasons = recipe.reasons.map(reason => `<li>${escape(LANG === 'ru' ? reason.text_ru : reason.text_en)}</li>`).join('');
  return `<details class="builder-reasons"><summary>${t('builder_reasons')}</summary><ul>${reasons}</ul></details>`;
}

// Variant name, plus the correction number once the engine has corrected it.
function calculatedName(recipe) {
  const name = recipe.basis === 'roaster' ? recipe.source?.name || '' : t(`builder_variant_${recipe.id}`);
  return recipe.revision ? `${name} · ${t('correction_revision', recipe.revision)}` : name;
}

function renderBuilderResult() {
  const recipe = builder.variants[builder.selected];
  if (!recipe) { $('builder-result').innerHTML = `<p class="note">${t('builder_no_recipe')}</p>`; return; }
  const chips = builderContext(recipe);
  const shown = chips.slice(0, 2).map(value => `<span class="builder-chip">${escape(value)}</span>`).join('');
  const rest = chips.length > 2 ? `<details class="builder-more"><summary>${t('builder_more_context', chips.length - 2)}</summary>${chips.slice(2).map(value => `<span class="builder-chip">${escape(value)}</span>`).join('')}</details>` : '';
  const favored = builderFavored(recipe);
  $('builder-result').innerHTML = `<div class="builder-recipe">
    <p class="builder-origin">${t('builder_calculated')}</p>
    <div class="builder-variant-bar" role="group" aria-label="${t('variant')}">
      <button class="button" type="button" id="builder-prev-variant" aria-label="${t('builder_prev_variant')}"${builder.selected === 0 ? ' disabled' : ''}>←</button>
      <span>${t('builder_variant_position', builder.selected + 1, builder.variants.length)}</span>
      <button class="button" type="button" id="builder-next-variant" aria-label="${t('builder_next_variant')}"${builder.selected === builder.variants.length - 1 ? ' disabled' : ''}>→</button>
    </div>
    <h2 class="title" id="builder-recipe-title" tabindex="-1">${t(`builder_variant_${recipe.id}`)}</h2>
    <p class="subtitle">${t(`builder_summary_${recipe.id}`)}</p>
    <div class="builder-context">${shown}${rest}</div>
    <p class="note builder-caution">${t('builder_approximate')}</p>
    ${calculatedTiles(recipe, 'data-adjust')}
    <h3 class="section">${t('builder_process')}</h3>
    ${calculatedSteps(recipe)}
    ${calculatedReasons(recipe)}
    <button type="button" class="button builder-favorite" id="builder-favorite" aria-pressed="${favored}">${favored ? t('builder_unfavorite') : locked('own_recipes', t('builder_favorite'))}</button>
    ${recipe.machine_compatible ? `<button type="button" class="button builder-machine" id="builder-machine"${machineConnected() ? '' : ' hidden'}>${t('builder_machine')}</button>` : ''}
  </div>`;
  $('builder-prev-variant').addEventListener('click', () => { builder.selected--; renderBuilderResult(); });
  $('builder-next-variant').addEventListener('click', () => { builder.selected++; renderBuilderResult(); });
  $('builder-favorite').addEventListener('click', toggleBuilderFavorite);
  $('builder-machine')?.addEventListener('click', () => {
    currentRecipe = recipe;
    brewOrigin = 'construct';
    startMachineBrew();
  });
  updateBuilderStep();
  $('builder-result').querySelectorAll('[data-adjust]').forEach(button => button.addEventListener('click', () => adjustBuilderQuantity(button.dataset.adjust)));
}

function brewBuilderRecipe() {
  const recipe = builder.variants[builder.selected];
  if (!recipe) return;
  currentRecipe = recipe;
  brewOrigin = 'construct';
  brewName = null;
  if (brewMode === 'machine') leaveMachineMode();
  resetTimer();
  show('brew');
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
    builderStatus('');
  } catch (error) {
    builderStatus(error.message || t('builder_error'), true);
  } finally {
    builder.busy = false;
    renderBuilderResult();
    $('builder-result').querySelector(`[data-adjust="${spec}"]`)?.focus({preventScroll: true});
  }
}

// ---------------------------------------------------------------------------
// Result → correction: taste or refractometer, diagnosis, chart, corrected recipe.
// The engine decides; the page only collects feedback and draws the answer.
// ---------------------------------------------------------------------------
const MEASURE_FIELDS = {'fb-tds': 'tds', 'fb-yield': 'yield', 'fb-dose': 'dose', 'fb-drawdown': 'drawdown'};

function openBuilderRating(recipe, {fresh = false, origin = 'builder', chips = null, name = null} = {}) {
  if (!recipe) return;
  clearTimeout(builder.correctionTimer);
  builder.ratingOrigin = origin;
  builder.ratedName = name;
  builder.ratedChips = chips || (origin === 'builder' ? builderContext(recipe) : null);
  if (fresh || builder.rated !== recipe) {
    builder.rated = recipe;
    builder.tastes = [];
    builder.tasteHelp = null;
    builder.measure = {tds: '', yield: '', dose: String(recipe.dose_g), drawdown: ''};
    builder.correction = null;
  }
  builder.step = 3;
  setStatus('builder-cta-status', '');
  builderStatus('');
  renderBuilderFeedback();
  renderBuilderCorrection();
  updateBuilderStep();
}

function tasteColumn(id) {
  return builder.options.tastes.columns.find(column => column.descriptors.includes(id))?.id;
}

function renderBuilderFeedback() {
  const recipe = builder.rated, tastes = builder.options?.tastes;
  if (!recipe || !tastes) { $('builder-feedback').replaceChildren(); return; }
  const words = STRINGS[LANG];
  const taste = builder.feedbackMode === 'taste';
  const m = builder.measure;
  const columns = tastes.columns.map(column => `<fieldset class="taste-group">
      <legend>${escape(words.taste_columns[column.id])}</legend>
      <div class="taste-options">${column.descriptors.map(id => `<div class="taste-option">
        <label class="taste-choice" title="${escape(words.taste_help[id])}"><input type="checkbox" name="taste" value="${id}"><span>${escape(words.taste_names[id])}</span></label>
        <button type="button" class="taste-help" data-taste-help="${id}" aria-expanded="false" aria-controls="taste-explain-${column.id}" aria-label="${escape(t('taste_help_label', words.taste_names[id]))}"></button>
      </div>`).join('')}</div>
      <p class="taste-explain" id="taste-explain-${column.id}" data-column="${column.id}" aria-live="polite" hidden></p>
    </fieldset>`).join('');
  const measureField = (id, key, label, help, extra) =>
    builderField(id, t(label), builderInput(id, 'number', m[key], `${extra} inputmode="decimal"`), help);
  $('builder-feedback').innerHTML = `
    <div class="feedback-rated"><span>${t('feedback_rating')}</span><strong>${escape(builder.ratedName || calculatedName(recipe))}</strong>
      ${recipe.basis === 'roaster' ? `<small>${escape(calculatedOrigin(recipe))}</small>` : ''}
      <small>${grams(recipe.dose_g)} · ${grams(recipe.water_g)} · ${celsius(recipe.temperature_c)} · ${escape(num(recipe.ratio))}</small></div>
    <div class="feedback-modes" role="group" aria-label="${t('feedback_mode')}">
      <button type="button" class="button" data-feedback-mode="taste" aria-pressed="${taste}">${t('feedback_by_taste')}</button>
      <button type="button" class="button" data-feedback-mode="measure" aria-pressed="${!taste}">${t('feedback_by_meter')}</button>
    </div>
    <div id="feedback-taste"${taste ? '' : ' hidden'}>
      <p class="feedback-count" id="feedback-count"></p>
      <p class="edit-hint">${t('feedback_conflicts_hint')}</p>
      <div class="taste-columns">${columns}</div>
    </div>
    <div id="feedback-measure"${taste ? ' hidden' : ''}>
      <div class="builder-pro-grid">
        ${measureField('fb-tds', 'tds', 'measure_tds', 'measure_help_tds', 'min="0.1" max="5" step="0.01"')}
        ${measureField('fb-yield', 'yield', 'measure_yield', 'measure_help_yield', `min="1" max="${recipe.water_g}" step="1"`)}
        ${measureField('fb-dose', 'dose', 'measure_dose', 'measure_help_dose', 'min="5" max="40" step="0.1"')}
        ${measureField('fb-drawdown', 'drawdown', 'measure_drawdown', 'measure_help_drawdown', 'min="1" max="1200" step="1"')}
      </div>
      <p class="feedback-extraction" id="feedback-extraction" aria-live="polite"></p>
      <p class="edit-hint">${t('measure_formula')}</p>
      <p class="note error" id="feedback-measure-error" role="alert" hidden></p>
    </div>`;
  updateFeedbackState();
  updateTasteHelp();
}

// Mirrors the engine: an option is off when it conflicts with a chosen one or the limit is reached.
function updateFeedbackState() {
  const tastes = builder.options?.tastes;
  if (!tastes || !$('feedback-count')) return;
  const full = builder.tastes.length >= tastes.max_selected;
  document.querySelectorAll('#builder-feedback [name="taste"]').forEach(input => {
    const checked = builder.tastes.includes(input.value);
    const blocked = !checked && (full || builder.tastes.some(id => tastes.conflicts[id]?.includes(input.value)));
    input.checked = checked;
    input.disabled = blocked;
    input.closest('.taste-option').classList.toggle('selected', checked);
    input.closest('.taste-option').classList.toggle('blocked', blocked);
  });
  setText('feedback-count', t('feedback_count', builder.tastes.length, tastes.max_selected));
  const measured = feedbackMeasurement();
  setText('feedback-extraction', measured.extraction == null ? '' : t('measure_extraction', num(measured.extraction.toFixed(1))));
  $('feedback-measure-error').hidden = !measured.error;
  setText('feedback-measure-error', measured.error || '');
  updateBuilderStep();
}

function toggleTasteHelp(id) {
  builder.tasteHelp = builder.tasteHelp === id ? null : id;
  updateTasteHelp();
}

function updateTasteHelp() {
  const id = builder.tasteHelp, words = STRINGS[LANG];
  document.querySelectorAll('#builder-feedback [data-taste-help]').forEach(button =>
    button.setAttribute('aria-expanded', String(button.dataset.tasteHelp === id)));
  document.querySelectorAll('#builder-feedback .taste-explain').forEach(box => {
    const shown = Boolean(id) && box.dataset.column === tasteColumn(id);
    box.hidden = !shown;
    box.innerHTML = shown ? `<strong>${escape(words.taste_names[id])}</strong> — ${escape(words.taste_help[id])}` : '';
  });
}

// The extraction preview uses the same formula as the engine; the engine stays the judge.
function feedbackMeasurement() {
  const recipe = builder.rated, m = builder.measure;
  const read = value => String(value ?? '').trim() === '' ? null : Number(String(value).replace(',', '.'));
  const tds = read(m.tds), beverage = read(m.yield), dose = read(m.dose), drawdown = read(m.drawdown);
  let error = null;
  if (tds != null && !(tds >= 0.1 && tds <= 5)) error = t('measure_invalid_tds');
  else if (beverage != null && !(beverage >= 1 && beverage <= recipe.water_g)) error = t('measure_invalid_yield', grams(recipe.water_g));
  else if (dose != null && !(Math.abs(dose - recipe.dose_g) <= 0.1)) error = t('measure_dose_mismatch', grams(recipe.dose_g));
  else if (drawdown != null && !(drawdown >= 1 && drawdown <= 1200)) error = t('measure_invalid_drawdown');
  const complete = [tds, beverage, dose, drawdown].every(value => value != null);
  const extraction = !error && tds != null && beverage != null && dose ? beverage * tds / dose : null;
  return {error, extraction, value: complete && !error
    ? {beverage_tds_percent: tds, beverage_g: beverage, dose_g: dose, drawdown_seconds: drawdown} : null};
}

function feedbackPayload() {
  if (!builder.rated) return null;
  if (builder.feedbackMode === 'taste') return builder.tastes.length ? {descriptors: [...builder.tastes]} : null;
  const measurement = feedbackMeasurement().value;
  return measurement ? {measurement} : null;
}

async function requestCorrection({focus = false} = {}) {
  const feedback = feedbackPayload();
  if (!feedback) return;
  clearTimeout(builder.correctionTimer);
  builder.correctionRequest?.abort();
  const rated = builder.rated;
  // The first correction of a rated cup is free; its live updates on desktop are the same correction.
  const fresh = builder.adjustCounted !== rated;
  if (fresh && !requireFeature('recipe_adjust', 'builder-status')) return;
  const request = builder.correctionRequest = new AbortController();
  builder.busy = true;
  updateBuilderStep();
  builderStatus(t('correction_loading'));
  try {
    const data = await post('/api/recipes/adjust', JSON.stringify({recipe: rated, feedback}), 'application/json', request.signal);
    if (builder.correctionRequest !== request) return;
    if (fresh && entitlement().plan !== 'member') countUse('adjust');
    builder.adjustCounted = rated;
    builder.correction = {...data, feedback};
    builder.step = 4;
    builderStatus('');
    renderBuilderCorrection();
    updateBuilderStep();
    if (focus) builderFocusTarget()?.focus({preventScroll: true});
  } catch (error) {
    if (error.name !== 'AbortError') builderStatus(error.message || t('builder_error'), true);
  } finally {
    if (builder.correctionRequest === request) { builder.busy = false; updateBuilderStep(); }
  }
}

// Desktop keeps the correction live while the feedback on the left changes.
function scheduleCorrectionUpdate() {
  clearTimeout(builder.correctionTimer);
  if (builder.step !== 4 || !matchMedia('(min-width: 900px)').matches || !feedbackPayload()) return;
  builder.correctionTimer = setTimeout(requestCorrection, 500);
}

function changeLine(change) {
  const why = escape(LANG === 'ru' ? change.why : change.why_en);
  let label, value, detail = '';
  if (change.parameter === 'temperature_c') {
    label = t('temperature');
    value = `${celsius(change.before)} → ${celsius(change.after)}`;
  } else if (change.parameter === 'water_g') {
    label = t('water');
    value = `${grams(change.before)} → ${grams(change.after)}`;
    detail = `${t('ratio')}: ${escape(num(change.ratio_before))} → ${escape(num(change.ratio_after))}`;
  } else if (change.basis === 'roaster') {
    label = t('grind');
    const direction = t(change.after < change.before ? 'change_finer' : 'change_coarser');
    value = change.before_setting && change.after_setting
      ? `${escape(change.before_setting)} → ${escape(change.after_setting)} · ${direction}` : direction;
    detail = [change.grinder_label ? escape(change.grinder_label) : '', t('change_roaster_own')].filter(Boolean).join(' · ');
  } else {
    label = t('grind');
    const direction = t(change.after < change.before ? 'change_finer' : 'change_coarser');
    const settings = change.before_setting && change.after_setting && change.before_setting !== change.after_setting;
    value = settings ? `${escape(change.before_setting)} → ${escape(change.after_setting)} · ${direction}` : direction;
    const scale = LANG === 'ru' ? change.scale_label : change.scale_label_en;
    detail = `${t('change_target', num(change.before), num(change.after))}${settings && scale ? ` · ${escape(scale)}` : ''}`;
  }
  return `<span class="change-head"><strong>${label}</strong><span class="change-value">${value}</span></span>${detail ? `<small>${detail}</small>` : ''}<small>${why}</small>`;
}

// Inline SVG: extraction (x) against strength (y), ratio diagonals, the SCA zone and the cup.
function extractionChart(chart) {
  if (!chart) return '';
  const width = 340, height = 286, left = 46, right = 34, top = 14, bottom = 56;
  const [x0, x1] = chart.extraction_axis, [y0, y1] = chart.tds_axis;
  const px = value => left + (value - x0) / (x1 - x0) * (width - left - right);
  const py = value => height - bottom - (value - y0) / (y1 - y0) * (height - top - bottom);
  const f = value => value.toFixed(1);
  const segment = (points, cls) => points ? `<line class="${cls}" x1="${f(px(points[0][0]))}" y1="${f(py(points[0][1]))}" x2="${f(px(points[1][0]))}" y2="${f(py(points[1][1]))}"/>` : '';
  const label = (x, y, value, cls, anchor = 'middle', extra = '') => `<text class="${cls}" x="${f(x)}" y="${f(y)}" text-anchor="${anchor}"${extra}>${escape(value)}</text>`;
  let grid = '';
  for (let value = x0; value <= x1; value += 2) {
    grid += `<line class="chart-grid" x1="${f(px(value))}" y1="${f(py(y0))}" x2="${f(px(value))}" y2="${f(py(y1))}"/>`;
    grid += label(px(value), py(y0) + 16, num(value), 'chart-tick');
  }
  for (const value of [0.9, 1.2, 1.5, 1.8]) {
    grid += `<line class="chart-grid" x1="${f(px(x0))}" y1="${f(py(value))}" x2="${f(px(x1))}" y2="${f(py(value))}"/>`;
    grid += label(left - 6, py(value) + 4, num(value.toFixed(1)), 'chart-tick', 'end');
  }
  const zone = chart.balanced;
  const zoneRect = `<rect class="chart-zone" x="${f(px(zone.extraction[0]))}" y="${f(py(zone.tds[1]))}" width="${f(px(zone.extraction[1]) - px(zone.extraction[0]))}" height="${f(py(zone.tds[0]) - py(zone.tds[1]))}" rx="3"/>`;
  const ratios = chart.ratio_lines.map(line => {
    const end = line.points[1];
    const atTop = end[1] >= y1 - 0.001;
    const text = line.ratio % 2 ? '' : atTop
      ? label(px(end[0]), py(end[1]) - 4, `1:${line.ratio}`, 'chart-ratio-label')
      : label(px(end[0]) + 4, py(end[1]) + 4, `1:${line.ratio}`, 'chart-ratio-label', 'start');
    return segment(line.points, 'chart-ratio') + text;
  }).join('');
  const middle = (x0 + x1) / 2;
  const zones = label(px(middle), py(y1) + 16, t('chart_strong'), 'chart-zone-label')
    + label(px(middle), py(y0) - 8, t('chart_weak'), 'chart-zone-label')
    + label(left, py(y0) + 33, t('chart_under'), 'chart-side-label', 'start')
    + label(width - right, py(y0) + 33, t('chart_over'), 'chart-side-label', 'end');
  const axes = label(left + (width - left - right) / 2, height - 4, t('chart_x'), 'chart-axis')
    + `<text class="chart-axis" transform="rotate(-90)" x="${f(-(top + (height - top - bottom) / 2))}" y="13" text-anchor="middle">${escape(t('chart_y'))}</text>`;
  let cup = '', legend = '', note = t('chart_note_estimate'), description = '';
  if (chart.cup?.kind === 'measured') {
    const x = px(Math.min(x1, Math.max(x0, chart.cup.extraction_percent)));
    const y = py(Math.min(y1, Math.max(y0, chart.cup.tds_percent)));
    const ey = num(chart.cup.extraction_percent.toFixed(1)), tds = num(chart.cup.tds_percent.toFixed(2));
    cup = `<circle class="chart-cup-halo" cx="${f(x)}" cy="${f(y)}" r="12"/><circle class="chart-cup" cx="${f(x)}" cy="${f(y)}" r="6.5"/>`;
    legend = `<li><i class="legend-cup" aria-hidden="true"></i>${escape(t('chart_cup', ey, tds))}</li>`;
    note = `${t('chart_note_measured')}${chart.cup.inside ? '' : ` ${t('chart_note_outside')}`}`;
    description = t('chart_desc_measured', ey, tds);
  } else if (chart.cup) {
    cup = segment(chart.cup.points, 'chart-estimate');
    legend = `<li><i class="legend-estimate" aria-hidden="true"></i>${escape(t('chart_estimate'))}</li>`;
    description = t('chart_desc_estimate', num(chart.cup.extraction_range[0]), num(chart.cup.extraction_range[1]));
  }
  return `<figure class="extraction-chart">
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="chart-title chart-desc">
      <title id="chart-title">${escape(t('chart_title'))}</title><desc id="chart-desc">${escape(description)}</desc>
      <rect class="chart-plot" x="${left}" y="${top}" width="${width - left - right}" height="${height - top - bottom}"/>
      ${grid}${zoneRect}${ratios}${segment(chart.recipe_line.points, 'chart-recipe')}${zones}${cup}${axes}
    </svg>
    <figcaption>
      <ul class="chart-legend">
        <li><i class="legend-zone" aria-hidden="true"></i>${escape(t('chart_zone'))}</li>
        <li><i class="legend-recipe" aria-hidden="true"></i>${escape(t('chart_recipe', num(chart.recipe_line.ratio)))}</li>
        ${legend}
      </ul>
      <p>${escape(note)}</p>
    </figcaption>
  </figure>`;
}

function renderBuilderCorrection() {
  const pane = $('builder-correction');
  const data = builder.correction;
  if (!data) { pane.innerHTML = `<p class="note">${t('correction_placeholder')}</p>`; return; }
  const recipe = data.recipe, ru = LANG === 'ru';
  const changes = data.changes.map(change => `<li>${changeLine(change)}</li>`).join('');
  pane.innerHTML = `<div class="builder-recipe correction">
    <p class="builder-origin">${escape(calculatedOrigin(recipe))}</p>
    <p class="correction-kind">${t(data.measurement_kind === 'measured' ? 'correction_by_meter' : 'correction_by_taste')}</p>
    <h2 class="title" id="correction-title" tabindex="-1">${escape(ru ? data.diagnosis : data.diagnosis_en)}</h2>
    <p class="correction-explanation">${escape(ru ? data.explanation : data.explanation_en)}</p>
    ${extractionChart(data.chart)}
    <h3 class="section">${t('correction_changes')}</h3>
    ${changes ? `<ul class="correction-changes">${changes}</ul>` : `<p class="note">${t(data.at_limit ? 'correction_at_limit' : 'correction_no_changes')}</p>`}
    <h3 class="section">${t(data.changes.length ? 'correction_recipe' : 'correction_same_recipe')}</h3>
    <p class="correction-name">${escape(calculatedName(recipe))}</p>
    ${recipe.edited ? `<p class="note">${t('correction_edited')}</p>` : ''}
    <p class="note builder-caution">${t('builder_approximate')}</p>
    ${calculatedTiles(recipe, 'data-correction-adjust', true)}
    <h3 class="section">${t('builder_process')}</h3>
    ${calculatedSteps(recipe)}
    ${calculatedReasons(recipe)}
    ${recipe.machine_compatible ? `<button type="button" class="button builder-machine" id="correction-machine"${machineConnected() ? '' : ' hidden'}>${t('builder_machine')}</button>` : ''}
  </div>`;
}

// Editable corrected recipe: dose and water through the engine, temperature within its bounds.
async function adjustCorrectionQuantity(spec) {
  const data = builder.correction;
  if (!data || builder.busy) return;
  const [field, deltaText] = spec.split(':');
  const delta = Number(deltaText), recipe = data.recipe;
  if (field === 'temperature_c') {
    const value = recipe.temperature_c + delta;
    if (value < 80 || value > 99) return;
    data.recipe = {...recipe, temperature_c: value, edited: true};
  } else {
    builder.busy = true;
    updateBuilderStep();
    try {
      const target = recipe[field] + delta;
      const reply = await post('/api/recipes/rescale', JSON.stringify({recipe,
        dose_g: field === 'dose_g' ? target : null, water_g: field === 'water_g' ? target : null}), 'application/json');
      if (builder.correction !== data) return;
      data.recipe = {...reply.recipe, edited: true};
      builderStatus('');
    } catch (error) {
      builderStatus(error.message || t('builder_error'), true);
    } finally { builder.busy = false; }
  }
  renderBuilderCorrection();
  updateBuilderStep();
  $('builder-correction').querySelector(`[data-correction-adjust="${spec}"]`)?.focus({preventScroll: true});
}

function saveOwnRecipe() {
  const data = builder.correction;
  if (!data) return;
  const recipe = data.recipe;
  const entry = newOwnEntry(recipe, {source: 'corrected', context_chips: builder.ratedChips || builderContext(recipe),
    feedback: data.feedback, diagnosis_code: data.diagnosis_code, measurement_kind: data.measurement_kind,
    extraction_percent: data.extraction_percent});
  const saved = saveNewOwn(entry, 'builder-cta-status');
  if (saved === null) return;
  if (saved) setStatus('builder-cta-status', t('builder_saved_status'));
  else setStatus('builder-cta-status', t('builder_save_error'), true);
  updateBuilderStep();
}

function brewCorrectedRecipe() {
  const recipe = builder.correction?.recipe;
  if (!recipe) return;
  currentRecipe = recipe;
  brewOrigin = 'construct';
  brewName = null;
  if (brewMode === 'machine') leaveMachineMode();
  resetTimer();
  show('brew');
}

function wireFeedback() {
  const feedback = $('builder-feedback');
  feedback.addEventListener('click', event => {
    const mode = event.target.closest('[data-feedback-mode]');
    if (mode) {
      builder.feedbackMode = mode.dataset.feedbackMode;
      renderBuilderFeedback();
      feedback.querySelector(`[data-feedback-mode="${builder.feedbackMode}"]`).focus({preventScroll: true});
      scheduleCorrectionUpdate();
      return;
    }
    const help = event.target.closest('[data-taste-help]');
    if (help) toggleTasteHelp(help.dataset.tasteHelp);
  });
  feedback.addEventListener('change', event => {
    if (event.target.name !== 'taste') return;
    const id = event.target.value;
    builder.tastes = builder.tastes.filter(value => value !== id);
    if (event.target.checked) builder.tastes.push(id);
    updateFeedbackState();
    scheduleCorrectionUpdate();
  });
  feedback.addEventListener('input', event => {
    const key = MEASURE_FIELDS[event.target.id];
    if (!key) return;
    builder.measure[key] = event.target.value;
    updateFeedbackState();
    scheduleCorrectionUpdate();
  });
  $('builder-correction').addEventListener('click', event => {
    const control = event.target.closest('[data-correction-adjust]');
    if (control) { adjustCorrectionQuantity(control.dataset.correctionAdjust); return; }
    if (event.target.closest('#correction-machine')) {
      currentRecipe = builder.correction.recipe;
      brewOrigin = 'construct';
      startMachineBrew();
    }
  });
}

function wireBuilder() {
  $('open-builder').addEventListener('click', beginBuilder);
  $('builder-back').addEventListener('click', () => {
    if (builder.step === 3 && ['own', 'recipe'].includes(builder.ratingOrigin)) { back(builder.ratingOrigin); return; }
    if (builder.step > 0) {
      if (builder.step <= 2) captureBuilderDraft();
      clearTimeout(builder.correctionTimer);
      builder.correctionRequest?.abort();
      builder.step--;
      setStatus('builder-cta-status', '');
      updateBuilderStep();
      builderFocusTarget()?.focus({preventScroll: true});
    } else back('find');
  });
  $('builder-close').addEventListener('click', () => {
    clearTimeout(builder.correctionTimer);
    show('find');
  });
  $('builder-mode').addEventListener('click', () => {
    captureBuilderDraft();
    builder.mode = builder.mode === 'basic' ? 'pro' : 'basic';
    if (builder.step === 2 && !matchMedia('(min-width: 900px)').matches) builder.step = 0;
    renderBuilderFields();
    scheduleBuilderUpdate();
  });
  $('builder-form').addEventListener('change', event => {
    const id = event.target.name === 'cb-roast' ? 'cb-roast' : event.target.id;
    if (builder.prefill?.fields.delete(id)) $(`${id}-recognized`)?.remove();
    scheduleBuilderUpdate();
  });
  wireCombos();
  $('builder-next').addEventListener('click', () => {
    if (builder.step === 0) { captureBuilderDraft(); builder.step = 1; updateBuilderStep(); $('builder-title').focus({preventScroll: true}); }
    else if (builder.step === 1) buildBuilderRecipes();
    else if (builder.step === 2) brewBuilderRecipe();
    else if (builder.step === 3) requestCorrection({focus: true});
    else brewCorrectedRecipe();
  });
  $('builder-secondary').addEventListener('click', () => {
    if (builder.step === 2) {
      openBuilderRating(builder.variants[builder.selected]);
      $('builder-title').focus({preventScroll: true});
    } else if (builder.step === 4) saveOwnRecipe();
  });
  $('builder-rebuild').addEventListener('click', buildBuilderRecipes);
  $('builder-photo').addEventListener('click', () => $('builder-photo-input').click());
  $('builder-photo-input').addEventListener('change', event => { builderPhoto(event.target.files[0]); event.target.value = ''; });
  $('builder-catalog-open').addEventListener('click', () => { if (builder.catalogMatch) openCatalogRecommendation(builder.catalogMatch); });
  wireFeedback();
}

function scheduleBuilderUpdate() {
  clearTimeout(builder.updateTimer);
  if (!builder.variants.length || !matchMedia('(min-width: 900px)').matches || !can('builder')) return;
  builder.updateTimer = setTimeout(buildBuilderRecipes, 500);
}

// ---------------------------------------------------------------------------
// My recipes: saved calculated recipes on this device, their list, reuse and sharing.
// An entry is self-contained (the engine recipe plus how it came about), so the
// same object can later move to an account on the server unchanged.
// ---------------------------------------------------------------------------
const OWN_RECIPES_KEY = 'firstbrew.myRecipes.v1';
const MAX_OWN_RECIPES = 50;
const SHARE_PREFIX = '#recipe=';
const own = {entry: null, from: 'mine', confirmDelete: false, notice: ''};

function validOwnEntry(entry) {
  const recipe = entry?.recipe, finite = Number.isFinite;
  const roaster = recipe?.id === 'roaster' && recipe.basis === 'roaster' && typeof recipe.source?.name === 'string';
  return entry.format === 'firstbrew.recipe' && entry.version === 1 &&
    typeof entry.id === 'string' && entry.id.length <= 64 && typeof entry.key === 'string' &&
    typeof entry.saved_at === 'string' && !Number.isNaN(Date.parse(entry.saved_at)) &&
    (entry.title == null || (typeof entry.title === 'string' && entry.title.length <= 80)) &&
    (entry.context_chips == null || (Array.isArray(entry.context_chips) && entry.context_chips.every(chip => typeof chip === 'string'))) &&
    recipe?.origin === 'calculated' && (['brighter', 'sweeter'].includes(recipe.id) || roaster) &&
    typeof recipe.device_id === 'string' && typeof recipe.ratio === 'string' &&
    ['dose_g', 'water_g', 'temperature_c', 'duration_seconds'].every(key => finite(recipe[key])) &&
    (recipe.revision == null || Number.isInteger(recipe.revision)) &&
    (roaster || finite(recipe.grind?.target_particle_microns)) && Array.isArray(recipe.reasons) &&
    Array.isArray(recipe.steps) && recipe.steps.length <= 12 && recipe.steps.every(step => step &&
      ['start_seconds', 'stop_seconds', 'pour_g', 'total_water_g'].every(key => finite(step[key])));
}
function ownEntries() {
  try {
    const stored = JSON.parse(localStorage.getItem(OWN_RECIPES_KEY) || '[]');
    return Array.isArray(stored) ? stored.filter(entry => entry && typeof entry === 'object' && validOwnEntry(entry)) : [];
  } catch (error) { return []; }
}
function writeOwnEntries(entries) {
  try {
    localStorage.setItem(OWN_RECIPES_KEY, JSON.stringify(entries.slice(0, MAX_OWN_RECIPES)));
    return true;
  } catch (error) { return false; }
  finally { renderMineEntry(); }
}
function ownRecipeKey(recipe) {
  return JSON.stringify([recipe.device_id, recipe.id, recipe.revision || 0, recipe.dose_g, recipe.water_g,
    recipe.temperature_c, recipe.grind?.target_particle_microns, recipe.grind?.setting]);
}
function newOwnEntry(recipe, details = {}) {
  return {format: 'firstbrew.recipe', version: 1, key: ownRecipeKey(recipe),
    id: `own-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    saved_at: new Date().toISOString(), source: 'built', title: null, context_chips: [],
    brew_count: 0, last_brewed_at: null, ...details, recipe};
}
// Saving the same recipe twice keeps one entry, the newest on top.
function saveOwnEntry(entry) {
  return writeOwnEntries([entry, ...ownEntries().filter(item => item.key !== entry.key)]);
}
// A new entry counts against the free limit; saved ones are never removed or blocked.
// Returns null when the limit stopped it (the lock sheet explains why).
function saveNewOwn(entry, statusId) {
  const exists = ownEntries().some(item => item.key === entry.key);
  if (!exists && !requireFeature('own_recipes', statusId)) return null;
  return saveOwnEntry(entry);
}
function updateOwnEntry(id, changes) {
  const entries = ownEntries();
  const index = entries.findIndex(entry => entry.id === id);
  if (index < 0) return null;
  entries[index] = {...entries[index], ...changes};
  return writeOwnEntries(entries) ? entries[index] : null;
}
function ownSaved(entry) {
  return Boolean(entry) && ownEntries().some(item => item.id === entry.id);
}
function ownName(entry) {
  return entry.title || calculatedName(entry.recipe);
}
function ownSource(entry) {
  const source = entry.source || (entry.feedback ? 'corrected' : 'built');
  if (source === 'corrected') return t(entry.measurement_kind === 'measured' ? 'correction_by_meter' : 'correction_by_taste');
  return t(source === 'shared' ? 'own_source_shared' : 'own_source_built');
}
function ownDate(value) {
  return new Intl.DateTimeFormat(LANG, {day: 'numeric', month: 'short'}).format(new Date(value));
}
function ownFeedback(entry) {
  const names = STRINGS[LANG].taste_names;
  const tastes = (entry.feedback?.descriptors || []).filter(id => Object.hasOwn(names, id)).map(id => names[id].toLowerCase());
  if (tastes.length) return t('own_feedback_taste', tastes.join(', '));
  return Number.isFinite(entry.extraction_percent) ? t('own_feedback_meter', num(entry.extraction_percent.toFixed(1))) : '';
}

function renderMineEntry() {
  const count = ownEntries().length;
  $('open-mine').hidden = !count;
  $('open-mine').textContent = t('mine_open', count);
}

function renderMine() {
  const entries = ownEntries();
  const list = $('mine-list');
  list.replaceChildren();
  entries.forEach(entry => {
    const recipe = entry.recipe;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'coffee own-card';
    button.setAttribute('role', 'listitem');
    button.dataset.own = entry.id;
    const chips = (entry.context_chips || []).slice(0, 3).join(' · ');
    button.innerHTML = `<span class="coffee-copy"><strong>${escape(ownName(entry))}</strong>
      <small>${grams(recipe.dose_g)} · ${grams(recipe.water_g)} · ${escape(num(recipe.ratio))} · ${celsius(recipe.temperature_c)}</small>
      ${chips ? `<small>${escape(chips)}</small>` : ''}
      <small>${escape(ownSource(entry))} · ${escape(ownDate(entry.saved_at))}</small></span><span class="arrow" aria-hidden="true">→</span>`;
    list.append(button);
  });
  list.hidden = !entries.length;
  $('mine-empty').hidden = entries.length > 0;
  setStatus('mine-status', own.notice);
  own.notice = '';
}

function openOwn(entry, from = 'mine') {
  own.entry = entry;
  own.from = from;
  own.confirmDelete = false;
  renderOwn();
  show('own');
}

function renderOwn() {
  const entry = own.entry;
  if (!entry) return;
  const recipe = entry.recipe, saved = ownSaved(entry);
  const chips = (entry.context_chips || []).map(chip => `<span class="builder-chip">${escape(chip)}</span>`).join('');
  const meta = [ownSource(entry), saved ? t('own_saved_on', ownDate(entry.saved_at)) : '',
    entry.brew_count ? t('own_brewed', entry.brew_count) : ''].filter(Boolean).join(' · ');
  const feedback = ownFeedback(entry);
  $('own-body').innerHTML = `<div class="builder-recipe own-recipe">
    <p class="builder-origin">${escape(calculatedOrigin(recipe))}</p>
    <h1 class="title" id="own-title" tabindex="-1">${escape(ownName(entry))}</h1>
    <p class="subtitle">${escape(meta)}</p>
    ${chips ? `<div class="builder-context">${chips}</div>` : ''}
    ${saved ? '' : `<p class="note">${t('own_unsaved')}</p>`}
    ${feedback ? `<p class="note">${escape(feedback)}</p>` : ''}
    ${saved ? builderField('own-name', t('own_name'), builderInput('own-name', 'text', entry.title || '',
      `maxlength="80" autocomplete="off" placeholder="${escape(calculatedName(recipe))}"`), 'own_name_help') : ''}
    <p class="note builder-caution">${t('builder_approximate')}</p>
    ${calculatedTiles(recipe, null)}
    <h2 class="section">${t('builder_process')}</h2>
    ${calculatedSteps(recipe)}
    ${calculatedReasons(recipe)}
    ${recipe.machine_compatible ? `<button type="button" class="button builder-machine" id="own-machine"${machineConnected() ? '' : ' hidden'}>${t('builder_machine')}</button>` : ''}
    <h2 class="section">${t('own_share_title')}</h2>
    <div class="own-share">
      ${typeof navigator.share === 'function' ? `<button type="button" class="button" id="own-share">${t('own_share')}</button>` : ''}
      <button type="button" class="button" id="own-copy-text">${t('own_copy_text')}</button>
      <button type="button" class="button" id="own-copy-link">${t('own_copy_link')}</button>
    </div>
    <details class="own-text" id="own-text-box"><summary>${t('own_show_text')}</summary>
      <textarea id="own-text" readonly rows="12" aria-label="${t('own_text_label')}">${escape(ownText(entry))}</textarea></details>
    ${saved ? `<div class="own-delete">
      <button type="button" class="button danger" id="own-delete"${own.confirmDelete ? ' hidden' : ''}>${t('own_delete')}</button>
      <div class="own-delete-confirm" id="own-delete-confirm" role="group" aria-labelledby="own-delete-question"${own.confirmDelete ? '' : ' hidden'}>
        <p id="own-delete-question">${escape(t('own_delete_question', ownName(entry)))}</p>
        <div class="edit-actions"><button type="button" class="button danger" id="own-delete-yes">${t('own_delete_confirm')}</button>
        <button type="button" class="button" id="own-delete-no">${t('cancel')}</button></div>
      </div></div>` : ''}
  </div>`;
  $('own-primary').textContent = saved ? t('builder_brew') : locked('own_recipes', t('own_save'));
  $('own-secondary').textContent = t(saved ? 'builder_rate' : 'builder_brew');
}

// Plain text for messengers and notes: the numbers, the steps and the honest origin.
function ownText(entry, link = '') {
  const recipe = entry.recipe;
  const info = grindInfo(recipe);
  const grind = info.value == null ? t('builder_grind_unmapped') : [info.value, info.scale].filter(Boolean).join(' · ');
  const note = recipe.basis === 'roaster' ? info.note : t('own_text_target', recipe.grind.target_particle_microns);
  const steps = recipe.steps.map(step => `${clock(step.start_seconds)} · ${grams(step.total_water_g)} · ${stepName(step.instruction)}`);
  const origin = recipe.basis === 'roaster' ? t('own_text_origin_roaster', recipe.source.name) : t('own_text_origin');
  const head = [ownName(entry), origin, (entry.context_chips || []).join(' · '),
    `${t('coffee')} ${grams(recipe.dose_g)} · ${t('water')} ${grams(recipe.water_g)} · ${num(recipe.ratio)} · ${celsius(recipe.temperature_c)}`,
    `${t('grind')}: ${grind} (${note})`,
    `${t('builder_total_time')}: ${clock(recipe.duration_seconds)}`].filter(Boolean);
  const tail = [t('builder_approximate'), link ? t('own_text_link', link) : ''].filter(Boolean);
  return [...head, '', ...(steps.length ? steps : [t('builder_automatic')]), '', ...tail].join('\n');
}

// Share links carry the recipe in the URL fragment, which never reaches the server;
// explanations are left out to keep the link short. The server re-checks on import.
function base64url(bytes) {
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromBase64url(text) {
  return Uint8Array.from(atob(text.replace(/-/g, '+').replace(/_/g, '/')), char => char.charCodeAt(0));
}
async function streamBytes(bytes, Stream, limit = 60000) {
  const reader = new Blob([bytes]).stream().pipeThrough(new Stream('deflate-raw')).getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const {done, value} = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) { reader.cancel(); throw new Error(t('own_link_broken')); }
    chunks.push(value);
  }
  const result = new Uint8Array(size);
  chunks.reduce((offset, chunk) => { result.set(chunk, offset); return offset + chunk.length; }, 0);
  return result;
}
async function ownLink(entry) {
  const {reasons, assumptions, context_chips: _chips, name, summary, ...recipe} = entry.recipe;
  const payload = {v: 1, t: entry.title || undefined,
    c: entry.context_chips?.length ? entry.context_chips : undefined, r: {...recipe, reasons: []}};
  let bytes = new TextEncoder().encode(JSON.stringify(payload)), mark = 'j';
  if (typeof CompressionStream === 'function') {
    try { bytes = await streamBytes(bytes, CompressionStream); mark = 'z'; } catch (error) { /* plain link */ }
  }
  return `${location.origin}${location.pathname}${SHARE_PREFIX}${mark}${base64url(bytes)}`;
}
async function readShareLink(data) {
  if (data.length > 16000 || !/^[jz][A-Za-z0-9_-]+$/.test(data)) throw new Error(t('own_link_broken'));
  let bytes, payload;
  try { bytes = fromBase64url(data.slice(1)); } catch (error) { throw new Error(t('own_link_broken')); }
  if (data[0] === 'z') {
    if (typeof DecompressionStream !== 'function') throw new Error(t('own_link_unsupported'));
    try { bytes = await streamBytes(bytes, DecompressionStream); } catch (error) { throw new Error(t('own_link_broken')); }
  }
  try { payload = JSON.parse(new TextDecoder().decode(bytes)); } catch (error) { throw new Error(t('own_link_broken')); }
  if (payload?.v !== 1 || !payload.r || typeof payload.r !== 'object') throw new Error(t('own_link_broken'));
  let reply;
  try { reply = await post('/api/recipes/import', JSON.stringify({recipe: payload.r}), 'application/json'); }
  catch (error) { throw new Error(t('own_link_broken')); }
  const title = typeof payload.t === 'string' ? payload.t.trim().slice(0, 80) || null : null;
  const chips = Array.isArray(payload.c) ? payload.c.filter(chip => typeof chip === 'string').map(chip => chip.slice(0, 60)).slice(0, 8) : [];
  return newOwnEntry(reply.recipe, {source: 'shared', title, context_chips: chips});
}
async function openShareLink(data) {
  setStatus('status', t('own_link_loading'));
  try {
    const entry = await readShareLink(data);
    setStatus('status', '');
    openOwn(entry, 'link');
  } catch (error) {
    setStatus('status', '');
    own.notice = error.message;
    show('mine');
    setStatus('mine-status', error.message, true);
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.className = 'visually-hidden';
    document.body.append(area);
    area.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch (failure) { copied = false; }
    area.remove();
    return copied;
  }
}
async function shareOwn(kind) {
  const entry = own.entry;
  const link = await ownLink(entry);
  if (kind === 'share') {
    try { await navigator.share({title: ownName(entry), text: ownText(entry), url: link}); }
    catch (error) { if (error.name !== 'AbortError') setStatus('own-status', t('own_copy_failed'), true); }
    return;
  }
  const text = kind === 'link' ? link : ownText(entry, link);
  if (await copyText(text)) setStatus('own-status', t(kind === 'link' ? 'own_copied_link' : 'own_copied_text'));
  else {
    $('own-text').value = text;
    $('own-text-box').open = true;
    $('own-text').select();
    setStatus('own-status', t('own_copy_failed'), true);
  }
}

function brewOwn() {
  const entry = own.entry;
  if (!entry) return;
  if (ownSaved(entry)) own.entry = updateOwnEntry(entry.id, {brew_count: (entry.brew_count || 0) + 1,
    last_brewed_at: new Date().toISOString()}) || entry;
  currentRecipe = own.entry.recipe;
  brewOrigin = 'own';
  brewName = own.entry.title;
  if (brewMode === 'machine') leaveMachineMode();
  resetTimer();
  show('brew');
}

async function ensureBuilderOptions() {
  if (builder.options) return true;
  try {
    builder.options = await api('/api/catalog/options');
    renderBuilderFields();
    renderBuilderResult();
    return true;
  } catch (error) { return false; }
}

async function rateOwnRecipe(recipe, chips, name = null) {
  if (!await ensureBuilderOptions()) {
    setStatus(currentScreen() === 'own' ? 'own-status' : 'status', t('builder_error'), true);
    return false;
  }
  openBuilderRating(recipe, {fresh: true, origin: 'own', chips, name});
  return true;
}

function deleteOwn() {
  const entry = own.entry;
  if (!entry) return;
  writeOwnEntries(ownEntries().filter(item => item.id !== entry.id));
  own.entry = null;
  own.notice = t('mine_deleted');
  if (own.from === 'mine') back('mine');
  else { history.replaceState({screen: 'mine'}, '', '#mine'); show('mine', {push: false}); }
}

function wireOwn() {
  $('open-mine').addEventListener('click', () => show('mine'));
  $('mine-back').addEventListener('click', () => back('find'));
  $('mine-builder').addEventListener('click', beginBuilder);
  $('mine-list').addEventListener('click', event => {
    const card = event.target.closest('[data-own]');
    const entry = card && ownEntries().find(item => item.id === card.dataset.own);
    if (entry) openOwn(entry);
  });
  $('own-back').addEventListener('click', () => back(own.from === 'mine' ? 'mine' : 'find'));
  $('own-primary').addEventListener('click', () => {
    const entry = own.entry;
    if (!entry || ownSaved(entry)) { brewOwn(); return; }
    const saved = saveNewOwn(entry, 'own-status');
    if (saved) { renderOwn(); setStatus('own-status', t('builder_saved_status')); }
    else if (saved === false) setStatus('own-status', t('builder_save_error'), true);
  });
  $('own-secondary').addEventListener('click', async () => {
    const entry = own.entry;
    if (!entry) return;
    if (!ownSaved(entry)) { brewOwn(); return; }
    if (await rateOwnRecipe(entry.recipe, entry.context_chips, entry.title)) show('construct');
  });
  $('own-body').addEventListener('click', event => {
    const id = event.target.closest('button')?.id;
    if (id === 'own-share') shareOwn('share');
    else if (id === 'own-copy-text') shareOwn('text');
    else if (id === 'own-copy-link') shareOwn('link');
    else if (id === 'own-machine') {
      brewOrigin = 'own';
      currentRecipe = own.entry.recipe;
      startMachineBrew();
    } else if (id === 'own-delete' || id === 'own-delete-no') {
      own.confirmDelete = id === 'own-delete';
      $('own-delete').hidden = own.confirmDelete;
      $('own-delete-confirm').hidden = !own.confirmDelete;
      $(own.confirmDelete ? 'own-delete-no' : 'own-delete').focus({preventScroll: true});
    } else if (id === 'own-delete-yes') deleteOwn();
  });
  $('own-body').addEventListener('change', event => {
    if (event.target.id !== 'own-name' || !own.entry) return;
    const title = event.target.value.trim().slice(0, 80) || null;
    const updated = updateOwnEntry(own.entry.id, {title});
    if (!updated) { setStatus('own-status', t('builder_save_error'), true); return; }
    own.entry = updated;
    setText('own-title', ownName(updated));
    $('own-text').value = ownText(updated);
    setStatus('own-status', t('own_name_saved'));
  });
  // A link pasted into a tab that already runs the app changes only the fragment.
  window.addEventListener('hashchange', () => {
    if (!location.hash.startsWith(SHARE_PREFIX)) return;
    const data = location.hash.slice(SHARE_PREFIX.length);
    history.replaceState(history.state, '', location.pathname + location.search);
    openShareLink(data);
  });
  window.addEventListener('storage', event => {
    if (event.key !== OWN_RECIPES_KEY) return;
    renderMineEntry();
    if (currentScreen() === 'mine') renderMine();
  });
}

// ---------------------------------------------------------------------------
// Plans: the membership screen. Prices and texts come from data/plans.json.
// ---------------------------------------------------------------------------
let plansFrom = 'find';
function openPlans() {
  plansFrom = currentScreen() === 'plans' ? plansFrom : currentScreen();
  show('plans');
}
function rubles(value) {
  const format = number => new Intl.NumberFormat(LANG === 'ru' ? 'ru-RU' : 'en-US').format(number);
  if (value && typeof value === 'object') return `${format(value.min)}–${format(value.max)}${NBSP}₽`;
  return `${format(value)}${NBSP}₽`;
}
function renderPlans() {
  setText('plans-title', t('plans_title'));
  setText('plans-demo', t('demo_notice'));
  if (!PLANS) { $('plan-cards').innerHTML = `<p class="note">${t('err_generic')}</p>`; return; }
  $('plan-cards').innerHTML = PLANS.plans.map(plan => `<article class="plan-card" data-plan="${escape(plan.id)}">
    <p class="plan-tagline">${escape(plan.tagline[LANG])}</p>
    <h2 class="plan-name">${escape(plan.name[LANG])}</h2>
    <p class="plan-price">${rubles(plan.price_rub)}</p>
    <p class="plan-note">${escape(plan.price_note[LANG])}</p>
  </article>`).join('');
}
function wirePlans() {
  $('plans-back').addEventListener('click', () => back(plansFrom));
}

// ---------------------------------------------------------------------------
// Screen 3: brew timer
// ---------------------------------------------------------------------------
function resetTimer() {
  clearInterval(timerInterval);
  running = false;
  elapsed = 0;
  finished = false;
  timerStarted = false;
  lastActiveStep = -1;
  keepAwake(false);
  updateTimer();
  if ($('brew-start')) updateBrewStartLabel();
}

function toggleTimer() {
  if (!currentRecipe?.duration_seconds) return;
  if (running) {
    elapsed += (Date.now() - startedAt) / 1000;
    running = false;
    clearInterval(timerInterval);
    keepAwake(false);
  } else {
    if (finished || elapsed >= currentRecipe.duration_seconds) { elapsed = 0; finished = false; }
    running = true;
    timerStarted = true;
    lastActiveStep = -1;
    startedAt = Date.now();
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

function calculatedTimeline(recipe) {
  const segments = [];
  const steps = [...(recipe.steps || [])].sort((a, b) => a.start_seconds - b.start_seconds);
  let cursor = 0;
  let onScale = 0;
  for (const step of steps) {
    if (step.start_seconds > cursor) segments.push({kind: 'wait', start: cursor, stop: step.start_seconds, next: step, total_water_g: onScale});
    segments.push({kind: step.kind, start: step.start_seconds, stop: step.stop_seconds, step});
    cursor = Math.max(cursor, step.stop_seconds);
    onScale = step.total_water_g ?? onScale;
  }
  if (cursor < recipe.duration_seconds) segments.push({kind: steps.length ? 'drawdown' : 'automatic',
    start: cursor, stop: recipe.duration_seconds, total_water_g: onScale});
  return segments;
}

function calculatedSegmentIndex(segments, seconds) {
  return Math.max(0, segments.findIndex(segment => seconds >= segment.start && seconds < segment.stop));
}

function renderCalculatedTimer(seconds, duration) {
  const recipe = currentRecipe;
  const ready = !timerStarted && !finished;
  const segments = calculatedTimeline(recipe);
  $('brew-ready').hidden = !ready;
  $('brew-face').hidden = ready || finished;
  $('brew-done').hidden = !finished;
  $('brew-controls').hidden = finished;
  $('brew-done-controls').hidden = !finished;
  $('brew-clock').classList.toggle('builder-clock', !ready);
  if (ready) {
    setText('brew-ready-origin', calculatedOrigin(recipe));
    setText('brew-ready-name', brewName || calculatedName(recipe));
    setText('brew-ready-summary', t(`builder_summary_${recipe.id}`));
    const grind = grindInfo(recipe);
    $('brew-ready-grid').innerHTML = [
      [t('coffee'), grams(recipe.dose_g)], [t('water'), grams(recipe.water_g)],
      [t('temperature'), celsius(recipe.temperature_c)],
      [t('grind'), grind.value == null ? t('builder_not_applicable') : escape(grind.value)],
    ].map(([label, value], index) => `<div><span>${label}</span><strong>${value}</strong>${index === 3 ? `<small>${escape(grind.value == null ? t('builder_grind_unmapped') : grind.scale || grind.note)}</small>` : ''}</div>`).join('');
    setText('brew-ready-duration', `${t('builder_total_time')}: ${clock(duration)}`);
    setText('brew-toggle', t('builder_start_timer'));
    return;
  }
  if (finished) return;
  const index = calculatedSegmentIndex(segments, seconds);
  const segment = segments[index];
  if (!segment) return;
  if (running && index !== lastActiveStep) {
    lastActiveStep = index;
    notify(1);
  }
  const pouring = segment.kind === 'pour' || segment.kind === 'fill';
  const action = segment.step ? stepName(segment.step.instruction)
    : segment.kind === 'wait' ? t('builder_wait')
    : t(segment.kind === 'automatic' ? 'builder_automatic_wait' : 'builder_drawdown');
  setText('brew-phase', pouring ? t('builder_pour_phase') : t('builder_wait_phase'));
  setText('brew-clock', `${clock(seconds)} / ${clock(duration)}`);
  setText('brew-action', action);
  setText('brew-countdown', t('remaining', countdown(segment.stop - seconds)));
  setText('brew-step-count', t('builder_step_count', index + 1, segments.length));
  $('brew-step-count').hidden = false;
  $('brew-step-tiles').hidden = false;
  $('brew-step-nav').hidden = false;
  setText('brew-pour-value', pouring ? grams(segment.step.pour_g) : t('builder_not_applicable'));
  const onScale = segment.step?.total_water_g ?? segment.total_water_g;
  setText('brew-scale-value', onScale ? grams(onScale) : t('builder_not_applicable'));
  const rate = pouring ? (segment.step.pour_rate_g_s || segment.step.pour_g / (segment.stop - segment.start)) : null;
  setText('brew-rate-value', rate ? t('builder_rate_value', num(Math.round(rate * 10) / 10)) : t('builder_not_applicable'));
  $('brew-progress').style.width = `${Math.min(100, Math.max(0, (seconds - segment.start) / (segment.stop - segment.start) * 100)).toFixed(1)}%`;
  const next = segments[index + 1];
  setText('brew-next', next ? t('builder_next_action', next.step ? stepName(next.step.instruction) :
    t(next.kind === 'automatic' ? 'builder_automatic_wait' : next.kind === 'drawdown' ? 'builder_drawdown' : 'builder_wait')) : '');
  $('brew-prev-step').disabled = index === 0;
  $('brew-next-step').disabled = index === segments.length - 1;
  setText('brew-toggle', running ? t('pause') : t('resume'));
}

function jumpCalculatedStep(delta) {
  if (currentRecipe?.origin !== 'calculated' || brewMode !== 'local') return;
  const segments = calculatedTimeline(currentRecipe);
  const seconds = elapsed + (running ? (Date.now() - startedAt) / 1000 : 0);
  const index = calculatedSegmentIndex(segments, seconds);
  const target = segments[index + delta];
  if (!target) return;
  elapsed = target.start;
  startedAt = Date.now();
  lastActiveStep = -1;
  updateTimer();
}

// Every finished brew, calculated or the roaster's, leads to the taste rating.
function updateDoneActions() {
  const rateable = currentRecipe?.origin === 'calculated' || (brewOrigin === 'recipe' && Boolean(currentData));
  $('brew-rate').hidden = !rateable;
  $('brew-again').classList.toggle('primary', !rateable);
  const machine = brewMode === 'machine';
  setText('brew-done-text', t(rateable ? (machine ? 'builder_machine_done_text' : 'builder_done_text')
    : machine ? 'machine_done_text' : 'done_text'));
}

function updateTimer() {
  if (!currentRecipe || brewMode === 'machine') return;
  updateDoneActions();
  const steps = currentRecipe.steps, duration = currentRecipe.duration_seconds;
  let seconds = elapsed + (running ? (Date.now() - startedAt) / 1000 : 0);
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
  if (currentRecipe.origin === 'calculated') {
    renderCalculatedTimer(seconds, duration);
    return;
  }
  $('brew-ready').hidden = true;
  $('brew-step-count').hidden = true;
  $('brew-step-tiles').hidden = true;
  $('brew-step-nav').hidden = true;
  $('brew-clock').classList.remove('builder-clock');
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
  if (!currentRecipe?.duration_seconds || !can('machine_brew')) return;
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
    const message = error.message || t('builder_machine_error');
    if (brewOrigin === 'own') setStatus('own-status', message, true);
    else if (currentRecipe?.origin === 'calculated') builderStatus(message, true);
    else setStatus('cta-status', message, true);
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
  $('brew-ready').hidden = true;
  $('brew-step-count').hidden = true;
  $('brew-step-tiles').hidden = true;
  $('brew-step-nav').hidden = true;
  $('brew-clock').classList.remove('builder-clock');
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
  updateDoneActions();
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
  else if (status === 'ERROR' || status === 'STOPPED') { back(brewOrigin); startMachineBrew(); }
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
  if (document.visibilityState === 'visible' && (running || (brewMode === 'machine' && MACHINE_ACTIVE.includes(machineState?.state)))) keepAwake(true);
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
  renderMineEntry();
  $('mine-back').textContent = t('back');
  $('mine-title').textContent = t('mine_title');
  $('mine-intro').textContent = t('mine_intro');
  $('mine-empty-text').textContent = t('mine_empty');
  $('mine-builder').textContent = t('builder_open');
  $('own-back').textContent = t('back');
  $('plans-back').textContent = t('back');
  setText('lock-eyebrow', `${LOCK} ${t('lock_eyebrow')}`);
  setText('lock-demo', t('demo_notice'));
  setText('lock-plans', t('lock_view'));
  setText('lock-later', t('lock_later'));
  if (currentScreen() === 'plans') renderPlans();
  if (currentScreen() === 'mine') renderMine();
  if (currentScreen() === 'own') renderOwn();
  $('builder-back').textContent = t('back');
  $('builder-close').setAttribute('aria-label', t('builder_close'));
  $('builder-close').title = t('builder_close');
  $('builder-language-label').textContent = t('language');
  $('builder-language').value = LANG;
  if (builder.options) {
    renderBuilderFields();
    if (builder.variants.length) renderBuilderResult();
    renderBuilderFeedback();
    renderBuilderCorrection();
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
  $('recipe-rate').textContent = t('builder_rate');
  setText('brew-pour-label', t('builder_pour_now'));
  setText('brew-scale-label', t('builder_on_scale'));
  setText('brew-rate-label', t('builder_pour_rate'));
  setText('brew-prev-step', t('builder_prev_step'));
  setText('brew-next-step', t('builder_next_step'));
  $('brew-back').textContent = t('to_recipe');
  $('brew-title').textContent = t('brew_title');
  $('brew-reset').textContent = t('reset');
  $('brew-toggle').textContent = t('resume');
  $('brew-done-title').textContent = t('done_title');
  $('brew-done-text').textContent = t('done_text');
  $('brew-rate').textContent = t('builder_rate');
  $('brew-again').textContent = t('brew_again');
  $('brew-new').textContent = t('another_coffee');
  setToggle('brew-vibrate', 'vibrate');
  setToggle('brew-sound', 'sound');
  if (!navigator.vibrate) $('brew-vibrate').hidden = true;
  if (currentScreen() === 'brew') {
    if (brewMode === 'machine') renderMachine();
    else updateTimer();
  }

}

function init() {
  loadPrefs();
  localize();
  // A shared recipe arrives in the URL fragment; read it before the address is cleaned up.
  const shared = location.hash.startsWith(SHARE_PREFIX) ? location.hash.slice(SHARE_PREFIX.length) : null;
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
    brewOrigin = 'recipe';
    if (brewMode === 'machine') leaveMachineMode();
    show('brew');
    if (!running && elapsed === 0) { saveRecent(); toggleTimer(); }
  });
  $('machine-start').addEventListener('click', () => { brewOrigin = 'recipe'; startMachineBrew(); });
  $('recipe-rate').addEventListener('click', rateRoasterRecipe);
  $('brew-back').addEventListener('click', () => back(brewOrigin));
  $('brew-toggle').addEventListener('click', () => brewMode === 'machine' ? machineToggle() : toggleTimer());
  $('brew-prev-step').addEventListener('click', () => jumpCalculatedStep(-1));
  $('brew-next-step').addEventListener('click', () => jumpCalculatedStep(1));
  $('brew-reset').addEventListener('click', () => {
    if (brewMode === 'machine') { machineStop(); return; }
    resetTimer();
    $('brew-toggle').focus({preventScroll: true});
  });
  $('brew-rate').addEventListener('click', async () => {
    const recipe = currentRecipe;
    if (brewOrigin === 'recipe') { rateRoasterRecipe(); return; }
    if (brewMode === 'machine') leaveMachineMode();
    resetTimer();
    if (brewOrigin === 'construct') {
      openBuilderRating(recipe, {fresh: true, chips: builder.ratedChips});
      back('construct');
    } else if (await rateOwnRecipe(recipe, own.entry?.context_chips, own.entry?.title)) {
      // The timer entry becomes the rating, so "back" leads to the saved recipe.
      history.replaceState({screen: 'construct'}, '', '#construct');
      show('construct', {push: false});
    }
  });
  $('brew-again').addEventListener('click', () => {
    if (brewMode === 'machine') { back(brewOrigin); startMachineBrew(); return; }
    resetTimer();
    back(brewOrigin);
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
  wireOwn();
  wireLockSheet();
  wirePlans();
  loadPlans();
  if (shared) openShareLink(shared);
  refreshMachine();
  setStatus('status', t('status_checking'));
  modelOptionsReady = api('/api/model').then(data => {
    modelOptions = data;
    updateBuilderStep();
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
