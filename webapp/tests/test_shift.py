"""Sandbox: a recipe moved by whole grind steps, degrees and ratio stays a valid recipe."""

import unittest

from brewing_engine import (COEFFICIENTS, BrewingInputError, adopt_roaster_recipe, build, restore_recipe,
                            shift_recipe, validate_calculated_recipe)
from test_experiment import ROASTER, SOURCE, fixed
from test_recipe_api import request


class ShiftTests(unittest.TestCase):
    def test_nothing_moved_is_the_same_recipe(self):
        recipe = build({'device_id': 'v60'})[0]
        self.assertEqual(shift_recipe(recipe, 0, 0, None), recipe)

    def test_each_lever_moves_only_itself(self):
        recipe = build({'device_id': 'v60', 'grinder_id': 'comandante_c40_standard'})[0]
        step = COEFFICIENTS['adjustment']['particle_step_microns']
        finer = shift_recipe(recipe, 2, 0, None)
        self.assertEqual(finer['grind']['target_particle_microns'], recipe['grind']['target_particle_microns'] - 2 * step)
        self.assertNotEqual(finer['grind_setting'], recipe['grind_setting'])
        self.assertEqual((finer['temperature_c'], finer['water_g']), (recipe['temperature_c'], recipe['water_g']))
        hotter = shift_recipe(recipe, 0, 4, None)
        self.assertEqual(hotter['temperature_c'], recipe['temperature_c'] + 4)
        self.assertEqual(hotter['grind'], recipe['grind'])
        denser = shift_recipe(recipe, 0, 0, 15)
        self.assertEqual(denser['water_g'], 15 * recipe['dose_g'])
        self.assertEqual(denser['steps'][-1]['total_water_g'], denser['water_g'])
        for shifted in (finer, hotter, denser):
            self.assertEqual(fixed(shifted)[0:4], fixed(recipe)[0:4])
            validate_calculated_recipe(shifted)
            restore_recipe(shifted)
            self.assertIn('sandbox', [reason['rule'] for reason in shifted['reasons']])

    def test_roaster_recipe_moves_from_its_setting(self):
        recipe = adopt_roaster_recipe(ROASTER, SOURCE)
        shifted = shift_recipe(recipe, 2, -2, None)
        self.assertEqual(shifted['grind']['steps_from_source'], -2)
        self.assertEqual(shifted['grind']['setting'], '10.0')
        self.assertEqual(shifted['temperature_c'], 92)

    def test_limits(self):
        recipe = build({'device_id': 'v60'})[0]
        for args in ((0, 10, None), (30, 0, None), (0, 0, 30), (1.5, 0, None), (True, 0, None)):
            with self.subTest(args=args), self.assertRaises(BrewingInputError):
                shift_recipe(recipe, *args)
        with self.assertRaises(BrewingInputError):
            shift_recipe(adopt_roaster_recipe(ROASTER, SOURCE), 7, 0, None)

    def test_api_returns_recipe_and_chart(self):
        recipe = build({'device_id': 'v60'})[0]
        status, body = request('POST', '/api/recipes/shift',
                               {'recipe': recipe, 'grind_steps': 1, 'temperature_delta': 2, 'ratio': 16})
        self.assertEqual(status, 200)
        self.assertEqual(body['recipe']['temperature_c'], recipe['temperature_c'] + 2)
        self.assertEqual(body['chart']['recipe_line']['ratio'], body['recipe']['ratio'])
        status, _ = request('POST', '/api/recipes/shift', {'recipe': recipe})
        self.assertEqual(status, 400)


if __name__ == '__main__':
    unittest.main()
