"""Deterministic, approximate starting recipes; never a roaster's recipe.

The nominal particle target and the grinder comparison table are independent
heuristics. Burr travel per click is *not* a particle-size calibration.
"""

from copy import deepcopy
from datetime import date
from itertools import combinations
import math
import re

from brew_catalog import load_catalog


COEFFICIENTS = {
    'version': '2.1',
    # 2.1 changed only the feedback step; build() output is identical to 2.0.
    'compatible_versions': ('2.0', '2.1'),
    'base': {'dose_g': 15, 'water_g': 250, 'temperature_c': 94,
             'particle_microns': 780, 'reference_dial': 8.5,
             'duration_seconds': 170, 'bloom_multiplier': 2.5,
             'bloom_wait_seconds': 35},
    'bounds': {'dose_g': (5, 40), 'water_g': (80, 600), 'ratio': (12, 22),
               'temperature_c': (80, 99), 'particle_microns': (400, 1300),
               'reference_dial': (5, 11), 'duration_seconds': (75, 540)},
    'age_band_days': {'fresh': 7, 'over_2_weeks': 21, 'over_1_month': 45,
                      'over_2_months': 75, 'over_4_months': 150, 'over_6_months': 210},
    'age_fresh_max_days': 14,
    'age_old_min_days': 60,
    'low_tds_below_ppm': 75,
    'high_tds_above_ppm': 200,
    'pour': {'min_count': 2, 'max_count': 8, 'rate_g_s': 5,
             'minimum_seconds': 8, 'final_wait_seconds': 28},
    'immersion_timing': {'fill_max_seconds': 20, 'drain_seconds': 20},
    'machine_water_max_g': 400,
    # A roaster recipe is corrected relative to the roaster's own grinder setting:
    # one step is half a division on an EK43 dial, otherwise one division/click.
    # Lower numbers are assumed to be finer, as on EK43, Comandante and 1Zpresso.
    'roaster': {'grind_step': {'ek43': 0.5}, 'grind_default_step': 1, 'grind_max_steps': 6},
    'adjustment': {'temperature_step_c': 2, 'particle_step_microns': 30,
                   'reference_step': 0.5, 'water_ratio_step': 0.5,
                   'balanced_extraction_min_percent': 18,
                   'balanced_extraction_max_percent': 22,
                   'balanced_tds_min_percent': 1.15,
                   'balanced_tds_max_percent': 1.45},
    # Extraction chart. Ratio diagonals assume the bed keeps ~2 g of water per
    # gram of coffee (an approximation); taste bands are not measurements.
    'chart': {'extraction_percent': (14, 26), 'tds_percent': (0.9, 1.8),
              'ratios': (12, 22), 'retained_water_g_per_g': 2.0,
              'taste_extraction_bands': {
                  'under': (14, 18), 'over': (22, 26), 'on_target': (18, 22),
                  'weak_after_sweet': (18, 22), 'heavy_after_sweet': (18, 22),
                  'strength_needs_sweetness': (14, 26)}},
    'roast': {
        'light': {},
        'medium': {'temperature_c': -2, 'particle_microns': 40,
                   'reference_dial': 0.5, 'duration_seconds': -10},
        'dark': {'temperature_c': -5, 'particle_microns': 100,
                 'reference_dial': 1, 'duration_seconds': -20},
    },
    'processing': {
        'washed': {'temperature_c': 1, 'particle_microns': -20, 'reference_dial': -0.5},
        'natural': {'particle_microns': 50, 'reference_dial': 0.5},
        'experimental': {'particle_microns': 50, 'reference_dial': 0.5},
    },
    'age': {
        'fresh': {'bloom_multiplier': 0.5, 'bloom_wait_seconds': 10},
        'old': {'temperature_c': 1, 'particle_microns': -20, 'reference_dial': -0.5},
    },
    'flat': {'particle_microns': 40, 'reference_dial': 0.5, 'pours': 1},
    'high_mass': {'temperature_c': 1},
    'dense_filter': {'particle_microns': 40, 'reference_dial': 0.5},
    'custom_filter_fit': {
        'tight': {'particle_microns': 30, 'reference_dial': 0.5},
        'good': {},
        'loose': {'particle_microns': -20, 'reference_dial': -0.5},
    },
    'low_tds': {'particle_microns': -20, 'reference_dial': -0.5},
    'high_tds': {'particle_microns': 20, 'reference_dial': 0.5},
    'deep_bed_mm': 30,
    'immersion': {'temperature_c': -1, 'particle_microns': 100,
                  'reference_dial': 1, 'duration_seconds': 180},
    'immersion_seconds': {'french_press': 240, 'aeropress': 120,
                          'clever': 180, 'hario_switch': 180},
    'automatic': {'particle_microns': 60, 'reference_dial': 0.5,
                  'duration_seconds': 300},
    'variants': {
        'brighter': {'ratio': 0.5, 'particle_microns': -30,
                     'reference_dial': -0.5, 'pours': -1},
        'sweeter': {'ratio': -0.5, 'particle_microns': 30,
                    'reference_dial': 0.5, 'pours': 1,
                    'duration_seconds': 10},
    },
}

_CATALOG = load_catalog()
_LOOKUP = {kind: {row['id']: row for row in _CATALOG[kind]}
           for kind in ('countries', 'processing', 'devices', 'grinders', 'filters', 'materials')}
_FIELDS = {'country', 'processing', 'roast_level', 'roast_date', 'as_of_date',
           'roast_age_days', 'roast_age_band', 'device_id', 'device_name',
           'bed_height_mm_at_15g', 'filter_fit', 'material', 'filter_id',
           'grinder_id', 'dose_g', 'water_g', 'region', 'variety', 'q_grade',
           'water_ph', 'water_tds_ppm'}
_AGE_BANDS = COEFFICIENTS['age_band_days']


class BrewingInputError(ValueError):
    """Parameters cannot form a meaningful starting recipe."""


def _number(value, name, minimum, maximum):
    if not isinstance(value, (float, int)) or isinstance(value, bool):
        raise BrewingInputError(f'{name}: expected a finite number')
    try:
        finite = math.isfinite(value)
    except (OverflowError, ValueError):
        finite = False
    if not finite:
        raise BrewingInputError(f'{name}: expected a finite number')
    if not minimum <= value <= maximum:
        raise BrewingInputError(f'{name}: expected {minimum}–{maximum}')
    return value


def _choice(value, kind, name):
    if value is None:
        return None
    if not isinstance(value, str) or value not in _LOOKUP[kind]:
        raise BrewingInputError(f'{name}: unknown option')
    return _LOOKUP[kind][value]


def _clamp(value, name):
    low, high = COEFFICIENTS['bounds'][name]
    return min(high, max(low, value))


def _ratio(dose, water):
    return f'1:{water / dose:.1f}'.rstrip('0').rstrip('.')


def _reason(parameter, rule, ru, en, delta=None):
    result = {'parameter': parameter, 'rule': rule, 'text_ru': ru,
              'text_en': en, 'confidence': 'heuristic'}
    if delta is not None:
        result['delta'] = delta
    return result


def _date(value, name):
    if not isinstance(value, str):
        raise BrewingInputError(f'{name}: expected YYYY-MM-DD')
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise BrewingInputError(f'{name}: expected YYYY-MM-DD') from exc


def _age_days(params):
    present = sum(params.get(k) is not None for k in ('roast_age_days', 'roast_age_band', 'roast_date'))
    if present > 1:
        raise BrewingInputError('roast age: supply only one age input')
    if params.get('roast_age_days') is not None:
        age = _number(params['roast_age_days'], 'roast_age_days', 0, 1000)
        if age != round(age):
            raise BrewingInputError('roast_age_days: expected whole days')
        return int(age)
    if params.get('roast_age_band') is not None:
        band = params['roast_age_band']
        if not isinstance(band, str) or band not in _AGE_BANDS:
            raise BrewingInputError('roast_age_band: unknown option')
        return _AGE_BANDS[band]
    if params.get('roast_date') is not None:
        if params.get('as_of_date') is None:
            raise BrewingInputError('as_of_date is required with roast_date')
        age = (_date(params['as_of_date'], 'as_of_date') - _date(params['roast_date'], 'roast_date')).days
        if age < 0 or age > 1000:
            raise BrewingInputError('roast_date: future or too old')
        return age
    if params.get('as_of_date') is not None:
        raise BrewingInputError('as_of_date requires roast_date')
    return None


def _roast(value):
    if isinstance(value, str) and value in ('light', 'medium', 'dark'):
        return value
    if isinstance(value, int) and not isinstance(value, bool) and 1 <= value <= 7:
        return 'light' if value <= 2 else 'medium' if value <= 5 else 'dark'
    raise BrewingInputError('roast_level: use light/medium/dark or integer 1–7')


def _settings(grinder, reference):
    if grinder is None:
        return {'target_particle_microns': None, 'microns': None, 'setting': None,
                'scale_label': None, 'accuracy': 'approximate', 'mapping_basis': 'none'}
    rows = _CATALOG['grind_equivalences']['rows']
    nearest = min(rows, key=lambda row: (abs(row['reference_setting'] - reference), row['reference_setting']))
    interval = nearest['settings'].get(grinder['id'])
    setting = None
    if interval:
        low, high = interval['minimum'], interval['maximum']
        setting = str(low) if low == high else f'{low}–{high}'
    return {'setting': setting,
            'scale_label': f"{grinder['name_ru']} · {grinder['scale']['label_ru']}",
            'scale_label_en': f"{grinder['name_en']} · {grinder['scale']['label_en']}",
            'accuracy': 'approximate',
            'mapping_basis': 'cross_grinder_comparison' if setting else 'uncalibrated',
            'reference_ek43_dial': reference}


# Every step text the engine writes; a shared recipe may carry only these pairs.
_STEP_TEXTS = {
    'bloom': ('Смачиваем весь кофе', 'Даём газу выйти перед основными вливаниями.'),
    'gentle': ('Вливаем тонкой струёй ближе к центру', 'Мягкая струя снижает турбулентность.'),
    'even': ('Вливаем плавно по кругу', 'Равномерно поддерживаем уровень воды над слоем.'),
    'fill': ('Заливаем весь кофе', 'Весь кофе настаивается одновременно.'),
    'steep': ('Настаиваем', 'Контакт воды с кофе раскрывает вкус.'),
    'press': ('Отжимаем', 'Завершаем контакт воды с кофе.'),
    'drain': ('Открываем слив', 'Завершаем контакт воды с кофе.'),
}


def _pour_steps(water, dose, pours, duration, bloom_multiplier, bloom_wait, gentle):
    timing = COEFFICIENTS['pour']
    bloom = min(water - pours + 1, max(1, round(dose * bloom_multiplier)))
    remaining = water - bloom
    amounts = [bloom] + [remaining // (pours - 1)] * (pours - 1)
    for i in range(remaining % (pours - 1)):
        amounts[i + 1] += 1
    steps, cumulative = [], 0
    starts = [0] + [round(bloom_wait + i * (duration - bloom_wait - timing['final_wait_seconds']) / (pours - 1))
                    for i in range(pours - 1)]
    for i, (start, amount) in enumerate(zip(starts, amounts)):
        stop = min(start + max(timing['minimum_seconds'], round(amount / timing['rate_g_s'])),
                   starts[i + 1] if i + 1 < pours else duration)
        cumulative += amount
        action, why = _STEP_TEXTS['bloom' if i == 0 else 'gentle' if gentle else 'even']
        steps.append({'kind': 'pour', 'start_seconds': start, 'stop_seconds': stop,
                      'pour_g': amount, 'water_g': amount, 'total_water_g': cumulative,
                      'pour_rate_g_s': round(amount / (stop - start), 2),
                      'instruction': action, 'why': why})
    return steps


def _immersion_steps(water, duration, device_id):
    timing = COEFFICIENTS['immersion_timing']
    fill_stop = min(timing['fill_max_seconds'], duration // 5)
    drain_kind = 'press' if device_id in ('french_press', 'aeropress') else 'drain'
    texts = {kind: dict(zip(('instruction', 'why'), _STEP_TEXTS[kind])) for kind in ('fill', 'steep', drain_kind)}
    return [
        {'kind': 'fill', 'start_seconds': 0, 'stop_seconds': fill_stop,
         'water_g': water, 'pour_g': water, 'total_water_g': water, **texts['fill']},
        {'kind': 'steep', 'start_seconds': fill_stop, 'stop_seconds': duration - timing['drain_seconds'],
         'water_g': 0, 'pour_g': 0, 'total_water_g': water, **texts['steep']},
        {'kind': drain_kind, 'start_seconds': duration - timing['drain_seconds'], 'stop_seconds': duration,
         'water_g': 0, 'pour_g': 0, 'total_water_g': water, **texts[drain_kind]},
    ]


def build(params):
    """Return brighter and sweeter variants from explicit, validated inputs."""
    if not isinstance(params, dict):
        raise BrewingInputError('params: expected an object')
    unknown = set(params) - _FIELDS
    if unknown:
        raise BrewingInputError(f'unknown fields: {", ".join(sorted(unknown))}')
    assumptions = ['Рецепт расчётный, не рецепт обжарщика.',
                   'Помол — стартовый ориентир; подстройте по вкусу и сливу.']
    device = _choice(params.get('device_id', 'v60'), 'devices', 'device_id')
    if device is None:
        raise BrewingInputError('device_id is required')
    if 'device_id' not in params:
        assumptions.append('Устройство не указано: взята V60.')
    country = _choice(params.get('country'), 'countries', 'country')
    processing = _choice(params.get('processing'), 'processing', 'processing')
    grinder = _choice(params.get('grinder_id'), 'grinders', 'grinder_id')
    material = _choice(params.get('material', device['default_material_id']), 'materials', 'material')
    filter_item = _choice(params.get('filter_id', device['default_filter_id']), 'filters', 'filter_id')
    roast = _roast(params.get('roast_level', 'light'))
    if 'roast_level' not in params:
        assumptions.append('Степень обжарки не указана: взята светлая.')
    age = _age_days(params)
    if age is None:
        assumptions.append('Возраст обжарки неизвестен: поправка не применена.')
    dose = _number(params.get('dose_g', COEFFICIENTS['base']['dose_g']), 'dose_g', *COEFFICIENTS['bounds']['dose_g'])
    water = _number(params.get('water_g', COEFFICIENTS['base']['water_g']), 'water_g', *COEFFICIENTS['bounds']['water_g'])
    if water / dose < COEFFICIENTS['bounds']['ratio'][0] or water / dose > COEFFICIENTS['bounds']['ratio'][1]:
        raise BrewingInputError('dose_g/water_g: ratio must be 1:12–1:22')
    if dose != round(dose) or water != round(water):
        raise BrewingInputError('dose_g and water_g must be whole grams')
    dose, water = int(dose), int(water)
    for field, low, high in (('water_ph', 0, 14), ('water_tds_ppm', 0, 1000), ('q_grade', 0, 100)):
        if params.get(field) is not None:
            _number(params[field], field, low, high)
    for field in ('region', 'variety'):
        value = params.get(field)
        if value is not None and (not isinstance(value, str) or not 0 < len(value.strip()) <= 120):
            raise BrewingInputError(f'{field}: expected text up to 120 characters')
    if device['id'] == 'custom_dripper':
        if not isinstance(params.get('device_name'), str) or not params['device_name'].strip():
            raise BrewingInputError('device_name is required for custom_dripper')
        height = _number(params.get('bed_height_mm_at_15g'), 'bed_height_mm_at_15g', 1, 100)
        if params.get('filter_fit') not in ('tight', 'good', 'loose'):
            raise BrewingInputError('filter_fit is required for custom_dripper')
        if material is None:
            raise BrewingInputError('material is required for custom_dripper')
    else:
        if any(params.get(k) is not None for k in ('device_name', 'bed_height_mm_at_15g', 'filter_fit')):
            raise BrewingInputError('custom device fields require custom_dripper')
        height = None
    base = dict(COEFFICIENTS['base'])
    base['pours'] = device['default_pours']
    reasons = [_reason(k, 'base', 'Стартовая настройка для фильтра.', 'Filter starting point.')
               for k in ('dose_g', 'water_g', 'temperature_c', 'grind', 'duration_seconds', 'steps')]

    def apply(rule, changes, ru, en):
        for key, delta in changes.items():
            base[key] = base.get(key, 0) + delta
            reasons.append(_reason(key, rule, ru, en, delta))

    apply(f'roast_{roast}', COEFFICIENTS['roast'][roast],
          'Поправка по степени обжарки.', 'Adjustment for roast level.')
    if processing:
        family = processing['family']
        if processing['id'] in ('washed_anaerobic', 'natural_anaerobic'):
            family = 'experimental'
        if family in COEFFICIENTS['processing']:
            apply(f'processing_{family}', COEFFICIENTS['processing'][family],
                  'Поправка по обработке; возможная доля мелкой фракции — гипотеза.',
                  'Processing adjustment; fines content is a hypothesis.')
    if age is not None and age <= COEFFICIENTS['age_fresh_max_days']:
        apply('fresh_roast', COEFFICIENTS['age']['fresh'],
              'Свежий кофе может активнее выделять газ.', 'Fresh coffee may release more gas.')
    if age is not None and age > COEFFICIENTS['age_old_min_days']:
        apply('old_roast', COEFFICIENTS['age']['old'],
              'Для старого кофе пробуем усилить экстракцию; аромат не восстановить.',
              'Try more extraction; lost aroma cannot be restored.')
    if device['method'] == 'percolation' and device['geometry'] == 'flat':
        apply('flat_bed', COEFFICIENTS['flat'], 'Поправка на плоское дно и иной слив.',
              'Adjustment for a flat bed and its flow.')
    if device['id'] == 'custom_dripper':
        apply(f'custom_filter_fit_{params["filter_fit"]}',
              COEFFICIENTS['custom_filter_fit'][params['filter_fit']],
              'Поправка на посадку фильтра — стартовая гипотеза о сопротивлении слива.',
              'Filter-fit adjustment is a starting hypothesis about flow resistance.')
    if material and material['id'] in ('glass', 'metal'):
        apply('material_heat', COEFFICIENTS['high_mass'],
              'Стекло или металл могут забирать тепло; прогрейте воронку.',
              'Glass or metal may absorb heat; preheat the brewer.')
    if filter_item and filter_item['flow_class'] == 'slow':
        apply('dense_filter', COEFFICIENTS['dense_filter'],
              'Плотный фильтр может замедлить слив.', 'A dense filter may slow the drawdown.')
    tds = params.get('water_tds_ppm')
    if tds is not None and tds < COEFFICIENTS['low_tds_below_ppm']:
        apply('low_tds', COEFFICIENTS['low_tds'],
              'Мягкая вода: пробуем чуть мельче.', 'Low-TDS water: try a little finer.')
    if tds is not None and tds > COEFFICIENTS['high_tds_above_ppm']:
        apply('high_tds', COEFFICIENTS['high_tds'],
              'Высокий TDS: пробуем чуть грубее.', 'High-TDS water: try a little coarser.')
    if device['method'] in ('immersion', 'hybrid'):
        apply('immersion', {k: v for k, v in COEFFICIENTS['immersion'].items() if k != 'duration_seconds'},
              'Для иммерсии нужен иной помол и контакт.', 'Immersion needs a different grind and contact.')
        base['duration_seconds'] = COEFFICIENTS['immersion_seconds'][device['id']]
        reasons.append(_reason('duration_seconds', 'immersion_time', 'Время настаивания для устройства.',
                               'Steep time for this device.'))
    if device['method'] == 'automatic_drip':
        apply('automatic', {k: v for k, v in COEFFICIENTS['automatic'].items() if k != 'duration_seconds'},
              'Стартовая настройка для капельной кофеварки.', 'Automatic drip starting point.')
        base['duration_seconds'] = COEFFICIENTS['automatic']['duration_seconds']
    deep_bed = height is not None and height >= COEFFICIENTS['deep_bed_mm']
    gentle_processing = (processing is not None and
                         (processing['family'] in ('natural', 'experimental') or
                          processing['id'] == 'washed_anaerobic'))
    gentle = deep_bed or gentle_processing
    if deep_bed:
        reasons.append(_reason('steps', 'deep_bed', 'Высокий слой: тонкая струя ближе к центру.',
                               'Deep bed: gentler central pour.'))
    if gentle_processing:
        reasons.append(_reason('steps', 'gentle_processing',
                               'Для этой обработки пробуем мягкое вливание.',
                               'Try gentler pouring for this processing style.'))
    if grinder is None:
        assumptions.append('Кофемолка не выбрана: настройка шкалы не рассчитана.')
    variants = []
    for variant_id, name, summary in (
        ('brighter', 'Ярче', 'Выше прозрачность и кислотность.'),
        ('sweeter', 'Слаще', 'Плотнее тело и длиннее контакт.'),
    ):
        shift = COEFFICIENTS['variants'][variant_id]
        target_ratio = _clamp(water / dose + shift['ratio'], 'ratio')
        variant_water = round(_clamp(dose * target_ratio, 'water_g'))
        particle = round(_clamp(base['particle_microns'] + shift['particle_microns'], 'particle_microns'))
        reference = _clamp(base['reference_dial'] + shift['reference_dial'], 'reference_dial')
        temperature = round(_clamp(base['temperature_c'], 'temperature_c'))
        duration = round(_clamp(base['duration_seconds'] + shift.get('duration_seconds', 0), 'duration_seconds'))
        pours = (max(COEFFICIENTS['pour']['min_count'],
                     min(COEFFICIENTS['pour']['max_count'], round(base['pours'] + shift['pours'])))
                 if device['method'] == 'percolation' else 0)
        if device['method'] == 'percolation':
            steps = _pour_steps(variant_water, dose, pours, duration, base['bloom_multiplier'],
                                base['bloom_wait_seconds'], gentle)
        elif device['method'] in ('immersion', 'hybrid'):
            steps = _immersion_steps(variant_water, duration, device['id'])
        else:
            steps = []
        grind = _settings(grinder, reference)
        grind.update({'target_particle_microns': particle, 'microns': particle})
        variant_reasons = deepcopy(reasons)
        for key, delta in shift.items():
            variant_reasons.append(_reason(key, f'variant_{variant_id}',
                                           'Сдвиг ради выбранного вкусового акцента.',
                                           'Shift for the chosen taste goal.', delta))
        variant_reasons.append(_reason('grind', 'nominal_target',
                                       'Размер частиц — условная цель, не измеренная медиана.',
                                       'Particle size is a nominal target, not a measured median.'))
        variant_reasons.append(_reason('grind.setting', 'comparison_table' if grind['setting'] else 'no_calibration',
                                       'Настройка шкалы ориентировочная; точного перевода из микронов нет.',
                                       'Grinder setting is approximate; no calibrated micron conversion exists.'))
        chips = [row['name_ru'] for row in (country, processing, device) if row]
        chips.append({'light': 'Светлая', 'medium': 'Средняя', 'dark': 'Тёмная'}[roast])
        result = {
            'schema_version': 1, 'catalog_schema_version': 1,
            'origin': 'calculated', 'engine_version': COEFFICIENTS['version'],
            'id': variant_id, 'name': name, 'summary': summary, 'device_id': device['id'],
            'grinder_id': grinder['id'] if grinder else None,
            'method': device['method'], 'dose_g': dose, 'coffee_g': dose,
            'water_g': variant_water, 'ratio': _ratio(dose, variant_water),
            'temperature_c': temperature, 'grind': grind,
            'grind_setting': grind['setting'], 'total_seconds': duration,
            'duration_seconds': duration, 'steps': steps,
            'machine_compatible': device['method'] == 'percolation' and
                variant_water <= COEFFICIENTS['machine_water_max_g'] and duration <= 600 and temperature <= 99,
            'context_chips': chips, 'assumptions': list(assumptions), 'reasons': variant_reasons,
        }
        if device['method'] == 'automatic_drip':
            result['automatic_mode'] = 'standard'
        variants.append(result)
    return variants


def rescale(recipe, dose_g=None, water_g=None):
    """Copy a recipe and proportionally scale water amounts; keep its timing."""
    if not isinstance(recipe, dict) or recipe.get('origin') != 'calculated':
        raise BrewingInputError('recipe: expected a calculated recipe')
    old_dose = _number(recipe.get('dose_g'), 'recipe.dose_g', *COEFFICIENTS['bounds']['dose_g'])
    old_water = _number(recipe.get('water_g'), 'recipe.water_g', *COEFFICIENTS['bounds']['water_g'])
    if dose_g is None and water_g is None:
        return deepcopy(recipe)
    if dose_g is not None:
        _number(dose_g, 'dose_g', *COEFFICIENTS['bounds']['dose_g'])
        if dose_g != round(dose_g):
            raise BrewingInputError('dose_g must be whole grams')
    if water_g is not None:
        _number(water_g, 'water_g', *COEFFICIENTS['bounds']['water_g'])
        if water_g != round(water_g):
            raise BrewingInputError('water_g must be whole grams')
    dose = int(dose_g if dose_g is not None else round(old_dose * water_g / old_water))
    water = int(water_g if water_g is not None else round(old_water * dose_g / old_dose))
    _number(dose, 'dose_g', *COEFFICIENTS['bounds']['dose_g'])
    _number(water, 'water_g', *COEFFICIENTS['bounds']['water_g'])
    if not COEFFICIENTS['bounds']['ratio'][0] <= water / dose <= COEFFICIENTS['bounds']['ratio'][1]:
        raise BrewingInputError('dose_g/water_g: ratio must be 1:12–1:22')
    result = deepcopy(recipe)
    result.update({'dose_g': dose, 'coffee_g': dose, 'water_g': water, 'ratio': _ratio(dose, water)})
    steps = result.get('steps')
    if not isinstance(steps, list):
        raise BrewingInputError('recipe.steps: expected a list')
    if not isinstance(result.get('reasons'), list):
        raise BrewingInputError('recipe.reasons: expected a list')
    if any(not isinstance(step, dict) for step in steps):
        raise BrewingInputError('recipe.steps: each step must be an object')
    pour_indexes = [i for i, step in enumerate(steps) if step.get('kind') in ('pour', 'fill')]
    if steps and not pour_indexes:
        raise BrewingInputError('recipe.steps: no water-bearing step')
    cumulative = 0
    for index, step in enumerate(steps):
        if index in pour_indexes:
            if index == pour_indexes[-1]:
                amount = water - cumulative
            else:
                original_target = step.get('total_water_g')
                _number(original_target, 'recipe.steps.total_water_g', 0, old_water)
                amount = round(water * original_target / old_water) - cumulative
            if amount <= 0:
                raise BrewingInputError('recipe.steps: cannot scale pours to zero')
            cumulative += amount
        else:
            amount = 0
        step.update({'water_g': amount, 'pour_g': amount, 'total_water_g': cumulative})
        if step.get('kind') == 'pour':
            span = step['stop_seconds'] - step['start_seconds']
            step['pour_rate_g_s'] = round(amount / span, 2) if span > 0 else None
    result['machine_compatible'] = (result['method'] == 'percolation' and
                                    water <= COEFFICIENTS['machine_water_max_g'] and
                                    result['temperature_c'] <= 99 and result['duration_seconds'] <= 600)
    result['reasons'].append(_reason('dose_g/water_g', 'rescale',
                                     'Вода пересчитана пропорционально; время оставлено стартовым ориентиром.',
                                     'Water scaled proportionally; timing remains a starting point.'))
    return result


# Taste descriptors in the order and columns of the result form.
_TASTE_COLUMNS = (
    ('acidity_sweetness', ('sour', 'sharp', 'flat', 'sweet', 'balanced')),
    ('body_strength', ('watery', 'hollow', 'syrupy', 'heavy')),
    ('finish_clarity', ('bitter', 'dry', 'astringent', 'muddy', 'rough')),
)
_TASTE_GROUPS = {
    'under': {'sour', 'sharp', 'flat', 'hollow'},
    'over': {'bitter', 'dry', 'astringent', 'muddy', 'rough', 'heavy'},
    'weak': {'watery'},
    'heavy': {'syrupy'},
    'positive': {'sweet', 'balanced'},
}
_ALL_TASTES = set().union(*_TASTE_GROUPS.values())
_MAX_TASTES = 3
# A cup cannot be both thin and thick.
_BODY_CONFLICTS = {frozenset(('watery', 'syrupy')), frozenset(('watery', 'heavy'))}
assert _ALL_TASTES == {item for _, items in _TASTE_COLUMNS for item in items}


def _tastes_conflict(first, second):
    """Two descriptors that cannot describe one cup or would pull the fix both ways."""
    pair = {first, second}
    if first == second:
        return False
    return ('balanced' in pair or
            bool(pair & _TASTE_GROUPS['under']) and bool(pair & _TASTE_GROUPS['over']) or
            bool(pair & _TASTE_GROUPS['under']) and 'sweet' in pair or
            frozenset(pair) in _BODY_CONFLICTS)


def taste_options():
    """Columns, limit and pairwise conflicts the form uses to switch options off."""
    ids = [item for _, items in _TASTE_COLUMNS for item in items]
    return {'max_selected': _MAX_TASTES,
            'columns': [{'id': column, 'descriptors': list(items)} for column, items in _TASTE_COLUMNS],
            'conflicts': {item: [other for other in ids if _tastes_conflict(item, other)] for item in ids}}


def _percent(value, digits, language):
    text = f'{value:.{digits}f}'
    return text.replace('.', ',') if language == 'ru' else text


def _feedback(feedback, recipe):
    """Read one feedback path; return the signal, a finer diagnosis code and the cup data."""
    if not isinstance(feedback, dict):
        raise BrewingInputError('feedback: expected an object')
    has_taste = 'descriptors' in feedback
    has_measurement = 'measurement' in feedback
    if has_taste == has_measurement or set(feedback) - {'descriptors', 'measurement'}:
        raise BrewingInputError('feedback: supply descriptors or measurement, not both')
    if has_taste:
        tastes = feedback['descriptors']
        if (not isinstance(tastes, list) or not 1 <= len(tastes) <= _MAX_TASTES or
                any(not isinstance(item, str) or item not in _ALL_TASTES for item in tastes) or
                len(set(tastes)) != len(tastes)):
            raise BrewingInputError('descriptors: choose 1–3 distinct known tastes')
        selected = set(tastes)
        if any(_tastes_conflict(a, b) for a, b in combinations(sorted(selected), 2)):
            raise BrewingInputError('descriptors: contradictory tastes')
        if selected & _TASTE_GROUPS['under']:
            signal = code = 'under'
        elif selected & _TASTE_GROUPS['over']:
            signal = code = 'over'
        elif 'sweet' in selected and 'watery' in selected:
            signal = code = 'weak_after_sweet'
        elif 'sweet' in selected and 'syrupy' in selected:
            signal = code = 'heavy_after_sweet'
        else:
            # Strength alone says nothing about extraction: wait for sweetness.
            signal = 'hold'
            code = 'on_target' if selected & _TASTE_GROUPS['positive'] else 'strength_needs_sweetness'
        return {'kind': 'taste', 'signal': signal, 'code': code, 'extraction': None,
                'tds': None, 'strength': None}
    measurement = feedback['measurement']
    if not isinstance(measurement, dict) or set(measurement) != {
            'beverage_tds_percent', 'beverage_g', 'dose_g', 'drawdown_seconds'}:
        raise BrewingInputError('measurement: expected beverage TDS, yield, dose and drawdown')
    tds = _number(measurement['beverage_tds_percent'], 'beverage_tds_percent', 0.1, 5)
    beverage = _number(measurement['beverage_g'], 'beverage_g', 1, recipe['water_g'])
    dose = _number(measurement['dose_g'], 'measurement.dose_g', *COEFFICIENTS['bounds']['dose_g'])
    _number(measurement['drawdown_seconds'], 'drawdown_seconds', 1, 1200)
    if abs(dose - recipe['dose_g']) > 0.1:
        raise BrewingInputError('measurement.dose_g: must match the brewed recipe')
    extraction = round(beverage * tds / dose, 2)
    _number(extraction, 'extraction_percent', 0, 100)
    rule = COEFFICIENTS['adjustment']
    strength = ('weak' if tds < rule['balanced_tds_min_percent'] else
                'strong' if tds > rule['balanced_tds_max_percent'] else 'on_target')
    if extraction < rule['balanced_extraction_min_percent']:
        signal = code = 'under'
    elif extraction > rule['balanced_extraction_max_percent']:
        signal = code = 'over'
    else:
        # A measurement cannot confirm sweetness, so concentration stays as it is.
        signal = 'hold'
        code = 'on_target' if strength == 'on_target' else 'strength_needs_sweetness'
    return {'kind': 'measured', 'signal': signal, 'code': code, 'extraction': extraction,
            'tds': round(tds, 2), 'strength': strength}


_DIAGNOSES = {
    'under': ('Нужно больше раскрытия', 'Draw out more flavor'),
    'over': ('Нужно извлекать мягче', 'Extract more gently'),
    'weak_after_sweet': ('Добавим плотности', 'Add some body'),
    'heavy_after_sweet': ('Сделаем чашку легче', 'Lighten the cup'),
    'on_target': ('Рецепт в ориентире', 'The recipe is on target'),
    'strength_needs_sweetness': ('Сначала сладость, потом крепость', 'Sweetness first, then strength'),
}
DIAGNOSIS_CODES = tuple(_DIAGNOSES)
_TASTE_EXPLANATIONS = {
    'under': ('Кислинка без сладости, резкость или пустая середина обычно значат, что вода '
              'забрала из кофе слишком мало. Делаем воду горячее и помол мельче, чтобы вкус '
              'раскрылся полнее.',
              'Sourness without sweetness, sharpness or a hollow middle usually mean the water '
              'took too little from the coffee. Hotter water and a finer grind let more flavor through.'),
    'over': ('Горечь, сухость, терпкость или тяжесть часто появляются, когда вода вытягивает '
             'лишнее. Делаем воду прохладнее и помол грубее.',
             'Bitterness, dryness, astringency or heaviness often appear when the water pulls out '
             'too much. Cooler water and a coarser grind hold it back.'),
    'weak_after_sweet': ('Сладость уже есть — значит, с экстракцией порядок. Чтобы чашка стала '
                         'плотнее, уменьшаем воду при той же дозе кофе.',
                         'Sweetness is already there, so extraction is fine. For more body, '
                         'use less water with the same dose.'),
    'heavy_after_sweet': ('Сладость есть, но чашка слишком плотная. Добавляем немного воды '
                          'при той же дозе кофе.',
                          'Sweetness is there, but the cup is too dense. Add a little water '
                          'with the same dose.'),
    'on_target': ('Сладость и баланс на месте. Ничего не меняем: заварите так же ещё раз и '
                  'сравните — если вкус повторится, это ваш рецепт.',
                  'Sweetness and balance are in place. Change nothing: brew it again and '
                  'compare. If the taste repeats, this is your recipe.'),
    'strength_needs_sweetness': ('Крепость меняем только после того, как появилась сладость, '
                                 'иначе легко спрятать недоэкстракцию. Параметры не трогаем: '
                                 'заварите ещё раз и отметьте, есть ли сладость.',
                                 'Strength changes only once sweetness shows up; otherwise it is '
                                 'easy to hide under-extraction. Parameters stay: brew again and '
                                 'note whether the cup is sweet.'),
}
_CHANGE_WHY = {
    ('temperature_c', 1): ('Горячая вода извлекает быстрее.', 'Hotter water extracts faster.'),
    ('temperature_c', -1): ('Более прохладная вода извлекает мягче.', 'Cooler water extracts more gently.'),
    ('grind', 1): ('Мельче помол открывает больше поверхности кофе.',
                   'A finer grind exposes more of the coffee to water.'),
    ('grind', -1): ('Грубее помол открывает меньше поверхности кофе.',
                    'A coarser grind exposes less of the coffee to water.'),
    ('water_g', -1): ('Меньше воды на ту же дозу — плотнее чашка.',
                      'Less water for the same dose makes a denser cup.'),
    ('water_g', 1): ('Больше воды на ту же дозу — легче чашка.',
                     'More water for the same dose makes a lighter cup.'),
}


def _measured_explanation(cup):
    rule = COEFFICIENTS['adjustment']
    texts = []
    for language in ('ru', 'en'):
        ey = _percent(cup['extraction'], 1, language)
        tds = _percent(cup['tds'], 2, language)
        low_ey, high_ey = rule['balanced_extraction_min_percent'], rule['balanced_extraction_max_percent']
        low_tds = _percent(rule['balanced_tds_min_percent'], 2, language)
        high_tds = _percent(rule['balanced_tds_max_percent'], 2, language)
        ru = language == 'ru'
        if cup['code'] == 'under':
            text = (f'Экстракция {ey} % — ниже ориентира {low_ey}–{high_ey} %: вода забрала из кофе '
                    'мало. Пробуем горячее и мельче.' if ru else
                    f'Extraction {ey}% is below the {low_ey}–{high_ey}% reference: the water took too '
                    'little. Try hotter and finer.')
        elif cup['code'] == 'over':
            text = (f'Экстракция {ey} % — выше ориентира {low_ey}–{high_ey} %: вода вытянула лишнее. '
                    'Пробуем прохладнее и грубее.' if ru else
                    f'Extraction {ey}% is above the {low_ey}–{high_ey}% reference: the water pulled out '
                    'too much. Try cooler and coarser.')
        elif cup['code'] == 'on_target':
            text = (f'Экстракция {ey} % и крепость {tds} % — в ориентирах SCA. Это не гарантия вкуса: '
                    'если чашка нравится, оставьте рецепт.' if ru else
                    f'Extraction {ey}% and strength {tds}% are within the SCA reference. That is no '
                    'guarantee of taste: if you like the cup, keep the recipe.')
        elif cup['strength'] == 'weak':
            text = (f'Экстракция {ey} % в ориентире, а крепость {tds} % ниже {low_tds} %. Крепче делаем '
                    'только при сладости: если чашка сладкая, но водянистая, отметьте это во вкусовой '
                    'оценке.' if ru else
                    f'Extraction {ey}% is on target, but strength {tds}% is below {low_tds}%. We only make '
                    'the cup stronger once it is sweet: if it tastes sweet but watery, say so in the '
                    'taste rating.')
        else:
            text = (f'Экстракция {ey} % в ориентире, а крепость {tds} % выше {high_tds} %. Если чашка '
                    'сладкая, но тяжёлая, отметьте это во вкусовой оценке — тогда добавим воды.' if ru else
                    f'Extraction {ey}% is on target, but strength {tds}% is above {high_tds}%. If the cup '
                    'is sweet but heavy, say so in the taste rating and we will add water.')
        texts.append(text)
    return tuple(texts)


def _ratio_segment(slope, low, high):
    """Clip the line TDS = slope × extraction to the chart; None when it misses the chart."""
    chart = COEFFICIENTS['chart']
    x_low, x_high = chart['extraction_percent']
    y_low, y_high = chart['tds_percent']
    start = max(x_low, low, y_low / slope)
    stop = min(x_high, high, y_high / slope)
    if start >= stop:
        return None
    return [[round(start, 2), round(start * slope, 3)], [round(stop, 2), round(stop * slope, 3)]]


def extraction_chart(recipe, cup=None):
    """Geometry of the extraction/strength chart for one brewed recipe.

    Ratio diagonals are TDS = extraction × dose / (water − retained × dose).
    A taste estimate is a stretch of the recipe's own diagonal, never a point.
    """
    chart = COEFFICIENTS['chart']
    rule = COEFFICIENTS['adjustment']
    retained = chart['retained_water_g_per_g']
    low_ratio, high_ratio = chart['ratios']
    lines = []
    for ratio in range(low_ratio, high_ratio + 1):
        segment = _ratio_segment(1 / (ratio - retained), *chart['extraction_percent'])
        if segment:
            lines.append({'ratio': ratio, 'points': segment})
    dose, water = recipe['dose_g'], recipe['water_g']
    slope = dose / (water - retained * dose)
    result = {
        'extraction_axis': list(chart['extraction_percent']),
        'tds_axis': list(chart['tds_percent']),
        'balanced': {'extraction': [rule['balanced_extraction_min_percent'],
                                    rule['balanced_extraction_max_percent']],
                     'tds': [rule['balanced_tds_min_percent'], rule['balanced_tds_max_percent']]},
        'retained_water_g_per_g': retained,
        'accuracy': 'approximate',
        'ratio_lines': lines,
        'recipe_line': {'ratio': recipe['ratio'], 'points': _ratio_segment(slope, *chart['extraction_percent'])},
        'cup': None,
    }
    if cup and cup['kind'] == 'measured':
        x_low, x_high = chart['extraction_percent']
        y_low, y_high = chart['tds_percent']
        result['cup'] = {'kind': 'measured', 'extraction_percent': cup['extraction'],
                         'tds_percent': cup['tds'],
                         'inside': x_low <= cup['extraction'] <= x_high and y_low <= cup['tds'] <= y_high}
    elif cup:
        low, high = chart['taste_extraction_bands'][cup['code']]
        result['cup'] = {'kind': 'estimate', 'extraction_range': [low, high],
                         'points': _ratio_segment(slope, low, high)}
    return result


_ROASTER_ID = 'roaster'
_ROASTER_WHY = 'Шаг из рецепта обжарщика.'
# 'champion': a published champion recipe with attribution, rated the same unchanged way.
_ROASTER_KINDS = {'catalog', 'catalog_match', 'closest_reference', 'suggested_baseline', 'champion'}
_ROASTER_URL = re.compile(r'https://theweldercatherine\.ru/catalog/[\w\-./%]{1,250}')


def _text(value, name, limit):
    """Optional short single-line text from a source; never interpreted, only shown."""
    if value is None or value == '':
        return None
    if not isinstance(value, str) or len(value) > limit or any(ord(char) < 32 for char in value):
        raise BrewingInputError(f'{name}: expected text up to {limit} characters')
    return value.strip() or None


def _roaster_source(source):
    if not isinstance(source, dict) or set(source) - {'name', 'url', 'kind'}:
        raise BrewingInputError('source: expected name, url and kind')
    name = _text(source.get('name'), 'source.name', 180)
    url = source.get('url')
    if not name or source.get('kind') not in _ROASTER_KINDS or (
            url is not None and (not isinstance(url, str) or not _ROASTER_URL.fullmatch(url))):
        raise BrewingInputError('source: expected the roaster recipe it came from')
    return {'name': name, 'url': url, 'kind': source['kind']}


def _roaster_setting(source_setting, grinder_label, offset):
    """The roaster's setting moved by whole steps; None when it is not a plain number."""
    if offset == 0 or source_setting is None:
        return source_setting
    if not re.fullmatch(r'\d{1,3}(?:[.,]\d{1,2})?', source_setting):
        return None
    rule = COEFFICIENTS['roaster']
    step = next((size for key, size in rule['grind_step'].items() if key in (grinder_label or '').lower()),
                rule['grind_default_step'])
    value = float(source_setting.replace(',', '.')) + offset * step
    if value <= 0:
        return None
    decimals = max(len(source_setting.replace(',', '.').partition('.')[2]), 1 if step % 1 else 0)
    return f'{value:.{decimals}f}'


def _validate_roaster_grind(recipe):
    grind = recipe['grind']
    if grind.get('basis') != 'roaster' or recipe.get('grinder_id') is not None:
        raise BrewingInputError('recipe.grind: expected the roaster setting')
    label = _text(grind.get('grinder_label'), 'recipe.grind.grinder_label', 120)
    source_setting = _text(grind.get('source_setting'), 'recipe.grind.source_setting', 40)
    offset = grind.get('steps_from_source')
    limit = COEFFICIENTS['roaster']['grind_max_steps']
    if not isinstance(offset, int) or isinstance(offset, bool) or not -limit <= offset <= limit:
        raise BrewingInputError('recipe.grind.steps_from_source: expected a small whole number')
    setting = _roaster_setting(source_setting, label, offset)
    if grind.get('setting') != setting or recipe.get('grind_setting') != setting:
        raise BrewingInputError('recipe.grind: inconsistent setting')
    return label, source_setting, offset


def validate_calculated_recipe(recipe):
    """Reject malformed calculated recipes before accepting client-side edits."""
    if (not isinstance(recipe, dict) or recipe.get('origin') != 'calculated' or
            recipe.get('schema_version') != 1 or recipe.get('catalog_schema_version') != 1 or
            recipe.get('engine_version') not in COEFFICIENTS['compatible_versions'] or
            not isinstance(recipe.get('id'), str) or
            recipe['id'] not in (*COEFFICIENTS['variants'], _ROASTER_ID) or
            (recipe['id'] == _ROASTER_ID) != (recipe.get('basis') == 'roaster')):
        raise BrewingInputError('recipe: expected a current calculated recipe')
    roaster = recipe['id'] == _ROASTER_ID
    if roaster:
        _roaster_source(recipe.get('source'))
        _text(recipe.get('device_label'), 'recipe.device_label', 120)
    revision = recipe.get('revision', 0)
    if not isinstance(revision, int) or isinstance(revision, bool) or not 0 <= revision <= 1000:
        raise BrewingInputError('recipe.revision: expected a whole number')
    device = _choice(recipe.get('device_id'), 'devices', 'recipe.device_id')
    if device is None or recipe.get('method') != device['method']:
        raise BrewingInputError('recipe: device and method disagree')
    dose = _number(recipe.get('dose_g'), 'recipe.dose_g', *COEFFICIENTS['bounds']['dose_g'])
    water = _number(recipe.get('water_g'), 'recipe.water_g', *COEFFICIENTS['bounds']['water_g'])
    temperature = _number(recipe.get('temperature_c'), 'recipe.temperature_c',
                          *COEFFICIENTS['bounds']['temperature_c'])
    duration = _number(recipe.get('duration_seconds'), 'recipe.duration_seconds',
                       *COEFFICIENTS['bounds']['duration_seconds'])
    if (recipe.get('coffee_g') != dose or recipe.get('total_seconds') != duration or
            recipe.get('ratio') != _ratio(dose, water) or
            not isinstance(recipe.get('reasons'), list)):
        raise BrewingInputError('recipe: inconsistent dose, duration, ratio or reasons')
    grind = recipe.get('grind')
    if not isinstance(grind, dict):
        raise BrewingInputError('recipe.grind: expected an object')
    particle = reference = grinder = None
    if roaster:
        # The roaster's grinder setting has no particle target; corrections move it in steps.
        _validate_roaster_grind(recipe)
    else:
        particle = _number(grind.get('target_particle_microns'), 'recipe.grind.target_particle_microns',
                           *COEFFICIENTS['bounds']['particle_microns'])
        if grind.get('microns') != particle:
            raise BrewingInputError('recipe.grind: inconsistent particle target')
        grinder = _choice(recipe.get('grinder_id'), 'grinders', 'recipe.grinder_id')
        if grinder:
            reference = _number(grind.get('reference_ek43_dial'), 'recipe.grind.reference_ek43_dial',
                                *COEFFICIENTS['bounds']['reference_dial'])
            if recipe.get('grind_setting') != grind.get('setting'):
                raise BrewingInputError('recipe.grind: inconsistent setting')
        elif grind.get('setting') is not None or recipe.get('grind_setting') is not None:
            raise BrewingInputError('recipe.grind: setting needs a grinder')
    steps = recipe.get('steps')
    if not isinstance(steps, list):
        raise BrewingInputError('recipe.steps: expected a list')
    if device['method'] == 'automatic_drip':
        if steps:
            raise BrewingInputError('recipe.steps: automatic drip has no manual steps')
    else:
        expected = ({'pour'} if device['method'] == 'percolation' else
                    {'fill', 'steep', 'press', 'drain'})
        if not steps or len(steps) > 12:
            raise BrewingInputError('recipe.steps: expected 1–12 steps')
        cumulative, previous_stop = 0, 0
        for index, step in enumerate(steps):
            if not isinstance(step, dict) or step.get('kind') not in expected:
                raise BrewingInputError('recipe.steps: invalid step')
            if roaster and (not _text(step.get('instruction'), 'recipe.steps.instruction', 80) or
                            step.get('why') != _ROASTER_WHY):
                raise BrewingInputError('recipe.steps: invalid roaster step')
            start = _number(step.get('start_seconds'), 'recipe.steps.start_seconds', 0, duration)
            stop = _number(step.get('stop_seconds'), 'recipe.steps.stop_seconds', 0, duration)
            amount = _number(step.get('water_g'), 'recipe.steps.water_g', 0, water)
            if start < previous_stop or stop <= start or step.get('pour_g') != amount:
                raise BrewingInputError('recipe.steps: overlapping times or inconsistent water')
            if device['method'] == 'percolation' and amount <= 0:
                raise BrewingInputError('recipe.steps: pour must add water')
            if device['method'] in ('immersion', 'hybrid') and amount != (water if index == 0 else 0):
                raise BrewingInputError('recipe.steps: immersion adds water only in fill')
            cumulative += amount
            if step.get('total_water_g') != cumulative:
                raise BrewingInputError('recipe.steps: cumulative water is inconsistent')
            previous_stop = stop
        if cumulative != water:
            raise BrewingInputError('recipe.steps: total water is inconsistent')
        if device['method'] in ('immersion', 'hybrid') and (
                len(steps) != 3 or [step['kind'] for step in steps[:2]] != ['fill', 'steep'] or
                steps[2]['kind'] not in ('press', 'drain')):
            raise BrewingInputError('recipe.steps: expected fill, steep and finish')
    return dose, water, temperature, particle, reference, grinder


def adjust(recipe, feedback):
    """One conservative correction from taste or measured extraction.

    Changes at most two parameters, never estimates TDS/extraction from taste
    and never changes concentration before the user has reported sweetness.
    """
    dose, water, temperature, particle, reference, grinder = validate_calculated_recipe(recipe)
    cup = _feedback(feedback, recipe)
    signal, code = cup['signal'], cup['code']
    corrected = deepcopy(recipe)
    changes = []
    rule = COEFFICIENTS['adjustment']
    diagnosis = _DIAGNOSES[code]
    explanation = _measured_explanation(cup) if cup['kind'] == 'measured' else _TASTE_EXPLANATIONS[code]

    def change(parameter, direction, before, after, **extra):
        why = _CHANGE_WHY[(parameter, direction)]
        changes.append({'parameter': parameter, 'before': before, 'after': after,
                        'why': why[0], 'why_en': why[1], **extra})
        corrected['reasons'].append(_reason(parameter, f'feedback_{code}', why[0], why[1]))

    if signal in ('under', 'over'):
        direction = 1 if signal == 'under' else -1
        new_temp = round(_clamp(temperature + direction * rule['temperature_step_c'], 'temperature_c'))
        if new_temp != temperature:
            corrected['temperature_c'] = new_temp
            change('temperature_c', direction, temperature, new_temp, unit='°C')
        if recipe['id'] == _ROASTER_ID:
            label, source_setting, offset = _validate_roaster_grind(recipe)
            limit = COEFFICIENTS['roaster']['grind_max_steps']
            new_offset = max(-limit, min(limit, offset - direction))
            if new_offset != offset:
                setting = _roaster_setting(source_setting, label, new_offset)
                corrected['grind'].update(steps_from_source=new_offset, setting=setting)
                corrected['grind_setting'] = setting
                change('grind', direction, offset, new_offset, unit='steps', basis='roaster',
                       before_setting=recipe['grind'].get('setting'), after_setting=setting,
                       source_setting=source_setting, grinder_label=label)
            new_particle = particle
        else:
            new_particle = round(_clamp(particle - direction * rule['particle_step_microns'], 'particle_microns'))
        if new_particle != particle:
            corrected['grind']['target_particle_microns'] = new_particle
            corrected['grind']['microns'] = new_particle
            if reference is not None:
                new_reference = _clamp(reference - direction * rule['reference_step'], 'reference_dial')
                corrected['grind'].update(_settings(grinder, new_reference))
                corrected['grind_setting'] = corrected['grind']['setting']
            change('grind', direction, particle, new_particle, unit='µm',
                   before_setting=recipe['grind'].get('setting'),
                   after_setting=corrected['grind'].get('setting'),
                   scale_label=corrected['grind'].get('scale_label'),
                   scale_label_en=corrected['grind'].get('scale_label_en'))
    elif signal in ('weak_after_sweet', 'heavy_after_sweet'):
        direction = -1 if signal == 'weak_after_sweet' else 1
        new_water = round(_clamp(dose * _clamp(water / dose + direction * rule['water_ratio_step'], 'ratio'), 'water_g'))
        if new_water != water:
            corrected = rescale(corrected, dose_g=dose, water_g=new_water)
            change('water_g', direction, water, new_water, unit='g',
                   ratio_before=recipe['ratio'], ratio_after=corrected['ratio'])
    if changes:
        corrected['engine_version'] = COEFFICIENTS['version']
        corrected['revision'] = recipe.get('revision', 0) + 1
        corrected.pop('edited', None)
        corrected['reasons'].append(_reason('adjustment', f'feedback_{code}',
                                             diagnosis[0] + ': меняем не больше двух параметров.',
                                             diagnosis[1] + ': change at most two parameters.'))
    return {'recipe': corrected, 'diagnosis': diagnosis[0], 'diagnosis_en': diagnosis[1],
            'diagnosis_code': code, 'explanation': explanation[0], 'explanation_en': explanation[1],
            'changes': changes, 'at_limit': signal != 'hold' and not changes,
            'feedback_signal': signal, 'extraction_percent': cup['extraction'],
            'tds_percent': cup['tds'], 'strength': cup['strength'],
            'measurement_kind': 'measured' if cup['kind'] == 'measured' else 'taste_only',
            'chart': extraction_chart(recipe, cup)}


_VARIANT_TEXTS = {'brighter': ('Ярче', 'Выше прозрачность и кислотность.'),
                  'sweeter': ('Слаще', 'Плотнее тело и длиннее контакт.')}


def _machine_compatible(recipe):
    return (recipe['method'] == 'percolation' and recipe['water_g'] <= COEFFICIENTS['machine_water_max_g'] and
            recipe['duration_seconds'] <= 600 and recipe['temperature_c'] <= 99)


def restore_recipe(recipe):
    """Rebuild a shared or stored calculated recipe from its checked fields only.

    Unknown fields are dropped, the grinder setting is recomputed from the
    table and step texts must be the engine's own. Explanations do not travel
    with a link, so the restored recipe says so instead of inventing them.
    """
    dose, water, temperature, particle, reference, grinder = validate_calculated_recipe(recipe)
    roaster = recipe['id'] == _ROASTER_ID
    known_texts = set(_STEP_TEXTS.values())
    steps = []
    for step in recipe['steps']:
        if not roaster and (step.get('instruction'), step.get('why')) not in known_texts:
            raise BrewingInputError('recipe.steps: unknown step text')
        clean = {key: step[key] for key in ('kind', 'start_seconds', 'stop_seconds', 'pour_g',
                                              'water_g', 'total_water_g', 'instruction', 'why')}
        if clean['kind'] == 'pour':
            clean['pour_rate_g_s'] = round(clean['pour_g'] / (clean['stop_seconds'] - clean['start_seconds']), 2)
        steps.append(clean)
    if roaster:
        label, source_setting, offset = _validate_roaster_grind(recipe)
        grind = {'basis': 'roaster', 'grinder_label': label, 'source_setting': source_setting,
                 'setting': _roaster_setting(source_setting, label, offset), 'steps_from_source': offset,
                 'target_particle_microns': None, 'microns': None, 'accuracy': 'approximate'}
    else:
        grind = _settings(grinder, reference)
        grind.update({'target_particle_microns': particle, 'microns': particle})
    edited = recipe.get('edited', False)
    if not isinstance(edited, bool):
        raise BrewingInputError('recipe.edited: expected true or false')
    source = _roaster_source(recipe['source']) if roaster else None
    name, summary = (source['name'], 'Рецепт обжарщика в формате для оценки и правки.') if roaster else _VARIANT_TEXTS[recipe['id']]
    result = {
        'schema_version': 1, 'catalog_schema_version': 1, 'origin': 'calculated',
        'engine_version': recipe['engine_version'], 'id': recipe['id'], 'name': name, 'summary': summary,
        'device_id': recipe['device_id'], 'grinder_id': grinder['id'] if grinder else None,
        'method': recipe['method'], 'dose_g': dose, 'coffee_g': dose, 'water_g': water,
        'ratio': recipe['ratio'], 'temperature_c': temperature, 'grind': grind,
        'grind_setting': grind['setting'], 'total_seconds': recipe['duration_seconds'],
        'duration_seconds': recipe['duration_seconds'], 'steps': steps,
        'context_chips': [], 'assumptions': ['Рецепт расчётный, не рецепт обжарщика.',
                                             'Помол — стартовый ориентир; подстройте по вкусу и сливу.'],
        'reasons': [_reason('recipe', 'restored',
                            'Рецепт получен по ссылке: объяснения исходных поправок не передаются.',
                            'Recipe opened from a link: the original explanations are not included.')],
    }
    if roaster:
        result.update(basis='roaster', source=source,
                      device_label=_text(recipe.get('device_label'), 'recipe.device_label', 120))
    result['machine_compatible'] = _machine_compatible(result)
    if recipe['method'] == 'automatic_drip':
        result['automatic_mode'] = 'standard'
    if recipe.get('revision'):
        result['revision'] = recipe['revision']
    if edited:
        result['edited'] = True
    return result


def adopt_roaster_recipe(recipe, source):
    """Put a roaster's pour-over recipe into the engine format without changing it.

    Only this copy can be rated and corrected; the roaster's own recipe stays
    as published. Incomplete or contradictory source data is refused, never filled.
    """
    if not isinstance(recipe, dict):
        raise BrewingInputError('recipe: expected an object')
    source = _roaster_source(source)
    bounds = COEFFICIENTS['bounds']
    dose = _number(recipe.get('coffee_g'), 'recipe.coffee_g', *bounds['dose_g'])
    water = _number(recipe.get('water_g'), 'recipe.water_g', *bounds['water_g'])
    temperature = _number(recipe.get('temperature_c'), 'recipe.temperature_c', *bounds['temperature_c'])
    duration = _number(recipe.get('duration_seconds'), 'recipe.duration_seconds', *bounds['duration_seconds'])
    raw_steps = recipe.get('steps')
    if not isinstance(raw_steps, list) or not 1 <= len(raw_steps) <= 12:
        raise BrewingInputError('recipe.steps: expected 1–12 pours')
    steps, cumulative, previous = [], 0, 0
    for step in raw_steps:
        if not isinstance(step, dict):
            raise BrewingInputError('recipe.steps: each step must be an object')
        amount = _number(step.get('water_g'), 'recipe.steps.water_g', 0.1, water)
        start = _number(step.get('start_seconds'), 'recipe.steps.start_seconds', 0, duration)
        stop = _number(step.get('stop_seconds'), 'recipe.steps.stop_seconds', 0, duration)
        if start < previous or stop <= start:
            raise BrewingInputError('recipe.steps: pour times overlap or are missing')
        cumulative += amount
        steps.append({'kind': 'pour', 'start_seconds': start, 'stop_seconds': stop,
                      'pour_g': amount, 'water_g': amount, 'total_water_g': cumulative,
                      'pour_rate_g_s': round(amount / (stop - start), 2),
                      'instruction': _text(step.get('instruction'), 'recipe.steps.instruction', 80) or 'Вливание',
                      'why': _ROASTER_WHY})
        previous = stop
    if abs(cumulative - water) > 0.01:
        raise BrewingInputError('recipe: the pours do not add up to the total water')
    water = cumulative
    device_label = _text(recipe.get('device'), 'recipe.device', 120)
    device = next((row for row in _CATALOG['devices'] if device_label and row['method'] == 'percolation' and
                   device_label.lower() in (row['name_ru'].lower(), row['name_en'].lower())), None)
    label = _text(recipe.get('grinder'), 'recipe.grinder', 120)
    setting = _text(recipe.get('grind_setting'), 'recipe.grind_setting', 40)
    result = {
        'schema_version': 1, 'catalog_schema_version': 1, 'origin': 'calculated', 'basis': 'roaster',
        'engine_version': COEFFICIENTS['version'], 'id': _ROASTER_ID, 'name': source['name'],
        'summary': 'Рецепт обжарщика в формате для оценки и правки.', 'source': source,
        'device_id': device['id'] if device else 'custom_dripper', 'device_label': device_label,
        'grinder_id': None, 'method': 'percolation', 'dose_g': dose, 'coffee_g': dose, 'water_g': water,
        'ratio': _ratio(dose, water), 'temperature_c': temperature,
        'grind': {'basis': 'roaster', 'grinder_label': label, 'source_setting': setting, 'setting': setting,
                  'steps_from_source': 0, 'target_particle_microns': None, 'microns': None,
                  'accuracy': 'approximate'},
        'grind_setting': setting, 'total_seconds': duration, 'duration_seconds': duration, 'steps': steps,
        'context_chips': [], 'assumptions': ['Помол обжарщика подобран под его кофемолку; на своей подстройте по вкусу.'],
        'reasons': [_reason('recipe', 'roaster_source', 'Параметры взяты из рецепта обжарщика без изменений.',
                            'Parameters are taken from the roaster recipe unchanged.')],
    }
    result['machine_compatible'] = _machine_compatible(result)
    return result


# Taste experiments: the same recipe twice, with exactly one parameter moved one step.
EXPERIMENT_PARAMETERS = ('grind', 'temperature', 'ratio')
_EXPERIMENT_TEXTS = {
    'finer': ('Во второй чашке помол на шаг мельче, всё остальное то же. {why}',
              'In the second cup the grind is one step finer; everything else is the same. {why}'),
    'coarser': ('Во второй чашке помол на шаг грубее, всё остальное то же. {why}',
                'In the second cup the grind is one step coarser; everything else is the same. {why}'),
    'hotter': ('Во второй чашке вода на {step} °C горячее, всё остальное то же. {why}',
               'In the second cup the water is {step} °C hotter; everything else is the same. {why}'),
    'cooler': ('Во второй чашке вода на {step} °C прохладнее, всё остальное то же. {why}',
               'In the second cup the water is {step} °C cooler; everything else is the same. {why}'),
    'less_water': ('Во второй чашке меньше воды на ту же дозу ({ratio}), всё остальное то же. {why}',
                   'In the second cup there is less water for the same dose ({ratio}); everything else is the same. {why}'),
    'more_water': ('Во второй чашке больше воды на ту же дозу ({ratio}), всё остальное то же. {why}',
                   'In the second cup there is more water for the same dose ({ratio}); everything else is the same. {why}'),
}
_EXPERIMENT_WHY = {'finer': ('grind', 1), 'coarser': ('grind', -1), 'hotter': ('temperature_c', 1),
                   'cooler': ('temperature_c', -1), 'less_water': ('water_g', -1), 'more_water': ('water_g', 1)}


def experiment_pair(recipe, parameter):
    """Two cups of one recipe that differ in exactly one parameter by one step.

    The first cup is the recipe as it is. The second moves the grind one step finer,
    the water 2 °C hotter or the ratio 0.5 denser, or the other way when the first
    direction is at its limit. Nothing else changes: dose, timing and step texts stay.
    """
    dose, water, temperature, particle, reference, grinder = validate_calculated_recipe(recipe)
    if parameter not in EXPERIMENT_PARAMETERS:
        raise BrewingInputError(f'parameter: expected one of {", ".join(EXPERIMENT_PARAMETERS)}')
    if recipe['method'] != 'percolation':
        raise BrewingInputError('recipe: experiments need a pour-over recipe')
    rule = COEFFICIENTS['adjustment']
    second = deepcopy(recipe)
    second.pop('edited', None)
    values = {}
    if parameter == 'temperature':
        low, high = COEFFICIENTS['bounds']['temperature_c']
        step = rule['temperature_step_c']
        change = 'hotter' if temperature + step <= high else 'cooler'
        second['temperature_c'] = round(temperature + (step if change == 'hotter' else -step))
        if not low <= second['temperature_c'] <= high:
            raise BrewingInputError('recipe.temperature_c: no room for an experiment')
        values['step'] = step
    elif parameter == 'grind' and recipe['id'] == _ROASTER_ID:
        label, source_setting, offset = _validate_roaster_grind(recipe)
        limit = COEFFICIENTS['roaster']['grind_max_steps']
        change = 'finer' if offset > -limit else 'coarser'
        new_offset = offset - 1 if change == 'finer' else offset + 1
        setting = _roaster_setting(source_setting, label, new_offset)
        second['grind'].update(steps_from_source=new_offset, setting=setting)
        second['grind_setting'] = setting
    elif parameter == 'grind':
        low, high = COEFFICIENTS['bounds']['particle_microns']
        step = rule['particle_step_microns']
        change = 'finer' if particle - step >= low else 'coarser'
        direction = 1 if change == 'finer' else -1
        second['grind']['target_particle_microns'] = second['grind']['microns'] = particle - direction * step
        if reference is not None:
            second['grind'].update(_settings(grinder, _clamp(reference - direction * rule['reference_step'], 'reference_dial')))
            second['grind_setting'] = second['grind']['setting']
    else:
        low, high = COEFFICIENTS['bounds']['ratio']
        step = rule['water_ratio_step']
        change = 'less_water' if water / dose - step >= low else 'more_water'
        target = round(_clamp(dose * (water / dose + (-step if change == 'less_water' else step)), 'water_g'))
        second = rescale(second, dose_g=dose, water_g=target)
        second['reasons'].pop()  # the rescale note; the experiment explains itself below
        values['ratio'] = f"{recipe['ratio']} → {second['ratio']}"
    why = _CHANGE_WHY[_EXPERIMENT_WHY[change]]
    ru, en = _EXPERIMENT_TEXTS[change]
    explanation = (ru.format(why=why[0], **values), en.format(why=why[1], **values))
    second['reasons'].append(_reason(parameter, f'experiment_{change}', explanation[0], explanation[1]))
    second['machine_compatible'] = _machine_compatible(second)
    validate_calculated_recipe(second)
    return {'parameter': parameter, 'change': change, 'recipes': [deepcopy(recipe), second],
            'explanation': explanation[0], 'explanation_en': explanation[1]}
