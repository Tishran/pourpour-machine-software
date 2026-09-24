"""Taste experiments: two recipes that differ in exactly one parameter."""

import unittest

from brewing_engine import (COEFFICIENTS, BrewingInputError, adopt_roaster_recipe, build, experiment_pair,
                            restore_recipe, validate_calculated_recipe)
from machine import recipe_to_machine
from test_recipe_api import request

ROASTER = {'device': 'V60', 'grinder': 'Mahlkönig EK43', 'grind_setting': '11', 'coffee_g': 15, 'water_g': 250,
           'temperature_c': 94, 'duration_seconds': 180,
           'steps': [{'instruction': 'Предсмачивание', 'water_g': 50, 'start_seconds': 0, 'stop_seconds': 10},
                     {'instruction': 'Вливание', 'water_g': 100, 'start_seconds': 40, 'stop_seconds': 60},
                     {'instruction': 'Вливание', 'water_g': 100, 'start_seconds': 80, 'stop_seconds': 100}]}
SOURCE = {'name': 'Руанда Суса', 'url': None, 'kind': 'catalog'}


def levers(recipe):
    """The three things an experiment may move."""
    grind = recipe['grind']
    return {'temperature': recipe['temperature_c'],
            'grind': (grind.get('target_particle_microns'), grind.get('steps_from_source'), grind.get('setting')),
            'ratio': (recipe['water_g'], recipe['ratio'])}


def fixed(recipe):
    """What never changes between the two cups."""
    return (recipe['dose_g'], recipe['device_id'], recipe['duration_seconds'], recipe['method'],
            [(s['kind'], s['start_seconds'], s['stop_seconds'], s['instruction'], s['why']) for s in recipe['steps']])


class ExperimentTests(unittest.TestCase):
    def check(self, recipe, parameter, change):
        result = experiment_pair(recipe, parameter)
        first, second = result['recipes']
        self.assertEqual(first, recipe, 'the first cup is the recipe as it is')
        self.assertEqual((result['parameter'], result['change']), (parameter, change))
        before, after = levers(first), levers(second)
        self.assertEqual([key for key in before if before[key] != after[key]], [parameter], 'exactly one lever moves')
        self.assertEqual(fixed(first), fixed(second))
        validate_calculated_recipe(second)
        restore_recipe(second)
        self.assertTrue(result['explanation'] and result['explanation_en'])
        return first, second

    def test_each_lever_moves_one_step(self):
        recipe = build({'device_id': 'v60', 'grinder_id': 'comandante_c40_standard'})[0]
        step = COEFFICIENTS['adjustment']
        _, finer = self.check(recipe, 'grind', 'finer')
        self.assertEqual(finer['grind']['target_particle_microns'],
                         recipe['grind']['target_particle_microns'] - step['particle_step_microns'])
        _, hotter = self.check(recipe, 'temperature', 'hotter')
        self.assertEqual(hotter['temperature_c'], recipe['temperature_c'] + step['temperature_step_c'])
        _, denser = self.check(recipe, 'ratio', 'less_water')
        self.assertLess(denser['water_g'], recipe['water_g'])
        self.assertEqual(denser['steps'][-1]['total_water_g'], denser['water_g'])

    def test_limits_turn_the_step_around(self):
        recipe = build({'device_id': 'v60'})[0]
        low_grind = dict(recipe, grind=dict(recipe['grind'], target_particle_microns=400, microns=400))
        self.check(low_grind, 'grind', 'coarser')
        self.check(dict(recipe, temperature_c=99), 'temperature', 'cooler')
        dense = build({'device_id': 'v60', 'dose_g': 20, 'water_g': 240})[1]  # 1:12 is the lower bound
        self.check(dense, 'ratio', 'more_water')

    def test_roaster_recipe_moves_from_the_roaster_setting(self):
        recipe = adopt_roaster_recipe(ROASTER, SOURCE)
        _, second = self.check(recipe, 'grind', 'finer')
        self.assertEqual(second['grind']['steps_from_source'], -1)
        self.assertEqual(second['grind']['setting'], '10.5')
        self.check(recipe, 'temperature', 'hotter')

    def test_second_cup_goes_to_the_machine(self):
        recipe = build({'device_id': 'v60'})[0]
        for parameter in ('grind', 'temperature', 'ratio'):
            second = experiment_pair(recipe, parameter)['recipes'][1]
            self.assertTrue(second['machine_compatible'])
            recipe_to_machine(second)

    def test_bad_requests_are_refused(self):
        recipe = build({'device_id': 'v60'})[0]
        with self.assertRaises(BrewingInputError):
            experiment_pair(recipe, 'dose')
        with self.assertRaises(BrewingInputError):
            experiment_pair(build({'device_id': 'french_press'})[0], 'grind')
        with self.assertRaises(BrewingInputError):
            experiment_pair(dict(recipe, ratio='1:99'), 'grind')

    def test_api(self):
        recipe = build({'device_id': 'v60'})[0]
        status, body = request('POST', '/api/recipes/experiment', {'recipe': recipe, 'parameter': 'grind'})
        self.assertEqual(status, 200)
        self.assertEqual(len(body['recipes']), 2)
        status, _ = request('POST', '/api/recipes/experiment', {'recipe': recipe})
        self.assertEqual(status, 400)


if __name__ == '__main__':
    unittest.main()
