"""Phase 8: a roaster recipe can be rated and corrected without being changed."""

from copy import deepcopy
import unittest

from brewing_engine import BrewingInputError, adjust, adopt_roaster_recipe, rescale, restore_recipe
from machine import recipe_to_machine
from recommender import RecipeModel, ui_recipe
from test_recipe_api import request

SOURCE = {'name': 'Руанда Суса', 'url': 'https://theweldercatherine.ru/catalog/dlya_filtra/ruanda_susa/',
          'kind': 'catalog'}


def roaster_recipe(**changes):
    """The shape pourpour.parse_recipes returns for a DRIPPER recipe."""
    recipe = {'name': 'V60', 'device': 'Hario V60', 'coffee_g': 15, 'water_g': 240, 'temperature_c': 96,
              'duration_seconds': 200, 'ratio': 16.0, 'grinder': 'Mahlkönig EK43 ICON (coffee) Диск 1-16',
              'grind_setting': '11.5', 'notes': '', 'warnings': [],
              'steps': [{'instruction': 'Предсмачивание', 'water_g': 50, 'total_water_g': 50, 'temperature_c': 96,
                         'start_seconds': 0, 'stop_seconds': 15},
                        {'instruction': 'Вливание', 'water_g': 100, 'total_water_g': 150, 'temperature_c': 96,
                         'start_seconds': 30, 'stop_seconds': 75},
                        {'instruction': 'Вливание', 'water_g': 90, 'total_water_g': 240, 'temperature_c': 96,
                         'start_seconds': 90, 'stop_seconds': 130}]}
    recipe.update(changes)
    return recipe


class AdoptTests(unittest.TestCase):
    def setUp(self):
        self.source = roaster_recipe()
        self.adopted = adopt_roaster_recipe(self.source, SOURCE)

    def test_numbers_and_steps_stay_as_the_roaster_published(self):
        for key in ('coffee_g', 'water_g', 'temperature_c', 'duration_seconds'):
            self.assertEqual(self.adopted[key], self.source[key])
        self.assertEqual([s['instruction'] for s in self.adopted['steps']], ['Предсмачивание', 'Вливание', 'Вливание'])
        self.assertEqual([s['total_water_g'] for s in self.adopted['steps']], [50, 150, 240])
        self.assertEqual(self.adopted['grind_setting'], '11.5')
        self.assertEqual(self.adopted['device_id'], 'v60')

    def test_marked_as_based_on_the_roaster_recipe(self):
        self.assertEqual(self.adopted['basis'], 'roaster')
        self.assertEqual(self.adopted['source'], SOURCE)
        self.assertNotIn('revision', self.adopted)
        self.assertEqual([r['rule'] for r in self.adopted['reasons']], ['roaster_source'])

    def test_source_recipe_is_not_mutated(self):
        before = deepcopy(self.source)
        adjust(adopt_roaster_recipe(self.source, SOURCE), {'descriptors': ['sour']})
        self.assertEqual(self.source, before)

    def test_unknown_device_becomes_a_custom_dripper_with_its_name(self):
        adopted = adopt_roaster_recipe(roaster_recipe(device='Stagg XF'), SOURCE)
        self.assertEqual((adopted['device_id'], adopted['device_label']), ('custom_dripper', 'Stagg XF'))

    def test_incomplete_or_contradictory_source_is_refused(self):
        steps = roaster_recipe()['steps']
        broken = [
            {'coffee_g': None}, {'duration_seconds': None}, {'temperature_c': 120}, {'steps': []},
            {'water_g': 250},  # pours add up to 240
            {'steps': [dict(steps[0], stop_seconds=None)] + steps[1:]},
            {'steps': [steps[1], steps[0], steps[2]]},  # overlapping times
            {'grinder': '<b>' * 60},
        ]
        for change in broken:
            with self.subTest(change=str(change)[:50]), self.assertRaises(BrewingInputError):
                adopt_roaster_recipe(roaster_recipe(**change), SOURCE)

    def test_source_must_be_a_roaster_page(self):
        for source in (None, {}, dict(SOURCE, url='https://evil.example/catalog/x'), dict(SOURCE, kind='other'),
                       dict(SOURCE, name=''), dict(SOURCE, extra=1)):
            with self.subTest(source=source), self.assertRaises(BrewingInputError):
                adopt_roaster_recipe(roaster_recipe(), source)
        self.assertIsNone(adopt_roaster_recipe(roaster_recipe(), dict(SOURCE, url=None))['source']['url'])

    def test_every_complete_dataset_recipe_can_be_adopted(self):
        model = RecipeModel()
        adopted = 0
        for row in model.rows:
            try:
                adopt_roaster_recipe(ui_recipe(row['recipe']), dict(SOURCE, name=row['coffee']['name']))
                adopted += 1
            except BrewingInputError:
                self.assertFalse(row['usable'], row['coffee']['name'])
        self.assertGreaterEqual(adopted, 35)


class RoasterCorrectionTests(unittest.TestCase):
    def setUp(self):
        self.adopted = adopt_roaster_recipe(roaster_recipe(), SOURCE)

    def test_sour_cup_gets_hotter_and_one_step_finer(self):
        result = adjust(self.adopted, {'descriptors': ['sour']})
        recipe = result['recipe']
        self.assertEqual(recipe['temperature_c'], 98)
        self.assertEqual(recipe['grind_setting'], '11.0')
        self.assertEqual(recipe['revision'], 1)
        grind = next(c for c in result['changes'] if c['parameter'] == 'grind')
        self.assertEqual((grind['before_setting'], grind['after_setting'], grind['basis']), ('11.5', '11.0', 'roaster'))
        self.assertLessEqual(len(result['changes']), 2)

    def test_bitter_cup_gets_cooler_and_coarser(self):
        recipe = adjust(self.adopted, {'descriptors': ['bitter']})['recipe']
        self.assertEqual((recipe['temperature_c'], recipe['grind_setting']), (94, '12.0'))

    def test_repeated_corrections_move_from_the_roaster_setting(self):
        first = adjust(self.adopted, {'descriptors': ['sour']})['recipe']
        second = adjust(first, {'descriptors': ['sharp']})['recipe']
        self.assertEqual((second['grind']['steps_from_source'], second['grind_setting']), (-2, '10.5'))
        self.assertEqual(second['grind']['source_setting'], '11.5')

    def test_other_grinders_move_one_click(self):
        adopted = adopt_roaster_recipe(roaster_recipe(grinder='Comandante C40', grind_setting='22'), SOURCE)
        self.assertEqual(adjust(adopted, {'descriptors': ['sour']})['recipe']['grind_setting'], '21')

    def test_text_setting_is_corrected_relatively(self):
        adopted = adopt_roaster_recipe(roaster_recipe(grind_setting='medium-fine'), SOURCE)
        result = adjust(adopted, {'descriptors': ['sour']})
        grind = next(c for c in result['changes'] if c['parameter'] == 'grind')
        self.assertIsNone(grind['after_setting'])
        self.assertEqual(grind['after'], -1)

    def test_sweetness_then_strength_changes_water_only(self):
        result = adjust(self.adopted, {'descriptors': ['sweet', 'watery']})
        self.assertEqual([c['parameter'] for c in result['changes']], ['water_g'])
        self.assertEqual(result['recipe']['grind_setting'], '11.5')

    def test_forged_setting_is_rejected(self):
        corrected = adjust(self.adopted, {'descriptors': ['sour']})['recipe']
        for field, value in (('setting', '5.0'), ('steps_from_source', 40), ('basis', None)):
            with self.subTest(field=field):
                forged = deepcopy(corrected)
                forged['grind'][field] = value
                with self.assertRaises(BrewingInputError):
                    adjust(forged, {'descriptors': ['sour']})

    def test_corrected_roaster_recipe_is_usable_everywhere(self):
        corrected = adjust(self.adopted, {'descriptors': ['sour']})['recipe']
        self.assertEqual(rescale(corrected, dose_g=18)['water_g'], 288)
        self.assertEqual(recipe_to_machine(corrected)['temperature'], 98)
        shared = {k: v for k, v in corrected.items() if k not in ('reasons', 'assumptions', 'name', 'summary')}
        shared['reasons'] = []
        restored = restore_recipe(shared)
        self.assertEqual((restored['grind_setting'], restored['source']['name']), ('11.0', 'Руанда Суса'))
        self.assertEqual(restored['steps'], corrected['steps'])

    def test_roaster_step_text_is_plain_text_only(self):
        corrected = adjust(self.adopted, {'descriptors': ['sour']})['recipe']
        forged = deepcopy(corrected)
        forged['steps'][0]['instruction'] = 'x\n<script>'
        with self.assertRaises(BrewingInputError):
            restore_recipe(forged)


class CoffeeProfileEndpointTests(unittest.TestCase):
    def test_known_catalog_coffee_has_its_profile(self):
        row = next(r for r in RecipeModel().rows if r['profile']['country'])
        status, body = request('GET', f"/api/coffee/profile?url={row['coffee']['url']}")
        self.assertEqual(status, 200)
        self.assertEqual(body['profile']['country'], row['profile']['country'])
        self.assertEqual(set(body['profile']), {'country', 'processing', 'variety', 'region'})

    def test_unknown_coffee_has_no_profile(self):
        self.assertEqual(request('GET', '/api/coffee/profile?url=https://example.com/x')[1], {'profile': None})
        self.assertEqual(request('GET', '/api/coffee/profile?url=' + 'x' * 301)[0], 400)


class AdoptEndpointTests(unittest.TestCase):
    def test_adopt_returns_the_engine_copy(self):
        status, body = request('POST', '/api/recipes/adopt', {'recipe': roaster_recipe(), 'source': SOURCE})
        self.assertEqual(status, 200)
        self.assertEqual(body['recipe']['basis'], 'roaster')

    def test_bad_adopt_payload_is_400(self):
        for payload in ({}, {'recipe': roaster_recipe()}, {'recipe': roaster_recipe(coffee_g=None), 'source': SOURCE},
                        {'recipe': roaster_recipe(), 'source': SOURCE, 'extra': 1}):
            with self.subTest(payload=str(payload)[:40]):
                status, body = request('POST', '/api/recipes/adopt', payload)
                self.assertEqual(status, 400)
                self.assertTrue(body['error'])


if __name__ == '__main__':
    unittest.main()
