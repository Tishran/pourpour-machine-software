"""Phase 7: saved and shared calculated recipes are rebuilt from checked fields only."""

from copy import deepcopy
import unittest

from brew_catalog import load_catalog
from brewing_engine import BrewingInputError, adjust, build, rescale, restore_recipe
from machine import recipe_to_machine
from test_recipe_api import request

LINK_DROPS = ('reasons', 'assumptions', 'context_chips', 'name', 'summary')


def compact(recipe):
    """What the share link carries: the recipe without its explanations."""
    result = {key: value for key, value in deepcopy(recipe).items() if key not in LINK_DROPS}
    result['reasons'] = []
    return result


class RestoreTests(unittest.TestCase):
    def setUp(self):
        built = build({'grinder_id': 'comandante_c40_standard', 'processing': 'washed'})[1]
        self.recipe = adjust(built, {'descriptors': ['sour']})['recipe']

    def test_round_trip_keeps_the_recipe(self):
        restored = restore_recipe(compact(self.recipe))
        for key in ('id', 'device_id', 'grinder_id', 'method', 'dose_g', 'water_g', 'ratio', 'temperature_c',
                    'grind', 'grind_setting', 'duration_seconds', 'steps', 'revision', 'machine_compatible',
                    'engine_version', 'origin'):
            self.assertEqual(restored[key], self.recipe[key], key)

    def test_every_built_recipe_can_be_restored(self):
        for device in (row['id'] for row in load_catalog()['devices'] if row['id'] != 'custom_dripper'):
            for recipe in build({'device_id': device}):
                with self.subTest(device=device, variant=recipe['id']):
                    self.assertEqual(restore_recipe(compact(recipe))['steps'], recipe['steps'])

    def test_restored_recipe_says_explanations_did_not_travel(self):
        restored = restore_recipe(compact(self.recipe))
        self.assertEqual([reason['rule'] for reason in restored['reasons']], ['restored'])
        self.assertTrue(restored['assumptions'])
        self.assertEqual(restored['name'], 'Слаще')

    def test_restored_recipe_can_be_rated_rescaled_and_sent_to_the_machine(self):
        restored = restore_recipe(compact(self.recipe))
        self.assertEqual(adjust(restored, {'descriptors': ['bitter']})['recipe']['revision'], 2)
        self.assertEqual(rescale(restored, dose_g=18)['dose_g'], 18)
        self.assertEqual(recipe_to_machine(restored)['water'], restored['water_g'])

    def test_unknown_fields_are_dropped(self):
        recipe = compact(self.recipe)
        recipe['note'] = '<img src=x onerror=alert(1)>'
        recipe['steps'][0]['label'] = '<b>'
        restored = restore_recipe(recipe)
        self.assertNotIn('note', restored)
        self.assertNotIn('label', restored['steps'][0])

    def test_grinder_labels_come_from_the_table(self):
        recipe = compact(self.recipe)
        recipe['grind']['scale_label'] = '<script>'
        recipe['grind']['setting'] = recipe['grind_setting'] = '99'
        restored = restore_recipe(recipe)
        self.assertEqual(restored['grind'], self.recipe['grind'])

    def test_foreign_step_text_is_rejected(self):
        for field, value in (('instruction', '<script>alert(1)</script>'), ('why', 'Trust me.'), ('why', None)):
            with self.subTest(field=field):
                recipe = compact(self.recipe)
                recipe['steps'][0][field] = value
                with self.assertRaises(BrewingInputError):
                    restore_recipe(recipe)

    def test_machine_flag_is_recomputed(self):
        recipe = compact(build({'device_id': 'french_press'})[0])
        recipe['machine_compatible'] = True
        self.assertFalse(restore_recipe(recipe)['machine_compatible'])

    def test_automatic_recipe_keeps_its_mode(self):
        restored = restore_recipe(compact(build({'device_id': 'moccamaster'})[0]))
        self.assertEqual(restored['automatic_mode'], 'standard')
        self.assertEqual(restored['steps'], [])

    def test_edited_flag_must_be_boolean(self):
        recipe = compact(self.recipe)
        recipe['edited'] = True
        self.assertTrue(restore_recipe(recipe)['edited'])
        recipe['edited'] = 'yes'
        with self.assertRaises(BrewingInputError):
            restore_recipe(recipe)

    def test_tampered_numbers_are_rejected(self):
        for change in ({'water_g': 999}, {'temperature_c': 120}, {'ratio': '1:10'}, {'origin': 'roaster'}):
            with self.subTest(change=change):
                recipe = compact(self.recipe)
                recipe.update(change)
                with self.assertRaises(BrewingInputError):
                    restore_recipe(recipe)


class ImportEndpointTests(unittest.TestCase):
    def test_import_returns_the_clean_recipe(self):
        recipe = compact(build({})[0])
        recipe['extra'] = 'dropped'
        status, body = request('POST', '/api/recipes/import', {'recipe': recipe})
        self.assertEqual(status, 200)
        self.assertEqual(body['recipe']['origin'], 'calculated')
        self.assertNotIn('extra', body['recipe'])

    def test_bad_import_payload_is_400(self):
        recipe = compact(build({})[0])
        for payload in ({}, {'recipe': {}}, {'recipe': recipe, 'title': 'x'}, {'recipe': []},
                        {'recipe': {**recipe, 'origin': 'roaster'}}):
            with self.subTest(payload=str(payload)[:40]):
                status, body = request('POST', '/api/recipes/import', payload)
                self.assertEqual(status, 400)
                self.assertTrue(body['error'])

    def test_import_needs_json_from_this_origin(self):
        payload = {'recipe': compact(build({})[0])}
        self.assertEqual(request('POST', '/api/recipes/import', payload, content_type='text/plain')[0], 415)
        self.assertEqual(request('POST', '/api/recipes/import', payload, origin='https://evil.example')[0], 403)
        self.assertEqual(request('POST', '/api/recipes/import', raw=b'{"recipe":{},"recipe":{}}')[0], 400)


if __name__ == '__main__':
    unittest.main()
