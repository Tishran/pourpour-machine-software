import copy
from contextlib import closing
import gzip
import json
from pathlib import Path
import sqlite3
import tempfile
import unittest

from dataset.pipeline import (API, FEED, build, coffee_features, digest, encoded,
                              normalize_recipe, read_source, write_json)

FIXTURES = Path(__file__).resolve().parents[2] / 'webapp/tests/fixtures'
HTML = '''<div id="recipe-template" data-id="55664"></div>
<ul class="harac act">
 <li><div class="name">Разновидность</div><div class="value">красный бурбон</div></li>
 <li><div class="name">Регион</div><div class="value">Ньямашеке</div></li>
 <li><div class="name">Сбор урожая</div><div class="value">Апрель 2025</div></li>
 <li><div class="name">Способ обработки</div><div class="value">мытый, анаэробный</div></li>
</ul>
<div class="coffee-card__props-left__item"><span>Букет:</span> тёмный виноград, лайм</div>
<div class="coffee-card__props-left__item total bold">Общая итоговая оценка: <span>87.25</span></div>
<div class="acidity-bar"><i style="width: 80%"></i></div>
<div filtrId="filtrRoast"><table><tr><td>Цвет</td><td>61.55</td></tr></table></div>
<div filtrId="espressoRoast"><table><tr><td>Цвет</td><td>59.8</td></tr></table></div>'''


class DatasetTests(unittest.TestCase):
    def setUp(self):
        self.raw = json.loads((FIXTURES / 'recipes.json').read_text())['value'][1]

    def recipe(self, raw=None):
        return normalize_recipe(raw if raw is not None else self.raw, 'twc:test', {'url': 'test'}, 1)

    def test_source_duration_and_order_and_missing_temperature(self):
        r = self.recipe()
        self.assertEqual([s['start_seconds'] for s in r['steps']], [0, 30, 60, 90, 120])
        self.assertEqual([s['cumulative_water_g'] for s in r['steps']], [50, 100, 150, 200, 250])
        self.assertEqual(r['duration_seconds'], 175)
        self.assertAlmostEqual(r['water_to_coffee_ratio'], 250 / 15)
        self.assertIsNone(r['steps'][3]['temperature_c'])
        self.assertEqual(r['quality_issues'], [{'code': 'missing_step_temperature', 'severity': 'warning'}])
        self.assertEqual(r['source_recipe_id'], '74877bed-784c-cade-b0b6-6b20887bd073')

    def test_bad_schedule_quarantined_without_losing_scalar_targets(self):
        self.raw['steps'][0]['water'] = 70
        self.raw['steps'][0]['stop'] = '1ms'
        r = self.recipe()
        self.assertTrue(r['scalar_targets_usable'])
        self.assertFalse(r['schedule_usable'])
        self.assertIn('step_water_sum_mismatch', [i['code'] for i in r['quality_issues']])
        self.assertIn('overlapping_steps', [i['code'] for i in r['quality_issues']])

    def test_zero_sentinels_and_malformed_times_not_targets(self):
        self.raw.update(load=0, time='garbage', tds=0, grind_step=0)
        r = self.recipe()
        for key in ('coffee_g', 'water_to_coffee_ratio', 'duration_seconds', 'beverage_tds_percent', 'grind_setting_display'):
            self.assertIsNone(r[key])
        self.assertFalse(r['scalar_targets_usable'])
        self.assertFalse(r['schedule_usable'])

    def test_variants_and_coffees_do_not_collapse(self):
        old = self.recipe()
        self.raw['temperature'] = 96
        new = self.recipe()
        self.assertNotEqual(old['recipe_id'], new['recipe_id'])
        self.assertNotEqual(old['program_fingerprint'], new['program_fingerprint'])
        other = normalize_recipe(self.raw, 'twc:other', {}, 1)
        self.assertNotEqual(new['recipe_id'], other['recipe_id'])
        self.assertEqual(new['program_fingerprint'], other['program_fingerprint'])

    def test_missing_order_is_an_error_and_zero_water_is_valid(self):
        self.raw['steps'][0]['seq_num'] = None
        self.raw['steps'][0]['water'] = 0
        r = self.recipe()
        self.assertFalse(r['schedule_usable'])
        self.assertEqual(r['steps'][0]['water_g'], 0)

    def test_product_features_keep_filter_and_espresso_separate(self):
        f = coffee_features(HTML, 'Руанда Суса')
        self.assertEqual(f['processing'], 'мытый, анаэробный')
        self.assertEqual(f['country_code'], 'RW')
        self.assertEqual(f['country_basis'], 'inferred_from_name_prefix')
        self.assertEqual(f['filter_roast_color'], 61.55)
        self.assertEqual(f['roaster_score'], 87.25)
        self.assertEqual(f['sensory_display']['acidity_display_percent'], 80)
        self.assertIsNone(coffee_features('', 'Unknown')['processing'])
        self.assertIsNone(coffee_features('', 'Unknown')['country_code'])

    def test_archived_sensory_layout_with_unclosed_paragraph(self):
        html = '''<div class="infobox-flavor-profile"><h3>Вкусовой профиль</h3>
        <p><span>Аромат:</span> цветы</p><p><span>Букет:</span> яблоко, груша
        <p><span>Послевкусие:</span> шоколад</p><p><span>Тело:</span> среднее</p></div>
        <div class="infobox-valuer"><div class="valuer-value-box final">
        <div class="valuer-value">87.5</div><div class="valuer-value-name">Итоговая<br/>оценка</div>
        </div></div><div>Unrelated footer</div>'''
        features = coffee_features(html, 'Перу Лот')
        self.assertEqual(features['flavor'], 'яблоко, груша')
        self.assertEqual(features['aftertaste'], 'шоколад')
        self.assertEqual(features['body'], 'среднее')
        self.assertEqual(features['roaster_score'], 87.5)

    def test_offline_build_coverage_method_filtering_dedup_and_sqlite(self):
        with tempfile.TemporaryDirectory() as d:
            directory = Path(d)
            (directory / 'raw').mkdir()
            sources = []
            def add(url, text, kind):
                data = text.encode()
                sha = digest(data)
                path = 'raw/' + sha + '.gz'
                (directory / path).write_bytes(gzip.compress(data, mtime=0))
                sources.append({'url': url, 'sha256': sha, 'path': path, 'kind': kind, 'fetched_at': '2026-09-16T00:00:00+00:00'})
            add(FEED, (FIXTURES / 'catalog.xml').read_text(), 'catalog')
            url = 'https://theweldercatherine.ru/catalog/dlya_filtra/ruanda_susa/'
            add(url, HTML, 'product')
            api = API + '?product_id=55664&view=true'
            response = json.loads((FIXTURES / 'recipes.json').read_text())
            response['value'].append(copy.deepcopy(self.raw))
            add(api, encoded(response), 'recipes')
            write_json(directory / 'manifest.json', {
                'snapshot_id': 'fixture', 'scope': 'current_filter_catalog', 'sources': sources,
                'errors': [], 'products': [{'url': url, 'product_id': '55664', 'recipe_url': api, 'status': 'fetched'}]})
            report = build(directory)
            self.assertEqual(report['counts']['coffees'], 2)
            self.assertEqual(report['counts']['packaging_offers'], 4)
            self.assertEqual(report['counts']['pourover_recipes'], 1)
            self.assertEqual(report['coffee_statuses']['not_fetched'], 1)
            initial = (directory / 'processed/recipes.jsonl').read_bytes()
            build(directory)
            self.assertEqual(initial, (directory / 'processed/recipes.jsonl').read_bytes())
            with closing(sqlite3.connect(directory / 'processed/dataset.sqlite')) as db:
                self.assertEqual(db.execute('SELECT count(*) FROM steps').fetchone()[0], 5)
                self.assertEqual(db.execute('SELECT count(*) FROM scalar_training_candidates').fetchone()[0], 1)
                self.assertEqual(db.execute('PRAGMA integrity_check').fetchone()[0], 'ok')
            # A valid response with no DRIPPER is different from a parse failure.
            response['value'] = response['value'][:1]
            add(api, encoded(response), 'recipes')
            manifest = json.loads((directory / 'manifest.json').read_text())
            manifest['sources'] = sources
            write_json(directory / 'manifest.json', manifest)
            report = build(directory)
            self.assertEqual(report['counts']['pourover_recipes'], 0)
            self.assertEqual(report['coffee_statuses']['no_pourover'], 1)
            self.assertEqual(report['parse_errors'], [])
            add(api, '{"status":"ERROR","value":[]}', 'recipes')
            manifest['sources'] = sources
            write_json(directory / 'manifest.json', manifest)
            report = build(directory)
            self.assertEqual(report['coffee_statuses']['parse_error'], 1)
            self.assertEqual(len(report['parse_errors']), 1)
            broken = dict(sources[0], sha256='wrong')
            with self.assertRaisesRegex(ValueError, 'checksum'):
                read_source(directory, broken)


if __name__ == '__main__':
    unittest.main()
