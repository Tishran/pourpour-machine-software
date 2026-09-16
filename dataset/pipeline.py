"""Collect public source snapshots and rebuild JSONL/SQLite offline. Stdlib only."""
import argparse
from collections import Counter
from datetime import datetime, timezone
import gzip
import hashlib
from html.parser import HTMLParser
import json
import math
from pathlib import Path
import re
import sqlite3
import sys
import time
import xml.etree.ElementTree as ET

from webapp.pourpour import API, FEED, SourceError, download, parse_catalog, parse_product, seconds

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ROOT = ROOT / 'data' / 'welder_catherine'
SCHEMA_VERSION = 1
PARSER_VERSION = '1.0.0'


def utcnow():
    return datetime.now(timezone.utc).isoformat()


def digest(value):
    return hashlib.sha256(value).hexdigest()


def encoded(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'), allow_nan=False)


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + '\n', encoding='utf-8')


class Node:
    def __init__(self, tag='', attrs=()):
        self.tag, self.attrs, self.children = tag, dict(attrs), []

    def find(self, tag=None, cls=None, **attrs):
        result = []
        for child in self.children:
            if not isinstance(child, Node):
                continue
            if ((tag is None or child.tag == tag)
                    and (cls is None or cls in child.attrs.get('class', '').split())
                    and all(child.attrs.get(k) == v for k, v in attrs.items())):
                result.append(child)
            result.extend(child.find(tag, cls, **attrs))
        return result

    def text(self):
        return ' '.join(' '.join(c.text() if isinstance(c, Node) else c
                                for c in self.children).split())


class Tree(HTMLParser):
    VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}

    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.root = Node()
        self.stack = [self.root]
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in self.VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in self.VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                break

    def handle_data(self, text):
        self.stack[-1].children.append(text)


def number(value, zero=False):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        return None
    return value if value > 0 or (zero and value == 0) else None


def numeric_text(value):
    if value and re.fullmatch(r'\d+(?:[.,]\d+)?', value.strip()):
        return float(value.replace(',', '.'))
    return None


COUNTRIES = {'Боливия': 'BO', 'Бразилия': 'BR', 'Бурунди': 'BI', 'Вьетнам': 'VN',
             'Гватемала': 'GT', 'Гондурас': 'HN', 'Индия': 'IN', 'Индонезия': 'ID',
             'Кения': 'KE', 'Колумбия': 'CO', 'Коста-Рика': 'CR', 'Мексика': 'MX',
             'Никарагуа': 'NI', 'Панама': 'PA', 'Перу': 'PE', 'Руанда': 'RW',
             'Сальвадор': 'SV', 'Танзания': 'TZ', 'Уганда': 'UG', 'Эквадор': 'EC', 'Эфиопия': 'ET'}


def coffee_features(html, name):
    tree = Tree(html).root
    props, sensory, roast, bars = {}, {}, {}, {}
    for block in tree.find(cls='harac')[:1]:
        for li in block.find(tag='li'):
            keys, values = li.find(cls='name'), li.find(cls='value')
            if keys and values:
                props[keys[0].text()] = values[0].text() or None
    for item in tree.find(cls='coffee-card__props-left__item'):
        key, sep, value = item.text().partition(':')
        if sep:
            sensory[key.strip()] = value.strip() or None
    for block in tree.find(filtrid='filtrRoast'):
        for row in block.find(tag='tr'):
            cells = row.find(tag='td')
            if len(cells) == 2:
                roast[cells[0].text()] = cells[1].text() or None
    for key in ('acidity', 'sweetness', 'bitterness'):
        for bar in tree.find(cls=key + '-bar')[:1]:
            for node in bar.find(tag='i')[:1]:
                match = re.search(r'width:\s*(\d+(?:\.\d+)?)%', node.attrs.get('style', ''))
                if match:
                    bars[key + '_display_percent'] = float(match[1])
    country = next((code for prefix, code in COUNTRIES.items()
                    if name.casefold().startswith(prefix.casefold() + ' ')), None)
    return {
        'country_code': country,
        'country_basis': 'inferred_from_name_prefix' if country else None,
        'region': props.get('Регион'), 'variety': props.get('Разновидность'),
        'processing': props.get('Способ обработки'), 'harvest': props.get('Сбор урожая'),
        'aroma': sensory.get('Аромат'), 'flavor': sensory.get('Букет'),
        'aftertaste': sensory.get('Послевкусие'), 'body': sensory.get('Тело'),
        'roaster_score': numeric_text(sensory.get('Общая итоговая оценка')),
        'filter_roast_color': numeric_text(roast.get('Цвет')),
        'roast_color_scale': None,
        'sensory_display': bars,
        'characteristics_raw': props, 'sensory_raw': sensory, 'filter_roast_profile_raw': roast,
    }


def catalog_offers(xml):
    # parse_catalog performs the XML safety checks first.
    parse_catalog(xml)
    root = ET.fromstring(re.sub(r'<!DOCTYPE[^>]*>', '', xml, flags=re.I))
    grouped = {}
    for offer in root.findall('.//offer'):
        if not re.search(r'\(под фильтр\s*/', offer.findtext('name', ''), re.I):
            continue
        grouped.setdefault(offer.findtext('url', '').strip(), []).append({
            'source_offer_id': offer.get('id'), 'name': offer.findtext('name'),
            'available': offer.get('available') == 'true',
            'parameters': {p.get('name'): p.text for p in offer.findall('param')},
        })
    return grouped


def normalize_recipe(raw, coffee_id, source, raw_index):
    """Preserve independent variants; never fill missing data from another recipe."""
    issues = []
    def issue(code, severity='warning'):
        issues.append({'code': code, 'severity': severity})

    dose, water, temperature = (number(raw.get(k)) for k in ('load', 'water', 'temperature'))
    duration = seconds(raw.get('time')) or None
    for key, value in [('coffee_g', dose), ('water_g', water), ('temperature_c', temperature), ('duration_seconds', duration)]:
        if value is None:
            issue('missing_' + key, 'error')
    if temperature is not None and temperature > 100:
        issue('temperature_above_100c', 'error')
    raw_steps = raw.get('steps') or []
    if not isinstance(raw_steps, list) or any(not isinstance(s, dict) for s in raw_steps):
        raise ValueError('Unexpected steps structure')
    valid_order = all(isinstance(s.get('seq_num'), int) and not isinstance(s.get('seq_num'), bool) for s in raw_steps)
    if not valid_order:
        issue('invalid_step_order', 'error')
    ordered = sorted(raw_steps, key=lambda s: s['seq_num']) if valid_order else raw_steps
    if valid_order and len({s['seq_num'] for s in ordered}) != len(ordered):
        issue('duplicate_step_order', 'error')
    steps, cumulative, previous_stop = [], 0, None
    for s in ordered:
        amount = number(s.get('water'), zero=True)
        start, stop = seconds(s.get('start')), seconds(s.get('stop'))
        temp = number(s.get('temperature'))
        cumulative = cumulative + amount if cumulative is not None and amount is not None else None
        if amount is None:
            issue('missing_step_water', 'error')
        if start is None or stop is None or stop < start:
            issue('invalid_step_time', 'error')
        if start is not None and previous_stop is not None and start < previous_stop:
            issue('overlapping_steps', 'error')
        if stop is not None and duration is not None and stop > duration:
            issue('step_exceeds_total_time', 'error')
        if temp is None:
            issue('missing_step_temperature')
        elif temp > 100:
            issue('step_temperature_above_100c', 'error')
        steps.append({'source_step_id': s.get('id'), 'seq_num': s.get('seq_num'),
                      'instruction': (s.get('instruction') or '').strip(),
                      'water_g': amount, 'cumulative_water_g': cumulative, 'temperature_c': temp,
                      'start_seconds': start, 'stop_seconds': stop,
                      'start_raw': s.get('start'), 'stop_raw': s.get('stop')})
        previous_stop = stop
    if not steps:
        issue('missing_steps', 'error')
    if water is not None and cumulative is not None and steps and abs(water - cumulative) > .5:
        issue('step_water_sum_mismatch', 'error')
    grinder = raw.get('grinder') or {}
    if not isinstance(grinder, dict):
        raise ValueError('Unexpected grinder structure')
    setting = number(raw.get('grind_step'))
    sub = number(raw.get('grind_sub_step'), zero=True)
    if setting is None or sub is None:
        issue('missing_grind_setting')
    source_ids = sorted({s['recipe_id'] for s in raw_steps if s.get('recipe_id')})
    if len(source_ids) > 1:
        issue('conflicting_source_recipe_ids', 'error')
    source_id = raw.get('id') or (source_ids[0] if len(source_ids) == 1 else None)
    # Equipment identity matters; marketing descriptions and images do not.
    def equipment_identity(equipment):
        return {k: equipment.get(k) for k in ('id', 'manufacturer', 'model', 'kind')}
    # Fingerprint excludes recipe/step UUIDs and name, so repeated programs can be detected.
    program = {'coffee_g': dose, 'water_g': water, 'temperature_c': temperature,
               'duration_seconds': duration, 'device': equipment_identity(raw.get('device') or {}),
               'grinder': equipment_identity(grinder),
               'grind_step': raw.get('grind_step'), 'grind_sub_step': raw.get('grind_sub_step'),
               'steps': [{k: v for k, v in s.items() if k not in ('source_step_id', 'start_raw', 'stop_raw')} for s in steps],
               'notes': raw.get('notes')}
    fingerprint = digest(encoded(program).encode())
    content_sha = digest(encoded(raw).encode())
    record_id = coffee_id + ':' + content_sha[:24]
    return {
        'schema_version': SCHEMA_VERSION, 'recipe_id': record_id, 'coffee_id': coffee_id,
        'source_recipe_id': source_id, 'source_content_sha256': content_sha,
        'program_fingerprint': fingerprint, 'label_kind': 'roaster_recommendation',
        'name': raw.get('name'), 'method': 'DRIPPER', 'device': raw.get('device'),
        'grinder': grinder, 'grind_step_raw': raw.get('grind_step'),
        'grind_sub_step_raw': raw.get('grind_sub_step'),
        'grind_setting_display': f'{setting}.{sub}' if setting is not None and sub is not None else None,
        'coffee_g': dose, 'water_g': water, 'temperature_c': temperature,
        'duration_seconds': duration, 'duration_raw': raw.get('time'),
        'water_to_coffee_ratio': water / dose if dose and water else None,
        'beverage_tds_percent': number(raw.get('tds')), 'water_mineral_ppm': None,
        'filter_paper': raw.get('filter'), 'steps': steps, 'notes': raw.get('notes') or None,
        'quality_issues': sorted({i['code']: i for i in issues}.values(), key=lambda i: i['code']),
        'scalar_targets_usable': all(v is not None for v in (dose, water, temperature, duration)) and temperature <= 100,
        'schedule_usable': not any(i['severity'] == 'error' for i in issues),
        'source': dict(source, json_pointer=f'/value/{raw_index}'),
    }


class SnapshotFetcher:
    def __init__(self, directory, manifest):
        self.directory, self.manifest = directory, manifest
        self.last_request = 0

    def get(self, url, kind):
        time.sleep(max(0, .4 - (time.monotonic() - self.last_request)))
        self.last_request = time.monotonic()
        text = download(url)
        payload = text.encode('utf-8')
        sha = digest(payload)
        path = 'raw/' + sha + '.gz'
        (self.directory / path).write_bytes(gzip.compress(payload, mtime=0))
        source = {'url': url, 'fetched_at': utcnow(), 'sha256': sha, 'path': path, 'kind': kind}
        self.manifest['sources'].append(source)
        write_json(self.directory / 'manifest.json', self.manifest)
        return text, source


def collect(root):
    snapshot_id = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    directory = root / 'snapshots' / snapshot_id
    (directory / 'raw').mkdir(parents=True, exist_ok=False)
    manifest = {'schema_version': SCHEMA_VERSION, 'snapshot_id': snapshot_id,
                'started_at': utcnow(), 'completed_at': None, 'scope': 'current_filter_catalog',
                'parser_version': PARSER_VERSION, 'sources': [], 'products': [], 'errors': []}
    fetch = SnapshotFetcher(directory, manifest)
    try:
        xml, _ = fetch.get(FEED, 'catalog')
        products = parse_catalog(xml)
        manifest['catalog_products'] = len(products)
        for index, product in enumerate(products, 1):
            entry = dict(product, product_id=None, status='pending')
            manifest['products'].append(entry)
            try:
                html, _ = fetch.get(product['url'], 'product')
                entry['product_id'] = parse_product(html)
                entry['recipe_url'] = f"{API}?product_id={entry['product_id']}&view=true"
                body, _ = fetch.get(entry['recipe_url'], 'recipes')
                response = json.loads(body)
                if response.get('status') != 'OK' or not isinstance(response.get('value'), list):
                    raise ValueError('Unexpected recipe response')
                entry['status'] = 'fetched'
            except (SourceError, ValueError, TypeError, KeyError) as exc:
                entry['status'] = 'fetch_error'
                manifest['errors'].append({'url': product['url'], 'error': str(exc)})
            write_json(directory / 'manifest.json', manifest)
            print(f"[{index}/{len(products)}] {product['name']}: {entry['status']}", flush=True)
    except (SourceError, ValueError, TypeError, KeyError) as exc:
        manifest['errors'].append({'url': FEED, 'error': str(exc)})
        raise
    finally:
        manifest['completed_at'] = utcnow()
        write_json(directory / 'manifest.json', manifest)
    report = build(directory)
    print(f'Snapshot: {directory}', flush=True)
    print(json.dumps(report['counts'], ensure_ascii=False), flush=True)
    return 1 if manifest['errors'] or report['parse_errors'] else 0


def read_source(directory, source):
    payload = gzip.decompress((directory / source['path']).read_bytes())
    if digest(payload) != source['sha256']:
        raise ValueError('Source checksum mismatch: ' + source['path'])
    return payload.decode('utf-8')


def jsonl(path, rows):
    path.write_text(''.join(encoded(row) + '\n' for row in rows), encoding='utf-8')


def build(directory):
    directory = Path(directory)
    manifest = json.loads((directory / 'manifest.json').read_text(encoding='utf-8'))
    sources = {s['url']: s for s in manifest['sources']}
    # Verify every captured response, including any response that failed parsing.
    for source in sources.values():
        read_source(directory, source)
    xml = read_source(directory, sources[FEED])
    offers = catalog_offers(xml)
    catalog = parse_catalog(xml)
    entries = {p['url']: p for p in manifest['products']}
    coffees, recipes, errors = [], [], []
    for product in catalog:
        entry = entries.get(product['url'], {})
        page_source = sources.get(product['url'])
        coffee_id = 'twc:' + product['id']
        features = coffee_features(read_source(directory, page_source), product['name']) if page_source else {}
        coffee = {'schema_version': SCHEMA_VERSION, 'coffee_id': coffee_id,
                  'name': product['name'], 'roaster': 'The Welder Catherine',
                  'source_product_id': entry.get('product_id'), 'url': product['url'],
                  'roast_intent': 'filter', 'available': product['available'],
                  'offers': offers.get(product['url'], []), 'features': features,
                  'catalog_source': sources[FEED], 'page_source': page_source,
                  'recipe_status': entry.get('status', 'not_fetched')}
        api_source = sources.get(entry.get('recipe_url'))
        if api_source and entry.get('status') == 'fetched':
            try:
                body = json.loads(read_source(directory, api_source))
                if body.get('status') != 'OK' or not isinstance(body.get('value'), list):
                    raise ValueError('Unexpected recipe response')
                count, seen = 0, set()
                for index, raw in enumerate(body['value']):
                    if not isinstance(raw, dict) or not isinstance(raw.get('device'), dict):
                        raise ValueError('Unexpected recipe/device structure')
                    if raw['device'].get('kind') != 'DRIPPER':
                        continue
                    try:
                        recipe = normalize_recipe(raw, coffee_id, api_source, index)
                        if recipe['recipe_id'] not in seen:
                            recipes.append(recipe)
                            seen.add(recipe['recipe_id'])
                            count += 1
                    except (ValueError, TypeError, KeyError, AttributeError) as exc:
                        errors.append({'coffee_id': coffee_id, 'raw_index': index, 'error': str(exc)})
                coffee['recipe_status'] = 'has_pourover' if count else 'no_pourover'
            except (ValueError, TypeError, KeyError) as exc:
                errors.append({'coffee_id': coffee_id, 'error': str(exc)})
                coffee['recipe_status'] = 'parse_error'
        if any(e['coffee_id'] == coffee_id for e in errors):
            coffee['recipe_status'] = 'parse_error'
        coffees.append(coffee)
    output = directory / 'processed'
    output.mkdir(exist_ok=True)
    recipes.sort(key=lambda r: r['recipe_id'])
    jsonl(output / 'coffees.jsonl', coffees)
    jsonl(output / 'recipes.jsonl', recipes)
    report = {
        'schema_version': SCHEMA_VERSION, 'parser_version': PARSER_VERSION,
        'snapshot_id': manifest['snapshot_id'], 'scope': manifest['scope'],
        'counts': {'coffees': len(coffees), 'packaging_offers': sum(len(c['offers']) for c in coffees),
                   'pourover_recipes': len(recipes), 'steps': sum(len(r['steps']) for r in recipes),
                   'coffees_with_recipes': len({r['coffee_id'] for r in recipes}),
                   'scalar_targets_usable': sum(r['scalar_targets_usable'] for r in recipes),
                   'schedule_usable': sum(r['schedule_usable'] for r in recipes),
                   'training_candidates': sum(r['scalar_targets_usable'] and r['schedule_usable']
                                               and next(c for c in coffees if c['coffee_id'] == r['coffee_id'])['recipe_status'] == 'has_pourover'
                                               for r in recipes),
                   'unique_programs': len({r['program_fingerprint'] for r in recipes}),
                   'sources': len(sources)},
        'coffee_statuses': dict(Counter(c['recipe_status'] for c in coffees)),
        'missing_coffee_features': {key: sum(c['features'].get(key) is None for c in coffees)
                                    for key in ('country_code', 'region', 'variety', 'processing', 'harvest', 'flavor', 'roaster_score', 'filter_roast_color')},
        'quality_issue_counts': dict(Counter(i['code'] for r in recipes for i in r['quality_issues'])),
        'fetch_errors': manifest['errors'], 'parse_errors': errors,
        'recipes_needing_review': [{'recipe_id': r['recipe_id'], 'name': r['name'], 'issues': r['quality_issues']}
                                   for r in recipes if r['quality_issues']],
    }
    write_json(output / 'report.json', report)
    make_sqlite(output / 'dataset.sqlite', coffees, recipes, manifest)
    return report


def make_sqlite(path, coffees, recipes, manifest):
    temp = path.with_suffix('.sqlite.tmp')
    if temp.exists():
        temp.unlink()
    with sqlite3.connect(temp) as db:
        db.executescript((Path(__file__).parent / 'schema.sql').read_text())
        db.execute('INSERT INTO metadata VALUES (?, ?)', ('manifest', encoded(manifest)))
        db.execute('INSERT INTO metadata VALUES (?, ?)', ('parser_version', PARSER_VERSION))
        for c in coffees:
            f = c['features']
            db.execute('INSERT INTO coffees VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', (
                c['coffee_id'], c['source_product_id'], c['name'], c['url'], f.get('country_code'),
                f.get('region'), f.get('variety'), f.get('processing'), f.get('harvest'),
                f.get('flavor'), c['recipe_status'], encoded(c)))
        for r in recipes:
            db.execute('INSERT INTO recipes VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', (
                r['recipe_id'], r['coffee_id'], r['source_recipe_id'], r['program_fingerprint'],
                r['coffee_g'], r['water_g'], r['temperature_c'], r['duration_seconds'],
                r['water_to_coffee_ratio'], r['grinder'].get('id'), r['grind_setting_display'],
                r['beverage_tds_percent'], int(r['scalar_targets_usable']), int(r['schedule_usable']), encoded(r)))
            for index, step in enumerate(r['steps']):
                db.execute('INSERT INTO steps VALUES (?,?,?,?,?,?,?,?,?,?)', (
                    r['recipe_id'], index, step['seq_num'], step['instruction'], step['water_g'],
                    step['cumulative_water_g'], step['temperature_c'], step['start_seconds'], step['stop_seconds'], encoded(step)))
        if db.execute('PRAGMA foreign_key_check').fetchall():
            raise ValueError('Broken dataset foreign keys')
    temp.replace(path)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    collect_parser = commands.add_parser('collect', help='Fetch a new dated snapshot from the public site/API')
    collect_parser.add_argument('--root', type=Path, default=DEFAULT_ROOT)
    build_parser = commands.add_parser('build', help='Rebuild normalized data from a snapshot without network access')
    build_parser.add_argument('snapshot', type=Path)
    args = parser.parse_args()
    if args.command == 'collect':
        return collect(args.root)
    report = build(args.snapshot)
    print(json.dumps(report['counts'], indent=2))
    return 1 if report['parse_errors'] or report['fetch_errors'] else 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (SourceError, ValueError, OSError) as exc:
        print(f'Dataset error: {exc}', file=sys.stderr)
        sys.exit(1)
