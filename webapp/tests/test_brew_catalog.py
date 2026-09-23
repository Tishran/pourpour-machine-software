"""Integrity checks for the independent recipe-constructor reference data."""

import copy
import json
import shutil
import tempfile
import unittest
from pathlib import Path

from brew_catalog import CATALOG_FILES, DATA_DIR, CatalogError, load_catalog
from recommender import COUNTRIES as OCR_COUNTRIES


class BrewCatalogTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = load_catalog()

    def changed(self, filename, edit):
        """Change one copied JSON document without touching packaged data."""
        with tempfile.TemporaryDirectory() as directory:
            temporary = Path(directory)
            for name in (*CATALOG_FILES, 'grind_equivalences'):
                shutil.copyfile(DATA_DIR / f'{name}.json', temporary / f'{name}.json')
            path = temporary / f'{filename}.json'
            data = json.loads(path.read_text(encoding='utf-8'))
            edit(data)
            path.write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')
            return load_catalog(temporary)

    def test_expected_catalog_size_and_ocr_country_coverage(self):
        self.assertEqual(len(self.catalog['countries']), 40)
        self.assertEqual(len(self.catalog['processing']), 13)
        self.assertEqual(len(self.catalog['devices']), 15)
        self.assertGreaterEqual(len(self.catalog['grinders']), 3)
        self.assertTrue(set(OCR_COUNTRIES) <= {item['id'] for item in self.catalog['countries']})

    def test_bilingual_names_and_unique_ids(self):
        for name in CATALOG_FILES:
            items = self.catalog[name]
            self.assertEqual(len(items), len({item['id'] for item in items}), name)
            for item in items:
                self.assertTrue(item['name_ru'].strip())
                self.assertTrue(item['name_en'].strip())

    def test_methods_have_distinct_pour_shapes(self):
        methods = {item['method'] for item in self.catalog['devices']}
        self.assertEqual(methods, {'percolation', 'immersion', 'hybrid', 'automatic_drip'})
        for device in self.catalog['devices']:
            if device['method'] == 'automatic_drip':
                self.assertEqual(device['default_pours'], 0)
            else:
                self.assertGreater(device['default_pours'], 0)

    def test_custom_dripper_needs_user_measurements(self):
        custom = next(item for item in self.catalog['devices'] if item['id'] == 'custom_dripper')
        self.assertEqual(custom['filter_fit'], 'user_supplied')
        self.assertIsNone(custom['bed_height_mm_at_15g'])
        self.assertIsNone(custom['default_material_id'])

    def test_no_unmeasured_builtin_bed_height_is_claimed(self):
        self.assertTrue(all(item['bed_height_mm_at_15g'] is None for item in self.catalog['devices']))

    def test_grinder_travel_is_not_particle_size(self):
        grinders = {item['id']: item for item in self.catalog['grinders']}
        self.assertEqual(grinders['1zpresso_k_ultra']['burr_travel_microns_per_click'], 20)
        self.assertIsNone(grinders['comandante_c40_standard']['burr_travel_microns_per_click'])
        for grinder in grinders.values():
            self.assertEqual(grinder['micron_kind'],
                             'burr_travel' if grinder['burr_travel_microns_per_click'] is not None else None)
            self.assertIsNone(grinder['particle_calibration'])
            self.assertIsNone(grinder['clicks_per_particle_micron'])
            self.assertEqual(grinder['accuracy'], 'approximate')

    def test_user_comparison_keeps_original_ranges_and_provenance(self):
        comparison = self.catalog['grind_equivalences']
        self.assertEqual(comparison['methodology'], 'not_specified_in_source')
        self.assertEqual(comparison['unit'], 'manufacturer_setting_not_particle_microns')
        self.assertEqual(len(comparison['rows']), 13)
        self.assertEqual(comparison['rows'][0]['settings']['comandante_c40_standard'],
                         {'minimum': 13, 'maximum': 14})
        self.assertEqual(comparison['rows'][6]['settings']['baratza_encore'],
                         {'minimum': 14, 'maximum': 14})
        self.assertEqual(comparison['rows'][-1]['settings']['1zpresso_k_plus'],
                         {'minimum': 87, 'maximum': 90})
        self.assertTrue((DATA_DIR.parent.parent / comparison['source_file']).is_file())

    def test_missing_file_fails_loudly(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaises(CatalogError):
                load_catalog(directory)

    def test_duplicate_id_is_rejected(self):
        def edit(data):
            data['items'].append(copy.deepcopy(data['items'][0]))
        with self.assertRaisesRegex(CatalogError, 'duplicate id'):
            self.changed('countries', edit)

    def test_bad_reference_is_rejected(self):
        with self.assertRaisesRegex(CatalogError, 'unknown default_filter_id'):
            self.changed('devices', lambda data: data['items'][0].update(default_filter_id='missing'))

    def test_wrong_method_geometry_is_rejected(self):
        with self.assertRaisesRegex(CatalogError, 'method and geometry disagree'):
            self.changed('devices', lambda data: data['items'][0].update(geometry='machine'))

    def test_particle_conversion_without_calibration_is_rejected(self):
        with self.assertRaisesRegex(CatalogError, 'particle conversion requires'):
            self.changed('grinders', lambda data: data['items'][0].update(clicks_per_particle_micron=1 / 30))

    def test_burr_travel_cannot_be_mislabeled_as_particle_size(self):
        with self.assertRaisesRegex(CatalogError, 'micron_kind must describe burr travel'):
            self.changed('grinders', lambda data: data['items'][1].update(micron_kind='particle_size'))

    def test_unknown_grinder_in_comparison_is_rejected(self):
        with self.assertRaisesRegex(CatalogError, 'unknown grinder'):
            self.changed('grind_equivalences',
                         lambda data: data['rows'][0]['settings'].update(unknown={'minimum': 1, 'maximum': 2}))

    def test_reversed_comparison_range_is_rejected(self):
        with self.assertRaisesRegex(CatalogError, 'must be >='):
            self.changed('grind_equivalences',
                         lambda data: data['rows'][0]['settings']['baratza_encore'].update(maximum=1))

    def test_wrong_schema_version_is_rejected(self):
        with self.assertRaisesRegex(CatalogError, 'unsupported schema version'):
            self.changed('processing', lambda data: data.update(schema_version=2))

    def test_duplicate_json_key_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            temporary = Path(directory)
            for name in (*CATALOG_FILES, 'grind_equivalences'):
                shutil.copyfile(DATA_DIR / f'{name}.json', temporary / f'{name}.json')
            (temporary / 'filters.json').write_text('{"schema_version":1,"schema_version":1,"items":[]}', encoding='utf-8')
            with self.assertRaisesRegex(CatalogError, 'duplicate JSON key'):
                load_catalog(temporary)


if __name__ == '__main__':
    unittest.main()
