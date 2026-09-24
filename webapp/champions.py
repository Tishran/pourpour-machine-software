"""Champion recipes: a catalog the team fills in by hand, with attribution.

Nothing here is downloaded or invented. An incomplete record is an error, not
silently skipped. The parameters are in the roaster recipe format, so the engine's
adopt_roaster_recipe must accept them unchanged; that is also how they are rated.
"""

from pathlib import Path
from urllib.parse import urlsplit

from brew_catalog import DATA_DIR, fields, is_number, nonempty, read_json, require
from brewing_engine import BrewingInputError, adopt_roaster_recipe

CHAMPIONS_FILE = DATA_DIR / 'champion_recipes.json'
ITEM_FIELDS = ('id', 'barista', 'event', 'year', 'place', 'brewer', 'coffee', 'coffee_g', 'water_g',
               'temperature_c', 'duration_seconds', 'grind_setting', 'grind_description', 'steps',
               'source_url', 'source_note')


def optional_text(value, where, limit=120):
    require(value is None or (isinstance(value, str) and value == value.strip() and 0 < len(value) <= limit),
            where, f'expected null or a trimmed text up to {limit} characters')


def validate_champion(item, where):
    fields(item, where, ITEM_FIELDS)
    require(set(item) == set(ITEM_FIELDS), where, 'unknown field')
    require(isinstance(item['id'], str) and item['id'].replace('_', '').isalnum() and item['id'].islower(),
            where, 'id: lowercase letters, digits and _')
    for key in ('barista', 'event', 'brewer'):
        nonempty(item[key], f'{where}.{key}')
    require(isinstance(item['year'], int) and not isinstance(item['year'], bool) and 1990 <= item['year'] <= 2100,
            where, 'year: a whole year')
    require(item['place'] is None or (isinstance(item['place'], int) and not isinstance(item['place'], bool)
                                      and 1 <= item['place'] <= 100), where, 'place: null or a whole number')
    coffee = item['coffee']
    fields(coffee, f'{where}.coffee', ('country', 'processing', 'variety'))
    require(set(coffee) == {'country', 'processing', 'variety'}, f'{where}.coffee', 'unknown field')
    for key in ('country', 'processing', 'variety'):
        optional_text(coffee[key], f'{where}.coffee.{key}')
    optional_text(item['grind_setting'], f'{where}.grind_setting', 40)
    optional_text(item['grind_description'], f'{where}.grind_description', 120)
    require(item['grind_setting'] or item['grind_description'], where, 'grind_setting or grind_description is required')
    source = item['source_url']
    parts = urlsplit(source) if isinstance(source, str) else None
    require(parts is not None and parts.scheme == 'https' and bool(parts.hostname) and not parts.username
            and len(source) <= 300, where, 'source_url must be an HTTPS page')
    optional_text(item['source_note'], f'{where}.source_note', 400)
    require(item['source_note'] is not None, where, 'source_note: where the recipe was published')
    for key in ('coffee_g', 'water_g', 'temperature_c', 'duration_seconds'):
        require(is_number(item[key]), f'{where}.{key}', 'expected a number')
    require(isinstance(item['steps'], list) and item['steps'], where, 'steps are required')
    try:
        adopt_roaster_recipe({'device': item['brewer'], 'grinder': None,
                              'grind_setting': item['grind_setting'] or item['grind_description'],
                              **{key: item[key] for key in ('coffee_g', 'water_g', 'temperature_c', 'duration_seconds', 'steps')}},
                             {'name': f"{item['barista']} · {item['event']}"[:180], 'url': None, 'kind': 'champion'})
    except BrewingInputError as exc:
        require(False, where, f'the recipe is incomplete or inconsistent: {exc}')


def load_champions(path=CHAMPIONS_FILE):
    data = read_json(Path(path))
    fields(data, 'champions', ('schema_version', 'items'))
    require(set(data) == {'schema_version', 'items'} and data['schema_version'] == 1, 'champions', 'unsupported file')
    require(isinstance(data['items'], list), 'champions.items', 'expected a list')
    seen = set()
    for index, item in enumerate(data['items']):
        where = f'champions.items[{index}]'
        validate_champion(item, where)
        require(item['id'] not in seen, where, f'duplicate id: {item["id"]}')
        seen.add(item['id'])
    return data
