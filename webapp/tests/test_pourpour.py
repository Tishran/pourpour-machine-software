import copy
import json
import tempfile
import time
import unittest
from pathlib import Path
from pourpour import (CoffeeService, SourceCache, SourceError, parse_catalog, parse_product,
                      parse_recipes, safe_url, scan_label, search_products, seconds)

FIXTURES = Path(__file__).parent / 'fixtures'


class ScanTests(unittest.TestCase):
    def test_placeholder_shape(self):
        result = scan_label(b'\xff\xd8\xff', 'image/jpeg')
        self.assertEqual(result['status'], 'placeholder')
        self.assertEqual(result['text'], '')
        self.assertEqual(result['candidates'], [])
        self.assertTrue(result['message'])

    def test_arbitrary_bytes_do_not_raise(self):
        for payload, ctype in [(b'', 'image/png'), (b'not an image', 'image/jpeg'), (b'\x00\x01\x02', 'image/webp')]:
            self.assertIn('message', scan_label(payload, ctype))


class ParserTests(unittest.TestCase):
    def setUp(self):
        self.response = json.loads((FIXTURES / 'recipes.json').read_text())

    def test_live_shape_selects_only_dripper_and_sorts_steps(self):
        recipes = parse_recipes(json.dumps(self.response))
        self.assertEqual(len(recipes), 1)
        r = recipes[0]
        self.assertEqual((r['coffee_g'], r['water_g'], r['temperature_c']), (15, 250, 98))
        self.assertEqual([s['start_seconds'] for s in r['steps']], [0, 30, 60, 90, 120])
        self.assertEqual([s['total_water_g'] for s in r['steps']], [50, 100, 150, 200, 250])
        self.assertEqual(r['duration_seconds'], 175)
        self.assertEqual(r['grind_setting'], '11.5')
        self.assertIsNone(r['steps'][3]['temperature_c'])

    def test_source_duration_quirks(self):
        for value, expected in [('s', 0), ('1ms', 60), ('2ms', 120), ('1m30s', 90), ('2m55s', 175), ('1h2m3s', 3723), ('0s', 0), ('broken', None), (None, None), ('', None)]:
            self.assertEqual(seconds(value), expected, value)

    def test_no_dripper_is_empty_not_generic_recipe(self):
        self.response['value'] = [r for r in self.response['value'] if r['device']['kind'] != 'DRIPPER']
        self.assertEqual(parse_recipes(json.dumps(self.response)), [])

    def test_upstream_failure_is_not_empty_result(self):
        with self.assertRaises(SourceError):
            parse_recipes('{"status":"ERROR","value":[]}')

    def test_changed_schema_is_a_source_error(self):
        with self.assertRaises(SourceError):
            parse_recipes('[]')
        recipe = next(r for r in self.response['value'] if r['device']['kind'] == 'DRIPPER')
        recipe['steps'] = {'unexpected': 'schema'}
        with self.assertRaises(SourceError):
            parse_recipes(json.dumps(self.response))

    def test_missing_parameters_and_inconsistent_water_are_visible(self):
        recipe = next(r for r in self.response['value'] if r['device']['kind'] == 'DRIPPER')
        recipe['load'] = 0
        recipe['water'] = 300
        parsed = parse_recipes(json.dumps(self.response))[0]
        self.assertIsNone(parsed['coffee_g'])
        self.assertIsNone(parsed['ratio'])
        self.assertEqual(len(parsed['warnings']), 2)

    def test_multiple_recipe_variants_preserved(self):
        r = copy.deepcopy(next(r for r in self.response['value'] if r['device']['kind'] == 'DRIPPER'))
        r['load'] = 16
        self.response['value'].append(r)
        self.assertEqual(len(parse_recipes(json.dumps(self.response))), 2)

    def test_product_id_is_not_a_sku_or_tracking_id(self):
        self.assertEqual(parse_product('<script>product_id=999</script><div data-id="55664" id="recipe-template"></div>'), '55664')
        with self.assertRaises(SourceError):
            parse_product('<div id="recipe-template-grinders" data-id="999"></div>')

    def test_catalog_deduplicates_sizes_and_selects_filter_roast(self):
        products = parse_catalog((FIXTURES / 'catalog.xml').read_text())
        self.assertEqual(len(products), 2)
        self.assertEqual({p['name'] for p in products}, {'Руанда Суса', 'Эфиопия Лалиса'})

    def test_search_partial_transliteration_typo_and_unknown(self):
        products = parse_catalog((FIXTURES / 'catalog.xml').read_text())
        for query in ['руанда', 'Ruanda Susa', 'Суса', 'РУАНДА СУСА']:
            self.assertEqual(search_products(products, query)[0]['name'], 'Руанда Суса')
        self.assertEqual(search_products(products, 'Руанда Сусса')[0]['match'], 'similar')
        self.assertEqual(search_products(products, 'несуществующий кофе'), [])

    def test_catalog_rejects_entities(self):
        with self.assertRaises(SourceError):
            parse_catalog('<!DOCTYPE x [<!ENTITY x "abc">]><yml_catalog/>')

    def test_outbound_url_allowlist(self):
        self.assertTrue(safe_url('https://theweldercatherine.ru/catalog/a/'))
        for url in ['http://theweldercatherine.ru/', 'https://evil.test/', 'https://theweldercatherine.ru.evil.test/', 'https://user@theweldercatherine.ru/', 'https://127.0.0.1/', 'https://theweldercatherine.ru:8080/']:
            self.assertFalse(safe_url(url))


class CacheTests(unittest.TestCase):
    def test_cache_reuses_data_and_marks_stale_on_failure(self):
        with tempfile.TemporaryDirectory() as path:
            calls = []
            def fetch(url):
                calls.append(url)
                return '{"data":1}'
            cache = SourceCache(path, fetch)
            first, meta = cache.get('test', 60, json.loads)
            cache.get('test', 60, json.loads)
            self.assertEqual(len(calls), 1)
            self.assertFalse(meta['stale'])
            def failed(url):
                raise SourceError('offline')
            cache.fetch = failed
            stale, stale_meta = cache.get('test', -1, json.loads)
            self.assertEqual(stale, first)
            self.assertTrue(stale_meta['stale'])
            self.assertEqual(meta['fetched_at'], stale_meta['fetched_at'])

    def test_bad_new_payload_does_not_replace_valid_cache(self):
        with tempfile.TemporaryDirectory() as path:
            cache = SourceCache(path, lambda url: '{"data":1}')
            cache.get('test', 60, json.loads)
            cache.fetch = lambda url: '<error>'
            result, meta = cache.get('test', -1, json.loads)
            self.assertEqual(result, {'data': 1})
            self.assertTrue(meta['stale'])

    def test_cold_failure_raises(self):
        with tempfile.TemporaryDirectory() as path:
            cache = SourceCache(path, lambda url: 'invalid json')
            with self.assertRaises(SourceError):
                cache.get('test', 60, json.loads)

    def test_expired_stale_data_is_not_used(self):
        with tempfile.TemporaryDirectory() as path:
            cache = SourceCache(path, lambda url: '{"data":1}')
            cache.get('test', 60, json.loads)
            file = next(Path(path).glob('*.json'))
            data = json.loads(file.read_text())
            data['fetched_at'] = time.time() - 8 * 86400
            file.write_text(json.dumps(data))
            cache.fetch = lambda url: 'invalid json'
            with self.assertRaises(SourceError):
                cache.get('test', 60, json.loads)

    def test_unknown_product_cannot_initiate_arbitrary_fetch(self):
        class Cache:
            def get(self, *args):
                return [], {'stale': False}
        with self.assertRaises(KeyError):
            CoffeeService(Cache()).recipe('https://evil.test')


if __name__ == '__main__':
    unittest.main()
