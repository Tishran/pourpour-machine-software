"""Deterministic, approximate starting recipes; never a roaster's recipe.

The nominal particle target and the grinder comparison table are independent
heuristics. Burr travel per click is *not* a particle-size calibration.
"""

from copy import deepcopy
from datetime import date
import math

from brew_catalog import load_catalog


COEFFICIENTS = {
    'version': '2.0',
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
    if not isinstance(value, (float, int)) or isinstance(value, bool) or not math.isfinite(value):
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
        action = ('Смачиваем весь кофе' if i == 0 else
                  'Вливаем тонкой струёй ближе к центру' if gentle else 'Вливаем плавно по кругу')
        why = ('Даём газу выйти перед основными вливаниями.' if i == 0 else
               'Мягкая струя снижает турбулентность.' if gentle else
               'Равномерно поддерживаем уровень воды над слоем.')
        steps.append({'kind': 'pour', 'start_seconds': start, 'stop_seconds': stop,
                      'pour_g': amount, 'water_g': amount, 'total_water_g': cumulative,
                      'pour_rate_g_s': round(amount / (stop - start), 2),
                      'instruction': action, 'why': why})
    return steps


def _immersion_steps(water, duration, device_id):
    timing = COEFFICIENTS['immersion_timing']
    fill_stop = min(timing['fill_max_seconds'], duration // 5)
    drain_kind = 'press' if device_id in ('french_press', 'aeropress') else 'drain'
    return [
        {'kind': 'fill', 'start_seconds': 0, 'stop_seconds': fill_stop,
         'water_g': water, 'pour_g': water, 'total_water_g': water,
         'instruction': 'Заливаем весь кофе', 'why': 'Весь кофе настаивается одновременно.'},
        {'kind': 'steep', 'start_seconds': fill_stop, 'stop_seconds': duration - timing['drain_seconds'],
         'water_g': 0, 'pour_g': 0, 'total_water_g': water,
         'instruction': 'Настаиваем', 'why': 'Контакт воды с кофе раскрывает вкус.'},
        {'kind': drain_kind, 'start_seconds': duration - timing['drain_seconds'], 'stop_seconds': duration,
         'water_g': 0, 'pour_g': 0, 'total_water_g': water,
         'instruction': 'Отжимаем' if drain_kind == 'press' else 'Открываем слив',
         'why': 'Завершаем контакт воды с кофе.'},
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
            'schema_version': 1, 'origin': 'calculated', 'engine_version': COEFFICIENTS['version'],
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
