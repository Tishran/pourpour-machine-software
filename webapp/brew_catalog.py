"""Validated, versioned options for the future deterministic brewing engine.

No network access or implicit fallback: bad packaged data is a configuration error.
The roaster catalog and OCR vocabularies are deliberately separate.
"""

import json
import math
import re
from pathlib import Path
from urllib.parse import urlsplit


DATA_DIR = Path(__file__).with_name('data')
CATALOG_FILES = ('countries', 'processing', 'devices', 'grinders', 'filters', 'materials')
ID_RE = re.compile(r'[a-z0-9]+(?:_[a-z0-9]+)*\Z')
COUNTRY_RE = re.compile(r'[A-Z]{2}\Z')
METHODS = {'percolation', 'immersion', 'hybrid', 'automatic_drip'}
GEOMETRIES = {'cone', 'flat', 'none', 'machine', 'custom'}
FILTER_FITS = {'tight', 'good', 'loose', 'not_applicable', 'user_supplied'}


class CatalogError(ValueError):
    """A reference file is missing, malformed or internally inconsistent."""


def require(condition, where, message):
    if not condition:
        raise CatalogError(f'{where}: {message}')


def is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def number(value, where, *, minimum=None, maximum=None, integer=False):
    require(is_number(value) and (not integer or isinstance(value, int)), where, 'expected a finite number')
    if minimum is not None:
        require(value >= minimum, where, f'must be >= {minimum}')
    if maximum is not None:
        require(value <= maximum, where, f'must be <= {maximum}')


def nonempty(value, where):
    require(isinstance(value, str) and value == value.strip() and 0 < len(value) <= 120,
            where, 'expected a non-empty, trimmed string of at most 120 characters')


def fields(item, where, names):
    require(isinstance(item, dict), where, 'expected an object')
    missing = set(names) - set(item)
    require(not missing, where, f'missing fields: {", ".join(sorted(missing))}')


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise CatalogError(f'duplicate JSON key: {key}')
        result[key] = value
    return result


def read_json(path):
    try:
        require(path.stat().st_size <= 1_000_000, str(path), 'file is too large')
        return json.loads(path.read_text(encoding='utf-8'), object_pairs_hook=unique_object)
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise CatalogError(f'{path}: cannot read JSON: {exc}') from exc


def validate_names(item, where, *, country=False):
    fields(item, where, ('id', 'name_ru', 'name_en'))
    pattern = COUNTRY_RE if country else ID_RE
    require(isinstance(item['id'], str) and pattern.fullmatch(item['id']), where, 'invalid id')
    for key in ('name_ru', 'name_en'):
        nonempty(item[key], f'{where}.{key}')


def validate_simple(category, item, where):
    validate_names(item, where, country=category == 'countries')
    if category == 'processing':
        require(item.get('family') in {'washed', 'natural', 'honey', 'wet_hulled', 'experimental'},
                where, 'invalid processing family')
    elif category == 'filters':
        require(item.get('flow_class') in {'slow', 'medium', 'fast', 'variable'}, where, 'invalid flow class')
        require(item.get('accuracy') == 'approximate', where, 'filter accuracy must be approximate')
    elif category == 'materials':
        require(item.get('thermal_class') in {'low_mass', 'high_mass', 'variable'}, where, 'invalid thermal class')
        require(item.get('accuracy') == 'approximate', where, 'material accuracy must be approximate')


def validate_device(item, where):
    validate_names(item, where)
    fields(item, where, ('method', 'geometry', 'bed_depth_class', 'bed_height_mm_at_15g',
                         'filter_fit', 'default_pours', 'default_filter_id', 'default_material_id', 'accuracy'))
    method, geometry = item['method'], item['geometry']
    require(method in METHODS and geometry in GEOMETRIES, where, 'invalid method or geometry')
    require((method != 'automatic_drip' or geometry == 'machine') and
            (method != 'immersion' or geometry == 'none') and
            (method != 'percolation' or geometry in {'cone', 'flat', 'custom'}) and
            (method != 'hybrid' or geometry in {'cone', 'flat'}), where, 'method and geometry disagree')
    require(item['bed_depth_class'] in {'shallow', 'medium', 'deep', 'not_applicable', 'user_supplied'},
            where, 'invalid bed depth class')
    height = item['bed_height_mm_at_15g']
    if height is not None:
        number(height, f'{where}.bed_height_mm_at_15g', minimum=1, maximum=100)
    require(item['filter_fit'] in FILTER_FITS, where, 'invalid filter fit')
    number(item['default_pours'], f'{where}.default_pours', minimum=0, maximum=12, integer=True)
    require((item['default_pours'] == 0) == (method == 'automatic_drip'), where,
            'automatic brewers have no manual pours; other methods need at least one')
    for key in ('default_filter_id', 'default_material_id'):
        value = item[key]
        require(value is None or isinstance(value, str) and ID_RE.fullmatch(value), where, f'invalid {key}')
    require(item['accuracy'] in {'approximate', 'user_supplied'}, where, 'invalid accuracy')
    if item['id'] == 'custom_dripper':
        require(geometry == 'custom' and height is None and item['filter_fit'] == 'user_supplied' and
                item['default_material_id'] is None and item['accuracy'] == 'user_supplied',
                where, 'custom dripper must request measurements from the user')
    else:
        require(geometry != 'custom' and item['accuracy'] == 'approximate', where, 'invalid built-in device')


def validate_grinder(item, where):
    validate_names(item, where)
    fields(item, where, ('scale', 'burr_travel_microns_per_click', 'micron_kind', 'particle_calibration',
                         'clicks_per_particle_micron', 'starting_filter_range', 'accuracy', 'source_url'))
    scale = item['scale']
    fields(scale, f'{where}.scale', ('kind', 'label_ru', 'label_en', 'minimum', 'maximum',
                                    'clicks_per_revolution', 'zero_offset'))
    require(scale['kind'] in {'clicks_from_zero', 'dial'}, where, 'invalid grinder scale')
    nonempty(scale['label_ru'], f'{where}.scale.label_ru')
    nonempty(scale['label_en'], f'{where}.scale.label_en')
    number(scale['minimum'], f'{where}.scale.minimum', minimum=0)
    if scale['maximum'] is not None:
        number(scale['maximum'], f'{where}.scale.maximum', minimum=scale['minimum'])
    if scale['clicks_per_revolution'] is not None:
        number(scale['clicks_per_revolution'], f'{where}.scale.clicks_per_revolution',
               minimum=1, maximum=500, integer=True)
    number(scale['zero_offset'], f'{where}.scale.zero_offset', minimum=0, integer=True)
    travel = item['burr_travel_microns_per_click']
    if travel is not None:
        require(scale['kind'] == 'clicks_from_zero', where, 'burr travel requires a click scale')
        number(travel, f'{where}.burr_travel_microns_per_click', minimum=0.001, maximum=100)
    require(item['micron_kind'] == ('burr_travel' if travel is not None else None), where,
            'micron_kind must describe burr travel, never particle size')
    # A burr's axial movement is not the resulting particle-size distribution.
    require(item['particle_calibration'] is None and item['clicks_per_particle_micron'] is None,
            where, 'particle conversion requires a separately validated calibration schema')
    starting = item['starting_filter_range']
    if starting is not None:
        fields(starting, f'{where}.starting_filter_range', ('minimum', 'maximum'))
        number(starting['minimum'], f'{where}.starting_filter_range.minimum', minimum=scale['minimum'])
        number(starting['maximum'], f'{where}.starting_filter_range.maximum', minimum=starting['minimum'])
        if scale['maximum'] is not None:
            require(starting['maximum'] <= scale['maximum'], where, 'starting range exceeds the scale')
    require(item['accuracy'] == 'approximate', where, 'grinder settings must be approximate')
    source = item['source_url']
    require(isinstance(source, str) and urlsplit(source).scheme == 'https' and
            bool(urlsplit(source).hostname) and not urlsplit(source).username and
            not urlsplit(source).password, where, 'source_url must be an HTTPS page')


def validate_equivalences(data, grinders):
    where = 'grind_equivalences'
    fields(data, where, ('schema_version', 'source_file', 'reference_grinder',
                          'methodology', 'accuracy', 'unit', 'rows'))
    require(data['schema_version'] == 1, where, 'unsupported schema version')
    nonempty(data['source_file'], f'{where}.source_file')
    require(Path(data['source_file']).name == data['source_file'], where, 'source_file must be a filename')
    nonempty(data['reference_grinder'], f'{where}.reference_grinder')
    require(data['methodology'] == 'not_specified_in_source' and data['accuracy'] == 'approximate' and
            data['unit'] == 'manufacturer_setting_not_particle_microns', where, 'comparison must state its limits')
    require(isinstance(data['rows'], list) and data['rows'], where, 'rows must be nonempty')
    by_id = {item['id']: item for item in grinders}
    previous = -math.inf
    for index, row in enumerate(data['rows']):
        point = f'{where}.rows[{index}]'
        fields(row, point, ('reference_setting', 'settings'))
        number(row['reference_setting'], f'{point}.reference_setting', minimum=0)
        require(row['reference_setting'] > previous, point, 'reference settings must increase')
        previous = row['reference_setting']
        settings = row['settings']
        require(isinstance(settings, dict) and settings, point, 'settings must be nonempty')
        for grinder_id, interval in settings.items():
            require(grinder_id in by_id, point, f'unknown grinder: {grinder_id}')
            fields(interval, f'{point}.{grinder_id}', ('minimum', 'maximum'))
            grinder_scale = by_id[grinder_id]['scale']
            number(interval['minimum'], f'{point}.{grinder_id}.minimum', minimum=grinder_scale['minimum'])
            number(interval['maximum'], f'{point}.{grinder_id}.maximum', minimum=interval['minimum'])
            if grinder_scale['maximum'] is not None:
                require(interval['maximum'] <= grinder_scale['maximum'], point, 'setting exceeds grinder scale')


def load_catalog(data_dir=DATA_DIR):
    """Read all packaged JSON options and reject incomplete/inconsistent sets."""
    directory = Path(data_dir)
    catalog = {}
    for category in CATALOG_FILES:
        data = read_json(directory / f'{category}.json')
        where = category
        fields(data, where, ('schema_version', 'items'))
        require(data['schema_version'] == 1, where, 'unsupported schema version')
        require(isinstance(data['items'], list) and data['items'], where, 'items must be nonempty')
        seen = set()
        for index, item in enumerate(data['items']):
            point = f'{where}.items[{index}]'
            if category == 'devices':
                validate_device(item, point)
            elif category == 'grinders':
                validate_grinder(item, point)
            else:
                validate_simple(category, item, point)
            require(item['id'] not in seen, point, f'duplicate id: {item["id"]}')
            seen.add(item['id'])
        catalog[category] = data['items']

    filter_ids = {item['id'] for item in catalog['filters']}
    material_ids = {item['id'] for item in catalog['materials']}
    for device in catalog['devices']:
        for field, ids in (('default_filter_id', filter_ids), ('default_material_id', material_ids)):
            require(device[field] is None or device[field] in ids, f'devices.{device["id"]}',
                    f'unknown {field}: {device[field]}')
    equivalences = read_json(directory / 'grind_equivalences.json')
    validate_equivalences(equivalences, catalog['grinders'])
    catalog['grind_equivalences'] = equivalences
    return catalog
