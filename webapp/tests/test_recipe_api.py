"""API contract and conservative feedback corrections for calculated recipes."""

from copy import deepcopy
import io
import json
import unittest
from unittest.mock import Mock

from brewing_engine import BrewingInputError, adjust, build
from server import Handler


def request(method, path, payload=None, *, raw=None, content_type='application/json',
            origin=None, length=None):
    handler = Handler.__new__(Handler)
    handler.path = path
    handler.send_json = Mock()
    handler.connection = Mock()
    if method == 'POST':
        body = raw if raw is not None else json.dumps(payload).encode()
        handler.rfile = io.BytesIO(body)
        handler.headers = {'Content-Type': content_type, 'Content-Length': str(len(body) if length is None else length),
                           'Host': 'coffee.example'}
        if origin:
            handler.headers['Origin'] = origin
        handler.do_POST()
    else:
        handler.headers = {}
        handler.do_GET()
    return handler.send_json.call_args.args


class RecipeAPITests(unittest.TestCase):
    def test_catalog_options_have_validated_categories(self):
        status, body = request('GET', '/api/catalog/options')
        self.assertEqual(status, 200)
        for key in ('countries', 'processing', 'devices', 'grinders', 'filters', 'materials', 'grind_equivalences'):
            self.assertIn(key, body)
        self.assertEqual(body['schema_version'], 1)

    def test_build_returns_calculated_variants(self):
        status, body = request('POST', '/api/recipes/build', {'params': {'device_id': 'v60'}})
        self.assertEqual(status, 200)
        self.assertEqual([r['id'] for r in body['variants']], ['brighter', 'sweeter'])
        self.assertTrue(all(r['origin'] == 'calculated' for r in body['variants']))

    def test_build_not_confused_with_roaster_recipe_route(self):
        status, _ = request('GET', '/api/recipes/build')
        self.assertEqual(status, 400)

    def test_adjust_taste_returns_corrected_recipe(self):
        recipe = build({})[0]
        status, body = request('POST', '/api/recipes/adjust',
                               {'recipe': recipe, 'feedback': {'descriptors': ['sour']}})
        self.assertEqual(status, 200)
        self.assertEqual(body['feedback_signal'], 'under')
        self.assertGreater(body['recipe']['temperature_c'], recipe['temperature_c'])
        self.assertEqual(body['recipe']['origin'], 'calculated')

    def test_adjust_measurement_returns_measured_extraction(self):
        recipe = build({})[0]
        status, body = request('POST', '/api/recipes/adjust',
                               {'recipe': recipe, 'feedback': {'measurement': {
                                   'beverage_tds_percent': 1.3, 'beverage_g': 210,
                                   'dose_g': 15, 'drawdown_seconds': 170}}})
        self.assertEqual(status, 200)
        self.assertAlmostEqual(body['extraction_percent'], 18.2)
        self.assertEqual(body['measurement_kind'], 'measured')

    def test_rescale_keeps_pours_consistent(self):
        recipe = build({})[0]
        status, body = request('POST', '/api/recipes/rescale',
                               {'recipe': recipe, 'dose_g': 20, 'water_g': None})
        self.assertEqual(status, 200)
        changed = body['recipe']
        self.assertEqual(changed['dose_g'], 20)
        self.assertEqual(changed['steps'][-1]['total_water_g'], changed['water_g'])

    def test_rescale_rejects_tampered_recipe(self):
        recipe = build({})[0]
        recipe['steps'][0]['total_water_g'] = 999
        status, body = request('POST', '/api/recipes/rescale',
                               {'recipe': recipe, 'dose_g': 20, 'water_g': None})
        self.assertEqual(status, 400)
        self.assertTrue(body['error'])

    def test_bad_build_payload_is_400(self):
        for payload in ({}, {'params': []}, {'params': {'country': '??'}},
                        {'params': {'dose_g': 'fifteen'}}, {'params': {}, 'debug': True}):
            with self.subTest(payload=payload):
                status, body = request('POST', '/api/recipes/build', payload)
                self.assertEqual(status, 400)
                self.assertTrue(body['error'])

    def test_bad_adjust_payload_is_400(self):
        recipe = build({})[0]
        for payload in ({}, {'recipe': recipe},
                        {'recipe': recipe, 'feedback': {'descriptors': ['unknown']}},
                        {'recipe': {'origin': 'roaster'}, 'feedback': {'descriptors': ['sour']}}):
            with self.subTest(payload=payload):
                status, body = request('POST', '/api/recipes/adjust', payload)
                self.assertEqual(status, 400)
                self.assertTrue(body['error'])

    def test_invalid_json_is_400(self):
        status, body = request('POST', '/api/recipes/build', raw=b'{oops')
        self.assertEqual(status, 400)
        self.assertEqual(body['error'], 'Invalid JSON.')

    def test_nonfinite_or_duplicate_json_is_400(self):
        for raw in (b'{"params":{"dose_g":NaN}}', b'{"params":{},"params":{}}'):
            with self.subTest(raw=raw):
                status, body = request('POST', '/api/recipes/build', raw=raw)
                self.assertEqual(status, 400)
                self.assertTrue(body['error'])

    def test_wrong_content_type_is_415(self):
        status, _ = request('POST', '/api/recipes/build', {'params': {}}, content_type='text/plain')
        self.assertEqual(status, 415)

    def test_oversized_body_is_413(self):
        status, _ = request('POST', '/api/recipes/build', {'params': {}}, length=60001)
        self.assertEqual(status, 413)

    def test_foreign_origin_is_403(self):
        status, _ = request('POST', '/api/recipes/build', {'params': {}}, origin='https://evil.example')
        self.assertEqual(status, 403)

    def test_unknown_route_is_404(self):
        status, _ = request('POST', '/api/recipes/nope', {})
        self.assertEqual(status, 404)


class AdjustmentTests(unittest.TestCase):
    def setUp(self):
        self.recipe = build({'grinder_id': 'comandante_c40_standard'})[0]

    def test_under_extracts_more_using_at_most_two_parameters(self):
        corrected = adjust(self.recipe, {'descriptors': ['sour']})
        self.assertLessEqual(len(corrected['changes']), 2)
        self.assertTrue(corrected['explanation'])
        self.assertTrue(all(change['why'] for change in corrected['changes']))
        self.assertGreater(corrected['recipe']['temperature_c'], self.recipe['temperature_c'])
        self.assertLess(corrected['recipe']['grind']['microns'], self.recipe['grind']['microns'])
        self.assertEqual(corrected['recipe']['water_g'], self.recipe['water_g'])

    def test_over_extracts_less(self):
        corrected = adjust(self.recipe, {'descriptors': ['bitter']})
        self.assertLess(corrected['recipe']['temperature_c'], self.recipe['temperature_c'])
        self.assertGreater(corrected['recipe']['grind']['microns'], self.recipe['grind']['microns'])

    def test_watery_without_sweetness_does_not_strengthen(self):
        corrected = adjust(self.recipe, {'descriptors': ['watery']})
        self.assertEqual(corrected['recipe']['water_g'], self.recipe['water_g'])
        self.assertEqual(corrected['changes'], [])

    def test_watery_after_sweetness_can_strengthen(self):
        corrected = adjust(self.recipe, {'descriptors': ['sweet', 'watery']})
        self.assertLess(corrected['recipe']['water_g'], self.recipe['water_g'])
        self.assertEqual(len(corrected['changes']), 1)
        self.assertEqual(corrected['recipe']['steps'][-1]['total_water_g'], corrected['recipe']['water_g'])

    def test_syrupy_after_sweetness_can_dilute(self):
        corrected = adjust(self.recipe, {'descriptors': ['sweet', 'syrupy']})
        self.assertGreater(corrected['recipe']['water_g'], self.recipe['water_g'])

    def test_measured_under_extracts_more(self):
        result = adjust(self.recipe, {'measurement': {
            'beverage_tds_percent': 1, 'beverage_g': 200,
            'dose_g': 15, 'drawdown_seconds': 160}})
        self.assertEqual(result['feedback_signal'], 'under')
        self.assertGreater(result['recipe']['temperature_c'], self.recipe['temperature_c'])

    def test_measured_over_extracts_less(self):
        result = adjust(self.recipe, {'measurement': {
            'beverage_tds_percent': 1.8, 'beverage_g': 210,
            'dose_g': 15, 'drawdown_seconds': 210}})
        self.assertEqual(result['feedback_signal'], 'over')
        self.assertLess(result['recipe']['temperature_c'], self.recipe['temperature_c'])

    def test_taste_does_not_invent_extraction(self):
        result = adjust(self.recipe, {'descriptors': ['sour']})
        self.assertIsNone(result['extraction_percent'])
        self.assertEqual(result['measurement_kind'], 'taste_only')

    def test_input_recipe_not_mutated(self):
        before = deepcopy(self.recipe)
        adjust(self.recipe, {'descriptors': ['sour']})
        self.assertEqual(self.recipe, before)

    def test_conflicting_descriptors_rejected(self):
        for items in (['sour', 'sweet'], ['sour', 'bitter'], ['balanced', 'dry']):
            with self.subTest(items=items), self.assertRaises(BrewingInputError):
                adjust(self.recipe, {'descriptors': items})

    def test_measurement_dose_must_match_recipe(self):
        with self.assertRaises(BrewingInputError):
            adjust(self.recipe, {'measurement': {
                'beverage_tds_percent': 1.3, 'beverage_g': 210,
                'dose_g': 16, 'drawdown_seconds': 170}})

    def test_malformed_feedback_rejected(self):
        for feedback in (None, {}, {'descriptors': []}, {'descriptors': ['sour', 'sour']},
                         {'measurement': {}}, {'descriptors': ['sour'], 'measurement': {}}):
            with self.subTest(feedback=feedback), self.assertRaises(BrewingInputError):
                adjust(self.recipe, feedback)

    def test_tampered_recipe_steps_rejected(self):
        recipe = deepcopy(self.recipe)
        recipe['steps'][0]['total_water_g'] = 999
        with self.assertRaises(BrewingInputError):
            adjust(recipe, {'descriptors': ['sour']})

    def test_unhashable_recipe_id_rejected(self):
        recipe = deepcopy(self.recipe)
        recipe['id'] = []
        with self.assertRaises(BrewingInputError):
            adjust(recipe, {'descriptors': ['sour']})

    def test_adjustment_is_repeatable_on_new_recipe(self):
        first = adjust(self.recipe, {'descriptors': ['sour']})['recipe']
        second = adjust(first, {'descriptors': ['balanced']})
        self.assertEqual(second['changes'], [])


if __name__ == '__main__':
    unittest.main()
