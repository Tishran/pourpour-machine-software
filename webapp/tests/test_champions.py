"""Champion recipes: attributed records only, incomplete ones are errors."""

from copy import deepcopy
import json
import tempfile
import unittest
from pathlib import Path

import server
from brew_catalog import CatalogError
from brewing_engine import adopt_roaster_recipe, restore_recipe
from champions import load_champions
from test_recipe_api import request

FIXTURE = Path(__file__).parent / 'fixtures' / 'champion_recipes.json'
EXAMPLE = load_champions(FIXTURE)['items'][0]


def broken(change):
    data = {'schema_version': 1, 'items': [deepcopy(EXAMPLE)]}
    change(data)
    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory, 'champion_recipes.json')
        path.write_text(json.dumps(data), encoding='utf-8')
        return load_champions(path)


class ChampionTests(unittest.TestCase):
    def test_packaged_catalog_is_honestly_empty(self):
        self.assertEqual(load_champions(), {'schema_version': 1, 'items': []})

    def test_fixture_is_valid_and_attributed(self):
        self.assertEqual(EXAMPLE['id'], 'example_2026')
        self.assertTrue(EXAMPLE['source_url'].startswith('https://'))
        self.assertTrue(EXAMPLE['source_note'])

    def test_rated_like_any_recipe(self):
        recipe = adopt_roaster_recipe({'device': EXAMPLE['brewer'], 'grinder': None,
                                       'grind_setting': EXAMPLE['grind_description'],
                                       **{key: EXAMPLE[key] for key in ('coffee_g', 'water_g', 'temperature_c',
                                                                         'duration_seconds', 'steps')}},
                                      {'name': 'Example Barista', 'url': None, 'kind': 'champion'})
        self.assertEqual((recipe['coffee_g'], recipe['water_g'], recipe['temperature_c']), (15, 250, 93))
        self.assertEqual(restore_recipe(recipe)['source']['kind'], 'champion')

    def test_incomplete_records_are_errors(self):
        item = lambda d: d['items'][0]
        cases = [
            lambda d: item(d).pop('barista'),
            lambda d: item(d).__setitem__('source_url', 'http://example.com'),
            lambda d: item(d).__setitem__('source_note', None),
            lambda d: item(d).update(grind_setting=None, grind_description=None),
            lambda d: item(d)['steps'].pop(),
            lambda d: item(d).__setitem__('steps', []),
            lambda d: item(d).__setitem__('temperature_c', None),
            lambda d: item(d).__setitem__('year', 'last year'),
            lambda d: item(d).__setitem__('extra', True),
            lambda d: d['items'].append(deepcopy(item(d))),
        ]
        for index, change in enumerate(cases):
            with self.subTest(case=index), self.assertRaises(CatalogError):
                broken(change)

    def test_api(self):
        status, body = request('GET', '/api/champions')
        self.assertEqual((status, body), (200, {'schema_version': 1, 'items': []}))
        saved = server.CHAMPIONS
        try:
            server.CHAMPIONS = load_champions(FIXTURE)
            status, body = request('GET', '/api/champions')
            self.assertEqual(body['items'][0]['barista'], 'Example Barista')
        finally:
            server.CHAMPIONS = saved


if __name__ == '__main__':
    unittest.main()
