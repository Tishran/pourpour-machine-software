"""Phase 6: taste descriptors, refractometer, extraction chart and corrected recipes."""

from copy import deepcopy
from itertools import combinations
import unittest

from brewing_engine import (COEFFICIENTS, BrewingInputError, adjust, build, extraction_chart,
                            taste_options)
from machine import recipe_to_machine
from test_recipe_api import request


def measurement(tds, beverage=210, dose=15, drawdown=170):
    return {'measurement': {'beverage_tds_percent': tds, 'beverage_g': beverage,
                            'dose_g': dose, 'drawdown_seconds': drawdown}}


class TasteOptionTests(unittest.TestCase):
    def setUp(self):
        self.options = taste_options()
        self.ids = [item for column in self.options['columns'] for item in column['descriptors']]
        self.recipe = build({})[0]

    def test_three_columns_with_every_descriptor_once(self):
        self.assertEqual([c['id'] for c in self.options['columns']],
                         ['acidity_sweetness', 'body_strength', 'finish_clarity'])
        self.assertEqual(len(self.ids), 14)
        self.assertEqual(len(set(self.ids)), 14)
        self.assertEqual(self.options['max_selected'], 3)

    def test_conflicts_are_symmetric(self):
        conflicts = self.options['conflicts']
        for item, others in conflicts.items():
            self.assertNotIn(item, others)
            for other in others:
                self.assertIn(item, conflicts[other])

    def test_sour_switches_off_sweet_and_balanced(self):
        self.assertIn('sweet', self.options['conflicts']['sour'])
        self.assertIn('balanced', self.options['conflicts']['sour'])

    def test_thin_and_thick_body_conflict(self):
        self.assertIn('syrupy', self.options['conflicts']['watery'])

    def test_form_conflicts_match_what_the_engine_accepts(self):
        conflicts = self.options['conflicts']
        for first, second in combinations(self.ids, 2):
            with self.subTest(pair=(first, second)):
                if second in conflicts[first]:
                    with self.assertRaises(BrewingInputError):
                        adjust(self.recipe, {'descriptors': [first, second]})
                else:
                    self.assertIn('diagnosis_code', adjust(self.recipe, {'descriptors': [first, second]}))

    def test_catalog_endpoint_serves_taste_options(self):
        status, body = request('GET', '/api/catalog/options')
        self.assertEqual(status, 200)
        self.assertEqual(body['tastes'], self.options)


class DiagnosisTests(unittest.TestCase):
    def setUp(self):
        self.recipe = build({'grinder_id': 'comandante_c40_standard'})[0]

    def test_every_single_descriptor_changes_at_most_two_parameters(self):
        for item in [d for c in taste_options()['columns'] for d in c['descriptors']]:
            with self.subTest(item=item):
                result = adjust(self.recipe, {'descriptors': [item]})
                self.assertLessEqual(len(result['changes']), 2)
                self.assertTrue(result['diagnosis'] and result['diagnosis_en'])
                self.assertTrue(result['explanation'] and result['explanation_en'])

    def test_strength_alone_waits_for_sweetness(self):
        for item in ('watery', 'syrupy'):
            with self.subTest(item=item):
                result = adjust(self.recipe, {'descriptors': [item]})
                self.assertEqual(result['diagnosis_code'], 'strength_needs_sweetness')
                self.assertEqual(result['changes'], [])
                self.assertEqual(result['recipe']['water_g'], self.recipe['water_g'])

    def test_sweet_and_balanced_are_on_target(self):
        for items in (['sweet'], ['balanced']):
            with self.subTest(items=items):
                result = adjust(self.recipe, {'descriptors': items})
                self.assertEqual(result['diagnosis_code'], 'on_target')
                self.assertEqual(result['changes'], [])

    def test_extraction_fixed_before_strength(self):
        result = adjust(self.recipe, {'descriptors': ['sour', 'watery']})
        self.assertEqual(result['diagnosis_code'], 'under')
        self.assertEqual({c['parameter'] for c in result['changes']}, {'temperature_c', 'grind'})
        self.assertEqual(result['recipe']['water_g'], self.recipe['water_g'])

    def test_grind_change_names_old_and_new_setting(self):
        change = next(c for c in adjust(self.recipe, {'descriptors': ['sour']})['changes']
                      if c['parameter'] == 'grind')
        self.assertEqual(change['before_setting'], self.recipe['grind']['setting'])
        self.assertNotEqual(change['after_setting'], change['before_setting'])
        self.assertLess(change['after'], change['before'])
        self.assertTrue(change['why'] and change['why_en'] and change['scale_label'])

    def test_unmapped_grinder_changes_only_the_nominal_target(self):
        recipe = build({})[0]
        change = next(c for c in adjust(recipe, {'descriptors': ['bitter']})['changes']
                      if c['parameter'] == 'grind')
        self.assertIsNone(change['before_setting'])
        self.assertIsNone(change['after_setting'])
        self.assertGreater(change['after'], change['before'])

    def test_water_change_reports_ratios(self):
        change = adjust(self.recipe, {'descriptors': ['sweet', 'watery']})['changes'][0]
        self.assertEqual(change['parameter'], 'water_g')
        self.assertEqual(change['ratio_before'], self.recipe['ratio'])
        self.assertNotEqual(change['ratio_after'], change['ratio_before'])

    def test_measured_weak_cup_does_not_get_stronger(self):
        # 250 g × 1.10 % / 15 g = 18.3 % extraction: on target, but a weak cup.
        result = adjust(self.recipe, measurement(1.1, beverage=250))
        self.assertEqual(result['feedback_signal'], 'hold')
        self.assertEqual(result['strength'], 'weak')
        self.assertEqual(result['diagnosis_code'], 'strength_needs_sweetness')
        self.assertEqual(result['changes'], [])

    def test_measured_on_target_keeps_recipe(self):
        result = adjust(self.recipe, measurement(1.35, beverage=230))
        self.assertEqual(result['diagnosis_code'], 'on_target')
        self.assertEqual(result['strength'], 'on_target')
        self.assertEqual(result['changes'], [])
        self.assertIn('20,7', result['explanation'])
        self.assertIn('20.7', result['explanation_en'])

    def test_measured_explanation_names_extraction(self):
        result = adjust(self.recipe, measurement(1.0, beverage=200))
        self.assertEqual(result['diagnosis_code'], 'under')
        self.assertIn('13,3', result['explanation'])

    def test_limit_reports_that_nothing_could_change(self):
        recipe = build({})[0]
        recipe['temperature_c'] = 99
        recipe['grind'].update({'target_particle_microns': 400, 'microns': 400})
        result = adjust(recipe, {'descriptors': ['sour']})
        self.assertEqual(result['changes'], [])
        self.assertTrue(result['at_limit'])
        self.assertFalse(adjust(recipe, {'descriptors': ['balanced']})['at_limit'])


class RevisionTests(unittest.TestCase):
    def setUp(self):
        self.recipe = build({'grinder_id': 'baratza_encore'})[0]

    def test_correction_numbers_revisions(self):
        first = adjust(self.recipe, {'descriptors': ['sour']})['recipe']
        second = adjust(first, {'descriptors': ['sharp']})['recipe']
        self.assertEqual(first['revision'], 1)
        self.assertEqual(second['revision'], 2)
        self.assertEqual(second['engine_version'], COEFFICIENTS['version'])

    def test_no_change_keeps_revision(self):
        result = adjust(self.recipe, {'descriptors': ['balanced']})
        self.assertNotIn('revision', result['recipe'])
        self.assertEqual(result['recipe'], self.recipe)

    def test_previous_compatible_version_is_accepted(self):
        recipe = deepcopy(self.recipe)
        recipe['engine_version'] = '2.0'
        corrected = adjust(recipe, {'descriptors': ['sour']})['recipe']
        self.assertEqual(corrected['engine_version'], COEFFICIENTS['version'])

    def test_unknown_version_and_bad_revision_rejected(self):
        for field, value in (('engine_version', '1.0'), ('revision', -1), ('revision', True), ('revision', '2')):
            with self.subTest(field=field, value=value):
                recipe = deepcopy(self.recipe)
                recipe[field] = value
                with self.assertRaises(BrewingInputError):
                    adjust(recipe, {'descriptors': ['sour']})

    def test_user_edited_temperature_is_accepted(self):
        recipe = deepcopy(self.recipe)
        recipe.update(temperature_c=90, edited=True)
        corrected = adjust(recipe, {'descriptors': ['sour']})['recipe']
        self.assertEqual(corrected['temperature_c'], 92)
        self.assertNotIn('edited', corrected)

    def test_corrected_pour_recipe_still_goes_to_the_machine(self):
        corrected = adjust(self.recipe, {'descriptors': ['bitter']})['recipe']
        self.assertTrue(corrected['machine_compatible'])
        self.assertEqual(recipe_to_machine(corrected)['temperature'], corrected['temperature_c'])

    def test_immersion_and_automatic_can_be_corrected(self):
        for device in ('french_press', 'clever', 'moccamaster'):
            with self.subTest(device=device):
                recipe = build({'device_id': device})[1]
                result = adjust(recipe, {'descriptors': ['sour']})
                self.assertEqual(result['recipe']['method'], recipe['method'])
                self.assertIsNotNone(result['chart']['recipe_line']['points'])


class ChartTests(unittest.TestCase):
    def setUp(self):
        self.recipe = build({})[0]
        self.chart = COEFFICIENTS['chart']

    def inside(self, point):
        x_low, x_high = self.chart['extraction_percent']
        y_low, y_high = self.chart['tds_percent']
        return x_low <= point[0] <= x_high and y_low - 1e-6 <= point[1] <= y_high + 1e-6

    def test_ratio_diagonals_cover_12_to_22_inside_the_chart(self):
        lines = extraction_chart(self.recipe)['ratio_lines']
        self.assertEqual([line['ratio'] for line in lines], list(range(12, 23)))
        for line in lines:
            self.assertTrue(all(self.inside(point) for point in line['points']))
            self.assertLess(line['points'][0][0], line['points'][1][0])

    def test_wider_ratio_is_weaker_at_the_same_extraction(self):
        retained = self.chart['retained_water_g_per_g']
        strengths = [20 / (ratio - retained) for ratio in range(12, 23)]
        self.assertEqual(strengths, sorted(strengths, reverse=True))

    def test_recipe_line_follows_dose_and_water(self):
        line = extraction_chart(self.recipe)['recipe_line']
        retained = self.chart['retained_water_g_per_g']
        for extraction, tds in line['points']:
            expected = extraction * self.recipe['dose_g'] / (self.recipe['water_g'] - retained * self.recipe['dose_g'])
            self.assertAlmostEqual(tds, expected, places=2)

    def test_balance_zone_is_the_sca_reference(self):
        zone = extraction_chart(self.recipe)['balanced']
        self.assertEqual(zone, {'extraction': [18, 22], 'tds': [1.15, 1.45]})

    def test_measured_cup_is_a_point_from_the_formula(self):
        result = adjust(self.recipe, measurement(1.3, beverage=210))
        cup = result['chart']['cup']
        self.assertEqual(cup['kind'], 'measured')
        self.assertAlmostEqual(cup['extraction_percent'], 210 * 1.3 / 15, places=2)
        self.assertEqual(cup['tds_percent'], 1.3)
        self.assertTrue(cup['inside'])

    def test_measurement_outside_the_chart_is_flagged(self):
        cup = adjust(self.recipe, measurement(0.5, beverage=200))['chart']['cup']
        self.assertFalse(cup['inside'])

    def test_taste_gives_a_band_on_the_recipe_line_never_a_point(self):
        result = adjust(self.recipe, {'descriptors': ['sour']})
        cup = result['chart']['cup']
        self.assertEqual(cup['kind'], 'estimate')
        self.assertIsNone(result['extraction_percent'])
        self.assertIsNone(result['tds_percent'])
        self.assertNotIn('extraction_percent', cup)
        self.assertLessEqual(cup['points'][1][0], 18)
        line = result['chart']['recipe_line']['points']
        slope = (line[1][1] - line[0][1]) / (line[1][0] - line[0][0])
        for extraction, tds in cup['points']:
            self.assertAlmostEqual(tds, line[0][1] + slope * (extraction - line[0][0]), places=2)

    def test_over_extraction_band_is_right_of_the_balance_zone(self):
        cup = adjust(self.recipe, {'descriptors': ['bitter']})['chart']['cup']
        self.assertGreaterEqual(cup['points'][0][0], 22)

    def test_strength_only_band_spans_the_whole_axis(self):
        cup = adjust(self.recipe, {'descriptors': ['watery']})['chart']['cup']
        self.assertEqual(cup['extraction_range'], list(self.chart['extraction_percent']))

    def test_chart_uses_the_brewed_recipe_not_the_correction(self):
        brewed = build({})[1]
        result = adjust(brewed, {'descriptors': ['sweet', 'watery']})
        self.assertEqual(result['chart']['recipe_line']['ratio'], brewed['ratio'])

    def test_adjust_endpoint_returns_chart_and_code(self):
        status, body = request('POST', '/api/recipes/adjust',
                               {'recipe': self.recipe, 'feedback': {'descriptors': ['dry']}})
        self.assertEqual(status, 200)
        self.assertEqual(body['diagnosis_code'], 'over')
        self.assertEqual(body['chart']['cup']['kind'], 'estimate')
        self.assertEqual(body['recipe']['revision'], 1)


if __name__ == '__main__':
    unittest.main()
