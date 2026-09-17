import contextlib
import copy
import io
import json
from pathlib import Path
import sqlite3
import tempfile
import unittest
from unittest.mock import patch

from dataset.archive import ARCHIVE, NON_BEANS, build, collect, listing, product_info, recipe_values
from dataset.pipeline import API, jsonl, normalize_recipe

FIXTURES = Path(__file__).resolve().parents[2] / 'webapp/tests/fixtures'


def card(slug, name):
    return f'<a class="product-item_title" href="{ARCHIVE}{slug}/">{name}</a>'


def product(pid, filter_roast=True):
    return (f'<div id="recipe-template" data-id="{pid}"></div>'
            '<ul class="harac"><li><span class="name">Способ обработки</span>'
            '<span class="value">мытый</span></li></ul>'
            + ('<div filtrId="filtrRoast"><table><tr><td>Цвет</td><td>62</td></tr></table></div>' if filter_roast else ''))


class ArchiveTests(unittest.TestCase):
    def test_listing_only_uses_archive_product_cards_and_local_pagination(self):
        html = card('new', 'Колумбия Новый') + card('new', 'Колумбия Новый')
        html += '<a href="/catalog/arkhiv_kofe/?PAGEN_1=87">87</a>'
        html += '<a href="https://other.com/catalog/arkhiv_kofe/?PAGEN_1=99">99</a>'
        html += '<a href="/catalog/arkhiv_kofe/unrelated/">Footer</a>'
        products, pages = listing(html)
        self.assertEqual(products, {ARCHIVE + 'new/': 'Колумбия Новый'})
        self.assertEqual(pages, 87)
        with self.assertRaises(ValueError):
            listing('<html>Maintenance</html>')

    def test_explicit_formats_are_excluded_but_unknown_names_are_inspected(self):
        for name in ['1 фильтр-пакет Колумбия', 'Дрип-пакеты Руанда', 'Футболка OatGoat', 'Кофе в капсулах']:
            self.assertTrue(NON_BEANS.search(name), name)
        for name in ['Колумбия Новый', 'Кения Баричу Готомбоя АА', 'Смесь №1']:
            self.assertFalse(NON_BEANS.search(name), name)

    def test_filter_roast_needs_positive_source_evidence(self):
        self.assertTrue(product_info(product('42'), 'Колумбия')['filter_roast_confirmed'])
        info = product_info(product('42', False), 'Колумбия')
        self.assertTrue(info['is_coffee'])
        self.assertFalse(info['filter_roast_confirmed'])
        info = product_info('<meta itemprop="ProductId" content="123">', 'Мерч')
        self.assertEqual(info['product_id'], '123')
        self.assertFalse(info['is_coffee'])
        milk = '<ul class="harac"><li><span class="name">Состав</span><span class="value">Овёс</span></li></ul>'
        self.assertFalse(product_info(milk, 'Молоко')['is_coffee'])
        sku = '<script>window.sku = [{"id":7,"name":"Перу Лот (под фильтр\\/250 г)"}];</script>'
        info = product_info(product('42', False) + sku, 'Перу Лот')
        self.assertTrue(info['filter_roast_confirmed'])
        self.assertEqual(info['filter_roast_basis'], 'explicit_filter_sku')
        self.assertEqual(info['offers'][0]['source_offer_id'], '7')
        info = product_info(product('42', False) + sku.replace('под фильтр', 'под эспрессо'), 'Перу Лот')
        self.assertFalse(info['filter_roast_confirmed'])

    def test_explicit_null_is_no_recipe_but_malformed_response_is_an_error(self):
        self.assertEqual(recipe_values('{"status":"OK","value":null}'), [])
        self.assertEqual(recipe_values('{"status":"OK","value":[]}'), [])
        for value in ['[]', '{}', '{"status":"OK"}', '{"status":"ERROR","value":null}', '{"status":"OK","value":{}}']:
            with self.assertRaises(ValueError):
                recipe_values(value)

    def test_collect_resume_offline_build_overlap_and_training_gate(self):
        raw = json.loads((FIXTURES / 'recipes.json').read_text())['value'][1]
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            baseline = root / 'baseline'
            (baseline / 'processed').mkdir(parents=True)
            old_recipe = normalize_recipe(raw, 'twc:original', {}, 0)
            jsonl(baseline / 'processed/coffees.jsonl', [{'coffee_id': 'twc:original', 'source_product_id': '1', 'name': 'Руанда Старый'}])
            jsonl(baseline / 'processed/recipes.jsonl', [old_recipe])
            pages = {
                ARCHIVE: card('old', 'Руанда Старый') + card('new', 'Колумбия Новый') + '<a href="?PAGEN_1=2">2</a>',
                ARCHIVE + '?PAGEN_1=2': card('alias', 'Руанда Старый') + card('unknown', 'Кения Другой') + card('empty', 'Перу Без рецепта') + card('drip', '1 фильтр-пакет Руанда'),
                ARCHIVE + 'old/': product('1'), ARCHIVE + 'alias/': product('1'),
                ARCHIVE + 'new/': product('2'), ARCHIVE + 'unknown/': product('3', False),
                ARCHIVE + 'empty/': product('4'),
                API + '?product_id=1&view=true': json.dumps({'status': 'OK', 'value': [raw]}),
                API + '?product_id=2&view=true': json.dumps({'status': 'OK', 'value': [raw, copy.deepcopy(raw)]}),
                API + '?product_id=3&view=true': json.dumps({'status': 'OK', 'value': [raw]}),
                API + '?product_id=4&view=true': '{"status":"OK","value":null}',
            }
            with patch('dataset.pipeline.download', side_effect=pages.__getitem__) as fetch, patch('dataset.pipeline.time.sleep'), contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(collect(root, baseline), 0)
                self.assertNotIn(ARCHIVE + 'drip/', [c.args[0] for c in fetch.call_args_list])
            snapshot = next((root / 'snapshots').iterdir())
            report = build(snapshot)
            self.assertTrue(report['coverage_complete'])
            self.assertEqual(report['counts']['coffees'], 4)
            self.assertEqual(report['counts']['overlapping_coffees'], 1)
            self.assertEqual(report['counts']['training_candidates'], 2)
            self.assertEqual(report['counts']['new_training_coffees'], 1)
            self.assertEqual(report['counts']['new_usable_programs'], 0)
            self.assertEqual(len(report['duplicate_product_aliases']), 1)
            self.assertEqual(report['coffee_statuses']['roast_unconfirmed'], 1)
            self.assertEqual(report['coffee_statuses']['no_pourover'], 1)
            before = (snapshot / 'processed/recipes.jsonl').read_bytes()
            with patch('dataset.pipeline.download', side_effect=AssertionError('Must resume from cached sources')), contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(collect(root, resume=snapshot), 0)
            self.assertEqual(before, (snapshot / 'processed/recipes.jsonl').read_bytes())
            # A missing archive page cannot be called complete even with valid recipes.
            manifest = json.loads((snapshot / 'manifest.json').read_text())
            manifest['expected_pages'] = 3
            (snapshot / 'manifest.json').write_text(json.dumps(manifest))
            self.assertFalse(build(snapshot)['coverage_complete'])
            with contextlib.closing(sqlite3.connect(snapshot / 'processed/dataset.sqlite')) as db:
                self.assertEqual(db.execute('SELECT count(*) FROM scalar_training_candidates').fetchone()[0], 2)
                self.assertEqual(db.execute('PRAGMA integrity_check').fetchone()[0], 'ok')
            manifest = json.loads((snapshot / 'manifest.json').read_text())
            manifest['sources'][0]['sha256'] = 'incorrect'
            (snapshot / 'manifest.json').write_text(json.dumps(manifest))
            with self.assertRaisesRegex(ValueError, 'checksum'):
                build(snapshot)


if __name__ == '__main__':
    unittest.main()
