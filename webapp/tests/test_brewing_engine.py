"""Behavioral checks for the deterministic, approximate starting recipe engine."""

from copy import deepcopy
import unittest

from brewing_engine import BrewingInputError, build, rescale
from machine import MachineError, recipe_to_machine


def brighter(**changes):
    return build({'device_id': 'v60', **changes})[0]


class BuildTests(unittest.TestCase):
    def test_two_ordered_variants(self):
        self.assertEqual([r['id'] for r in build({})], ['brighter', 'sweeter'])

    def test_deterministic(self):
        params = {'processing': 'washed', 'roast_age_band': 'fresh'}
        self.assertEqual(build(params), build(deepcopy(params)))

    def test_does_not_mutate_input(self):
        params = {'device_id': 'v60', 'water_g': 300}
        before = deepcopy(params)
        build(params)
        self.assertEqual(params, before)

    def test_calculated_not_roaster(self):
        self.assertTrue(all(r['origin'] == 'calculated' for r in build({})))

    def test_base_ratio_and_duration(self):
        recipe = brighter()
        self.assertEqual(recipe['dose_g'], 15)
        self.assertTrue(12 <= recipe['water_g'] / recipe['dose_g'] <= 22)
        self.assertTrue(150 <= recipe['duration_seconds'] <= 180)

    def test_brighter_is_wider_finer_with_fewer_pours(self):
        bright, sweet = build({})
        self.assertGreater(bright['water_g'], sweet['water_g'])
        self.assertLess(bright['grind']['microns'], sweet['grind']['microns'])
        self.assertLess(len(bright['steps']), len(sweet['steps']))

    def test_sweeter_has_longer_contact(self):
        bright, sweet = build({})
        self.assertGreater(sweet['duration_seconds'], bright['duration_seconds'])

    def test_dark_roast_lowers_temperature(self):
        self.assertLess(brighter(roast_level='dark')['temperature_c'], brighter(roast_level='light')['temperature_c'])

    def test_dark_roast_coarser(self):
        self.assertGreater(brighter(roast_level='dark')['grind']['microns'], brighter(roast_level='light')['grind']['microns'])

    def test_dark_roast_shorter(self):
        self.assertLess(brighter(roast_level='dark')['total_seconds'], brighter(roast_level='light')['total_seconds'])

    def test_roast_pro_scale(self):
        self.assertGreater(brighter(roast_level=1)['temperature_c'], brighter(roast_level=7)['temperature_c'])
        self.assertEqual(brighter(roast_level=7)['temperature_c'], brighter(roast_level='dark')['temperature_c'])

    def test_fresh_bloom_larger(self):
        fresh = brighter(roast_age_band='fresh')['steps'][0]['pour_g']
        older = brighter(roast_age_band='over_1_month')['steps'][0]['pour_g']
        self.assertGreater(fresh, older)

    def test_fresh_bloom_wait_longer(self):
        fresh = brighter(roast_age_band='fresh')['steps'][1]['start_seconds']
        older = brighter(roast_age_band='over_1_month')['steps'][1]['start_seconds']
        self.assertGreater(fresh, older)

    def test_old_roast_hotter(self):
        self.assertGreater(brighter(roast_age_band='over_2_months')['temperature_c'],
                           brighter(roast_age_band='over_1_month')['temperature_c'])

    def test_old_roast_finer(self):
        self.assertLess(brighter(roast_age_band='over_2_months')['grind']['microns'],
                        brighter(roast_age_band='over_1_month')['grind']['microns'])

    def test_natural_coarser_than_washed(self):
        self.assertGreater(brighter(processing='natural')['grind']['microns'],
                           brighter(processing='washed')['grind']['microns'])

    def test_natural_uses_gentler_pour(self):
        natural = brighter(processing='natural')
        washed = brighter(processing='washed')
        self.assertIn('центру', natural['steps'][1]['instruction'])
        self.assertNotIn('центру', washed['steps'][1]['instruction'])

    def test_anaerobic_coarser_than_washed(self):
        self.assertGreater(brighter(processing='washed_anaerobic')['grind']['microns'],
                           brighter(processing='washed')['grind']['microns'])

    def test_washed_hotter_than_natural(self):
        self.assertGreater(brighter(processing='washed')['temperature_c'],
                           brighter(processing='natural')['temperature_c'])

    def test_flat_bed_has_more_pours(self):
        self.assertGreater(len(build({'device_id': 'april'})[1]['steps']),
                           len(build({'device_id': 'v60'})[1]['steps']))

    def test_flat_bed_coarser(self):
        self.assertGreater(brighter(device_id='april')['grind']['microns'],
                           brighter(device_id='v60')['grind']['microns'])

    def test_metal_hotter_than_plastic(self):
        self.assertGreater(brighter(material='metal')['temperature_c'],
                           brighter(material='plastic')['temperature_c'])

    def test_glass_hotter_than_plastic(self):
        self.assertGreater(brighter(material='glass')['temperature_c'],
                           brighter(material='plastic')['temperature_c'])

    def test_dense_filter_coarser(self):
        self.assertGreater(brighter(filter_id='dense_paper')['grind']['microns'],
                           brighter(filter_id='standard_paper')['grind']['microns'])

    def test_low_tds_finer(self):
        self.assertLess(brighter(water_tds_ppm=40)['grind']['microns'],
                        brighter(water_tds_ppm=120)['grind']['microns'])

    def test_high_tds_coarser(self):
        self.assertGreater(brighter(water_tds_ppm=250)['grind']['microns'],
                           brighter(water_tds_ppm=120)['grind']['microns'])

    def test_deep_custom_bed_gentle_pour(self):
        common = {'device_id': 'custom_dripper', 'device_name': 'My cone',
                  'filter_fit': 'good', 'material': 'plastic'}
        deep = brighter(**common, bed_height_mm_at_15g=35)
        shallow = brighter(**common, bed_height_mm_at_15g=20)
        self.assertIn('центру', deep['steps'][1]['instruction'])
        self.assertNotIn('центру', shallow['steps'][1]['instruction'])

    def test_immersion_has_fill_steep_press(self):
        recipe = brighter(device_id='french_press')
        self.assertEqual([s['kind'] for s in recipe['steps']], ['fill', 'steep', 'press'])
        self.assertFalse(recipe['machine_compatible'])

    def test_hybrid_has_fill_steep_drain(self):
        recipe = brighter(device_id='hario_switch')
        self.assertEqual([s['kind'] for s in recipe['steps']], ['fill', 'steep', 'drain'])

    def test_automatic_has_no_manual_pours(self):
        recipe = brighter(device_id='moccamaster')
        self.assertEqual(recipe['steps'], [])
        self.assertEqual(recipe['automatic_mode'], 'standard')
        self.assertFalse(recipe['machine_compatible'])

    def test_pours_sum_to_water_and_are_ordered(self):
        for recipe in build({'device_id': 'kalita_wave'}):
            self.assertEqual(sum(s['pour_g'] for s in recipe['steps']), recipe['water_g'])
            self.assertEqual(recipe['steps'][-1]['total_water_g'], recipe['water_g'])
            self.assertTrue(all(a['stop_seconds'] <= b['start_seconds']
                                for a, b in zip(recipe['steps'], recipe['steps'][1:])))

    def test_machine_adapter_accepts_percolation(self):
        recipe = brighter()
        payload = recipe_to_machine(recipe)
        self.assertEqual(payload['water'], recipe['water_g'])
        self.assertEqual(payload['steps'][-1]['target_g'], recipe['water_g'])

    def test_machine_does_not_accept_immersion(self):
        with self.assertRaises(MachineError):
            recipe_to_machine(brighter(device_id='french_press'))

    def test_settings_c40_from_comparison(self):
        grind = brighter(grinder_id='comandante_c40_standard')['grind']
        self.assertIsNotNone(grind['setting'])
        self.assertEqual(grind['mapping_basis'], 'cross_grinder_comparison')

    def test_settings_encore_from_comparison(self):
        self.assertIsNotNone(brighter(grinder_id='baratza_encore')['grind']['setting'])

    def test_settings_k_plus_from_comparison(self):
        self.assertIsNotNone(brighter(grinder_id='1zpresso_k_plus')['grind']['setting'])

    def test_uncalibrated_grinder_has_no_invented_setting(self):
        grind = brighter(grinder_id='1zpresso_k_ultra')['grind']
        self.assertIsNone(grind['setting'])
        self.assertEqual(grind['mapping_basis'], 'uncalibrated')

    def test_date_explicit_as_of_date(self):
        a = brighter(roast_date='2026-09-01', as_of_date='2026-09-10')
        b = brighter(roast_age_days=9)
        self.assertEqual(a, b)

    def test_reasons_explain_each_direction(self):
        recipe = brighter(roast_level='dark', processing='natural')
        rules = {r['rule'] for r in recipe['reasons']}
        self.assertIn('roast_dark', rules)
        self.assertIn('processing_natural', rules)
        self.assertTrue(all(r['text_ru'] and r['text_en'] for r in recipe['reasons']))

    def test_bounds_minimum(self):
        recipe = brighter(dose_g=5, water_g=80)
        self.assertGreaterEqual(recipe['water_g'], 80)

    def test_bounds_maximum(self):
        recipe = brighter(dose_g=40, water_g=600)
        self.assertLessEqual(recipe['water_g'], 600)
        self.assertFalse(recipe['machine_compatible'])

    def test_invalid_input(self):
        for value in (None, [], 'coffee'):
            with self.subTest(value=value), self.assertRaises(BrewingInputError):
                build(value)

    def test_unknown_field(self):
        with self.assertRaises(BrewingInputError):
            build({'surprise': 1})

    def test_unknown_catalog_id(self):
        with self.assertRaises(BrewingInputError):
            build({'device_id': 'unknown'})

    def test_bool_is_not_number(self):
        with self.assertRaises(BrewingInputError):
            build({'dose_g': True})

    def test_invalid_ratio(self):
        with self.assertRaises(BrewingInputError):
            build({'dose_g': 5, 'water_g': 600})

    def test_date_needs_as_of(self):
        with self.assertRaises(BrewingInputError):
            build({'roast_date': '2026-09-01'})

    def test_future_roast_rejected(self):
        with self.assertRaises(BrewingInputError):
            build({'roast_date': '2026-09-24', 'as_of_date': '2026-09-23'})

    def test_custom_fields_required(self):
        with self.assertRaises(BrewingInputError):
            build({'device_id': 'custom_dripper'})

    def test_bad_age_band_rejected(self):
        with self.assertRaises(BrewingInputError):
            build({'roast_age_band': []})

    def test_fractional_age_rejected(self):
        with self.assertRaises(BrewingInputError):
            build({'roast_age_days': 2.5})


class RescaleTests(unittest.TestCase):
    def setUp(self):
        self.recipe = brighter()

    def test_copy_without_changes(self):
        result = rescale(self.recipe)
        self.assertEqual(result, self.recipe)
        self.assertIsNot(result, self.recipe)

    def test_dose_preserves_ratio_approximately(self):
        result = rescale(self.recipe, dose_g=20)
        self.assertEqual(result['dose_g'], 20)
        self.assertAlmostEqual(result['water_g'] / 20, self.recipe['water_g'] / 15, delta=0.1)

    def test_water_preserves_ratio_approximately(self):
        result = rescale(self.recipe, water_g=300)
        self.assertEqual(result['water_g'], 300)
        self.assertAlmostEqual(300 / result['dose_g'], self.recipe['water_g'] / 15, delta=0.5)

    def test_both_recompute_ratio(self):
        result = rescale(self.recipe, dose_g=20, water_g=300)
        self.assertEqual(result['ratio'], '1:15')

    def test_steps_scale_and_timing_stays(self):
        result = rescale(self.recipe, water_g=300)
        self.assertEqual(sum(s['pour_g'] for s in result['steps']), 300)
        self.assertEqual(result['steps'][-1]['total_water_g'], 300)
        self.assertEqual([s['start_seconds'] for s in result['steps']],
                         [s['start_seconds'] for s in self.recipe['steps']])

    def test_immersion_only_fill_scales(self):
        recipe = brighter(device_id='french_press')
        result = rescale(recipe, water_g=300)
        self.assertEqual([s['water_g'] for s in result['steps']], [300, 0, 0])

    def test_automatic_remains_without_steps(self):
        recipe = brighter(device_id='moccamaster')
        self.assertEqual(rescale(recipe, water_g=300)['steps'], [])

    def test_rechecks_machine_limit(self):
        result = rescale(self.recipe, dose_g=30)
        self.assertFalse(result['machine_compatible'])

    def test_original_not_mutated(self):
        before = deepcopy(self.recipe)
        rescale(self.recipe, water_g=300)
        self.assertEqual(self.recipe, before)

    def test_invalid_values(self):
        for value in (True, -1, 1.5, float('nan')):
            with self.subTest(value=value), self.assertRaises(BrewingInputError):
                rescale(self.recipe, dose_g=value)

    def test_roaster_recipe_rejected(self):
        with self.assertRaises(BrewingInputError):
            rescale({'origin': 'roaster'})

    def test_malformed_steps_rejected(self):
        recipe = deepcopy(self.recipe)
        recipe['steps'] = [None]
        with self.assertRaises(BrewingInputError):
            rescale(recipe, water_g=300)


if __name__ == '__main__':
    unittest.main()
