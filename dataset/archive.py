"""Inventory the public archive; preserve source snapshots and build offline."""
import argparse
from collections import Counter
from datetime import datetime, timezone
import gzip
import json
from pathlib import Path
import re
import sys
import time
from urllib.parse import parse_qs, urljoin, urlsplit

from dataset.pipeline import (API, DEFAULT_ROOT, PARSER_VERSION, SCHEMA_VERSION, SnapshotFetcher,
                              Tree, coffee_features, digest, jsonl, make_sqlite,
                              normalize_recipe, read_source, utcnow, write_json)
from webapp.pourpour import SourceError

ARCHIVE = 'https://theweldercatherine.ru/catalog/arkhiv_kofe/'
VERSION = 'archive-1.0.0'
BASELINE = DEFAULT_ROOT / 'snapshots/20260916T114435680044Z'
# Only explicit product formats are skipped by name. Unknown titles are inspected.
NON_BEANS = re.compile(r'(?:^|\b)(?:фильтр[ -]?пакет|дрип[ -]?пакет|дрипы|капсул|'
                       r'галараствор|растворимый|экстракт|напиток в банках|комбуча|'
                       r'футболка|толстовка|худи|джерси|коуч|шоппер|носки|кружка|'
                       r'термокружка|значок|открытка|постер|шоколад|сырье|сырьё|'
                       r'саше|кофе в банках|напиток брожения|наклеек|набор пин|'
                       r'фильтры|чашка|дрип[ -]?бокс|сумка|майка|дождевик|бомбер|'
                       r'лонгслив|.*молоко.*OatGoat)', re.I)


def listing(html):
    tree = Tree(html).root
    products = {}
    pages = {1}
    for link in tree.find(tag='a'):
        url = urljoin(ARCHIVE, link.attrs.get('href', ''))
        parts = urlsplit(url)
        if parts.scheme != 'https' or parts.netloc != 'theweldercatherine.ru':
            continue
        if parts.path == urlsplit(ARCHIVE).path:
            for value in parse_qs(parts.query).get('PAGEN_1', []):
                if value.isdigit() and 1 <= int(value) <= 500:
                    pages.add(int(value))
        if ('product-item_title' in link.attrs.get('class', '').split()
                and re.fullmatch(r'/catalog/arkhiv_kofe/[^/]+/', parts.path)):
            products['https://theweldercatherine.ru' + parts.path] = link.text()
    if not products:
        raise ValueError('Archive listing has no product cards; coverage cannot be assumed.')
    return products, max(pages)


def product_info(html, name):
    tree = Tree(html).root
    features = coffee_features(html, name)
    ids = [n.attrs.get('data-id') for n in tree.find(id='recipe-template')]
    ids += [n.attrs.get('content') for n in tree.find(tag='meta')
            if n.attrs.get('itemprop', '').casefold() == 'productid']
    product_id = next((x for x in ids if x and x.isdigit()), None)
    offers = []
    match = re.search(r'\bwindow\.sku\s*=\s*', html)
    if match:
        try:
            sku, _ = json.JSONDecoder().raw_decode(html[match.end():])
            if isinstance(sku, list):
                offers = [{'source_offer_id': str(o['id']), 'name': o['name']}
                          for o in sku if isinstance(o, dict) and 'id' in o and isinstance(o.get('name'), str)
                          and re.search(r'\(под фильтр\s*/', o['name'], re.I)]
        except ValueError:
            pass
    filter_basis = ('filter_roast_profile' if features['filter_roast_profile_raw'] else
                    'explicit_filter_sku' if offers else None)
    filter_roast = bool(filter_basis)
    espresso_roast = bool(tree.find(filtrid='espressoRoast'))
    is_coffee = bool(any(features[key] for key in ('region', 'variety', 'processing', 'harvest'))
                     or filter_roast or espresso_roast)
    return {'product_id': product_id, 'is_coffee': is_coffee,
            'filter_roast_confirmed': filter_roast, 'filter_roast_basis': filter_basis,
            'offers': offers, 'features': features}


def recipe_values(body):
    response = json.loads(body)
    if (not isinstance(response, dict) or response.get('status') != 'OK' or 'value' not in response
            or (response['value'] is not None and not isinstance(response['value'], list))):
        raise ValueError('Unexpected recipe response')
    # Historical products return an explicit OK/null when there is no saved recipe.
    return response['value'] or []


class ArchiveFetcher(SnapshotFetcher):
    def get(self, url, kind):
        existing = next((s for s in reversed(self.manifest['sources']) if s['url'] == url), None)
        if existing:
            return read_source(self.directory, existing), existing
        for attempt in range(3):
            try:
                return super().get(url, kind)
            except SourceError:
                if attempt == 2:
                    raise
                time.sleep(1 + attempt)


def capture_baseline(directory, baseline, manifest):
    manifest['baseline_snapshot'] = baseline.name
    manifest['baseline_sources'] = {}
    for name in ('coffees.jsonl', 'recipes.jsonl'):
        payload = (baseline / 'processed' / name).read_bytes()
        sha = digest(payload)
        path = 'raw/' + sha + '.gz'
        (directory / path).write_bytes(gzip.compress(payload, mtime=0))
        source = {'url': f'dataset://{baseline.name}/{name}', 'sha256': sha,
                  'path': path, 'kind': 'baseline', 'fetched_at': utcnow()}
        manifest['sources'].append(source)
        manifest['baseline_sources'][name] = source


def collect(root, baseline=BASELINE, resume=None):
    if resume:
        directory = Path(resume)
        manifest = json.loads((directory / 'manifest.json').read_text())
        if manifest['scope'] != 'archive_inventory':
            raise ValueError('Not an archive inventory snapshot')
    else:
        stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
        directory = root / 'snapshots' / stamp
        (directory / 'raw').mkdir(parents=True)
        manifest = {'schema_version': SCHEMA_VERSION, 'parser_version': VERSION,
                    'snapshot_id': stamp, 'scope': 'archive_inventory',
                    'started_at': utcnow(), 'completed_at': None,
                    'sources': [], 'products': [], 'pages': [], 'errors': []}
        capture_baseline(directory, baseline, manifest)
    print('Snapshot: ' + str(directory), flush=True)
    fetch = ArchiveFetcher(directory, manifest)
    manifest['completed_at'] = None
    manifest['feature_parser_version'] = PARSER_VERSION
    manifest['errors'] = []
    products = {p['url']: p for p in manifest['products']}
    completed_pages = set(manifest['pages'])
    page, last = 1, manifest.get('expected_pages', 1)
    while page <= last:
        url = ARCHIVE if page == 1 else ARCHIVE + f'?PAGEN_1={page}'
        try:
            html, source = fetch.get(url, 'archive_listing')
            found, maximum = listing(html)
            last = max(last, maximum)
            for product_url, name in found.items():
                if product_url not in products:
                    products[product_url] = {'url': product_url, 'name': name,
                                             'listing_source': source,
                                             'status': 'excluded_format' if NON_BEANS.search(name) else 'pending'}
            completed_pages.add(page)
        except (SourceError, ValueError) as exc:
            manifest['errors'].append({'url': url, 'stage': 'listing', 'error': str(exc)})
        manifest.update(products=list(products.values()), pages=sorted(completed_pages), expected_pages=last)
        write_json(directory / 'manifest.json', manifest)
        print(f'Archive page {page}/{last}: {len(products)} unique product links', flush=True)
        page += 1
    entries = list(products.values())
    for index, entry in enumerate(entries, 1):
        if NON_BEANS.search(entry['name']):
            entry['status'] = 'excluded_format'
        if entry['status'] == 'fetched':
            # Re-evaluate source evidence on resume without downloading it again.
            html, _ = fetch.get(entry['url'], 'product')
            entry['filter_roast_confirmed'] = product_info(html, entry['name'])['filter_roast_confirmed']
        if entry['status'] in ('excluded_format', 'not_coffee', 'fetched'):
            continue
        try:
            html, _ = fetch.get(entry['url'], 'product')
            info = product_info(html, entry['name'])
            entry.update(product_id=info['product_id'], filter_roast_confirmed=info['filter_roast_confirmed'])
            if not info['is_coffee']:
                entry['status'] = 'not_coffee'
            elif not info['product_id']:
                entry['status'] = 'no_product_id'
            else:
                entry['recipe_url'] = f"{API}?product_id={info['product_id']}&view=true"
                body, _ = fetch.get(entry['recipe_url'], 'recipes')
                recipe_values(body)
                entry['status'] = 'fetched'
        except (SourceError, ValueError, TypeError, KeyError) as exc:
            entry['status'] = 'fetch_error'
            manifest['errors'].append({'url': entry['url'], 'stage': 'product', 'error': str(exc)})
        write_json(directory / 'manifest.json', manifest)
        print(f"Product {index}/{len(entries)}: {entry['name']} — {entry['status']}", flush=True)
    manifest['completed_at'] = utcnow()
    write_json(directory / 'manifest.json', manifest)
    report = build(directory)
    print(json.dumps(report['counts'], ensure_ascii=False, indent=2), flush=True)
    return 1 if manifest['errors'] or report['parse_errors'] else 0


def build(directory):
    directory = Path(directory)
    manifest = json.loads((directory / 'manifest.json').read_text())
    sources = {s['url']: s for s in manifest['sources']}
    for source in sources.values():
        read_source(directory, source)
    baseline = {name: [json.loads(line) for line in read_source(directory, source).splitlines()]
                for name, source in manifest['baseline_sources'].items()}
    known = {c['source_product_id']: c for c in baseline['coffees.jsonl'] if c['source_product_id']}
    baseline_names = {c['name'].casefold(): c['coffee_id'] for c in baseline['coffees.jsonl']}
    old_programs = {r['program_fingerprint'] for r in baseline['recipes.jsonl']}
    old_contents = {r['source_content_sha256'] for r in baseline['recipes.jsonl']}
    coffees, recipes, errors, aliases = {}, {}, [], []
    for entry in manifest['products']:
        page_source = sources.get(entry['url'])
        if not page_source or entry['status'] in ('excluded_format', 'not_coffee'):
            continue
        info = product_info(read_source(directory, page_source), entry['name'])
        if not info['is_coffee']:
            continue
        pid = info['product_id']
        previous = known.get(pid)
        cid = previous['coffee_id'] if previous else ('twc:product:' + pid if pid else 'twc:url:' + digest(entry['url'].encode())[:16])
        if cid in coffees:
            aliases.append({'coffee_id': cid, 'url': entry['url']})
            continue
        coffee = {'schema_version': SCHEMA_VERSION, 'coffee_id': cid, 'name': entry['name'],
                  'roaster': 'The Welder Catherine', 'source_product_id': pid, 'url': entry['url'],
                  'roast_intent': 'filter' if info['filter_roast_confirmed'] else 'unconfirmed',
                  'roast_intent_basis': info['filter_roast_basis'],
                  'available': False, 'availability_basis': 'archive_listing', 'offers': info['offers'],
                  'features': info['features'], 'catalog_source': entry['listing_source'], 'page_source': page_source,
                  'recipe_status': entry['status'], 'overlaps_baseline': bool(previous),
                  'same_name_baseline_id': baseline_names.get(entry['name'].casefold())}
        api_source = sources.get(entry.get('recipe_url'))
        if api_source and entry['status'] == 'fetched':
            try:
                values = recipe_values(read_source(directory, api_source))
                count = 0
                for index, raw in enumerate(values):
                    if not isinstance(raw, dict) or not isinstance(raw.get('device'), dict):
                        raise ValueError('Unexpected recipe/device structure')
                    if raw['device'].get('kind') != 'DRIPPER':
                        continue
                    try:
                        recipe = normalize_recipe(raw, cid, api_source, index)
                        recipes[recipe['recipe_id']] = recipe
                        count += 1
                    except (ValueError, TypeError, KeyError, AttributeError) as exc:
                        errors.append({'coffee_id': cid, 'raw_index': index, 'error': str(exc)})
                coffee['recipe_status'] = ('has_pourover' if info['filter_roast_confirmed'] else 'roast_unconfirmed') if count else 'no_pourover'
            except (ValueError, TypeError, KeyError) as exc:
                errors.append({'coffee_id': cid, 'error': str(exc)})
        if any(e['coffee_id'] == cid for e in errors):
            coffee['recipe_status'] = 'parse_error'
        coffees[cid] = coffee
    cs, rs = sorted(coffees.values(), key=lambda c: c['coffee_id']), sorted(recipes.values(), key=lambda r: r['recipe_id'])
    usable = [r for r in rs if r['scalar_targets_usable'] and r['schedule_usable'] and coffees[r['coffee_id']]['recipe_status'] == 'has_pourover']
    new_usable = [r for r in usable if not coffees[r['coffee_id']]['overlaps_baseline']]
    report = {'schema_version': SCHEMA_VERSION, 'parser_version': VERSION, 'snapshot_id': manifest['snapshot_id'],
              'feature_parser_version': PARSER_VERSION,
              'scope': manifest['scope'], 'baseline_snapshot': manifest['baseline_snapshot'],
              'coverage_complete': (bool(manifest['completed_at']) and len(manifest['pages']) == manifest['expected_pages']
                                    and not manifest['errors'] and all(p['status'] != 'pending' for p in manifest['products'])),
              'counts': {'listing_pages': len(manifest['pages']), 'expected_pages': manifest['expected_pages'],
                         'listed_products': len(manifest['products']), 'coffees': len(cs),
                         'pourover_recipes': len(rs), 'steps': sum(len(r['steps']) for r in rs),
                         'training_candidates': len(usable), 'training_coffees': len({r['coffee_id'] for r in usable}),
                         'new_training_candidates': len(new_usable), 'new_training_coffees': len({r['coffee_id'] for r in new_usable}),
                         'overlapping_coffees': sum(c['overlaps_baseline'] for c in cs),
                         'unchanged_recipes_from_baseline': sum(r['source_content_sha256'] in old_contents for r in rs),
                         'unique_usable_programs': len({r['program_fingerprint'] for r in usable}),
                         'new_usable_programs': len({r['program_fingerprint'] for r in usable} - old_programs)},
              'inventory_statuses': dict(Counter(p['status'] for p in manifest['products'])),
              'coffee_statuses': dict(Counter(c['recipe_status'] for c in cs)),
              'missing_coffee_features': {key: sum(not c['features'].get(key) for c in cs) for key in ('country_code','region','variety','processing','harvest','flavor','filter_roast_color')},
              'quality_issue_counts': dict(Counter(i['code'] for r in rs for i in r['quality_issues'])),
              'fetch_errors': manifest['errors'], 'parse_errors': errors, 'duplicate_product_aliases': aliases,
              'same_name_possible_overlaps': [{'coffee_id': c['coffee_id'], 'baseline_id': c['same_name_baseline_id']} for c in cs if c['same_name_baseline_id'] and not c['overlaps_baseline']],
              'recipes_needing_review': [{'recipe_id': r['recipe_id'], 'name': r['name'], 'issues': r['quality_issues']} for r in rs if r['quality_issues']]}
    output = directory / 'processed'
    output.mkdir(exist_ok=True)
    jsonl(output / 'inventory.jsonl', manifest['products'])
    jsonl(output / 'coffees.jsonl', cs)
    jsonl(output / 'recipes.jsonl', rs)
    write_json(output / 'report.json', report)
    lines = ['# Welder Catherine archive inventory', '',
             f"Snapshot: `{manifest['snapshot_id']}`. Baseline: `{manifest['baseline_snapshot']}`.", '',
             f"Source coverage complete: **{report['coverage_complete']}**. This is structural validation, not a taste evaluation.", '',
             '| Measure | Count |', '| --- | ---: |']
    lines += [f'| {key} | {value} |' for key, value in report['counts'].items()]
    for title, key in [('Inventory outcomes', 'inventory_statuses'), ('Coffee outcomes', 'coffee_statuses'),
                       ('Recipe quality issues', 'quality_issue_counts'), ('Missing coffee features', 'missing_coffee_features')]:
        lines += ['', '## ' + title, '', '| Measure | Count |', '| --- | ---: |']
        lines += [f'| {name} | {count} |' for name, count in sorted(report[key].items())]
    lines += ['', '## Interpretation', '',
              '- New means a source product ID absent from the baseline; it does not prove an independent farm/harvest.',
              '- A training candidate needs positive filter-roast evidence and a structurally valid DRIPPER recipe.',
              '- Missing recipes, unknown roast intent and malformed schedules are retained for audit, not guessed.',
              '- Program fingerprints detect repeated equipment/settings/pour schedules across coffees.',
              '- Same-name overlaps need lot/harvest review before combining snapshots.',
              '- The source archive mixes beans, drip bags, drinks and merchandise; listed products are not training rows.',
              '- These are current observations of archived pages, not a reconstruction of their original publication dates.',
              '- The app model has not been replaced by this collection. Evaluate grouped lots and sparse labels before promotion.',
              '', 'Details, source links, overlap candidates and individual recipe issues are in `report.json` and the JSONL files.', '']
    (output / 'report.md').write_text('\n'.join(lines), encoding='utf-8')
    make_sqlite(output / 'dataset.sqlite', cs, rs, manifest)
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    collect_parser = sub.add_parser('collect')
    collect_parser.add_argument('--root', type=Path, default=DEFAULT_ROOT)
    collect_parser.add_argument('--baseline', type=Path, default=BASELINE)
    collect_parser.add_argument('--resume', type=Path)
    build_parser = sub.add_parser('build')
    build_parser.add_argument('snapshot', type=Path)
    args = parser.parse_args()
    if args.command == 'collect':
        return collect(args.root, args.baseline, args.resume)
    report = build(args.snapshot)
    print(json.dumps(report['counts'], indent=2))
    return int(bool(report['fetch_errors'] or report['parse_errors']))


if __name__ == '__main__':
    sys.exit(main())
