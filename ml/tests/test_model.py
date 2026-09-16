import copy
import json
from pathlib import Path
import tempfile
import unittest

from ml.train import SNAPSHOT, evaluate
from webapp.recommender import (MODEL_PATH, RecipeModel, coffee_profile, fit, parse_label,
                                rank, supported, train)
from webapp.label_ocr import extract, image_dimensions, parse_tsv, status


class ModelTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.model = RecipeModel()

    def test_known_coffee_returns_saved_recipe(self):
        r = self.model.recommend('The Welder Catherine\nРуанда Суса')
        self.assertEqual(r['kind'], 'catalog_match')
        recipe = r['recipe_data']['recipes'][0]
        self.assertEqual((recipe['coffee_g'], recipe['water_g'], recipe['temperature_c']), (15, 250, 98))
        self.assertEqual(recipe['duration_seconds'], 175)
        self.assertEqual(sum(s['water_g'] for s in recipe['steps']), 250)

    def test_brand_missing_or_other_roaster_requires_confirmation(self):
        for text in ['Руанда Суса', 'Roaster: Someone Else\nРуанда Суса']:
            r = self.model.recommend(text)
            self.assertEqual(r['kind'], 'confirm_match')
            self.assertIsNone(r['recipe_data'])
            selected = self.model.recommend(text, r['candidates'][0]['coffee_id'])
            self.assertEqual(selected['kind'], 'catalog_match')

    def test_ocr_mixed_cyrillic_latin_letters(self):
        result = self.model.recommend('The Welder Catherine\nРуанда Cyca')
        self.assertEqual(result['kind'], 'catalog_match')
        self.assertEqual(result['recipe_data']['product']['name'], 'Руанда Суса')

    def test_all_catalog_names_are_identifiable(self):
        for row in self.model.rows:
            r = self.model.recommend('The Welder Catherine\n' + row['coffee']['name'])
            self.assertEqual(r['kind'], 'catalog_match' if row['usable'] else 'source_needs_review', row['coffee']['name'])

    def test_unseen_supported_coffee_gets_intact_reference(self):
        r = self.model.recommend('Coffee: New Lot\nCountry: Rwanda\nProcessing: washed\nVariety: red bourbon')
        self.assertEqual(r['kind'], 'suggested_reference')
        reference = r['recipe_data']['reference_name']
        row = next(row for row in self.model.rows if row['coffee']['name'] == reference)
        recipe = r['recipe_data']['recipes'][0]
        self.assertEqual(recipe['temperature_c'], row['recipe']['temperature_c'])
        self.assertEqual(sum(s['water_g'] for s in recipe['steps']), recipe['water_g'])
        self.assertEqual(r['recipe_data']['product']['name'], 'New Lot')

    def test_insufficient_and_out_of_domain_labels_abstain(self):
        for text in ['', 'Coffee', 'Country: Rwanda', 'Country: Brazil\nProcessing: natural',
                     'Country: Rwanda\nProcessing: washed\nEspresso',
                     'Country: Colombia\nProcessing: washed\nDecaf',
                     'Country: Kenya\nProcessing: honey']:
            r = self.model.recommend(text)
            self.assertEqual(r['kind'], 'insufficient_data', text)
            self.assertIsNone(r['recipe_data'])

    def test_bad_source_is_not_repaired(self):
        for name in ['Перу Valle Sagrado из бочки', 'Колумбия Рэйнбоу декаф']:
            r = self.model.recommend('The Welder Catherine\n' + name)
            self.assertEqual(r['kind'], 'source_needs_review')
            self.assertIsNone(r['recipe_data'])

    def test_bilingual_features(self):
        en = parse_label('Country: Rwanda\nProcessing: washed, anaerobic\nVariety: red bourbon')
        ru = parse_label('Страна: Руанда\nОбработка: мытая, анаэробная\nРазновидность: красный бурбон')
        for key in ('country', 'processing', 'variety'):
            self.assertEqual(en[key], ru[key])
        self.assertEqual(en['country'], 'RW')
        self.assertEqual(en['processing'], ['anaerobic', 'washed'])

    def test_recipe_targets_and_name_are_not_features(self):
        a = self.model.rows[0]['profile']
        b = dict(a, temperature_c=200, name='Injected label', recipe_id='x')
        self.assertEqual(fit([a]), fit([b]))
        self.assertEqual(rank(a, self.model.rows, self.model.model['idf']), rank(b, self.model.rows, self.model.model['idf']))

    def test_invalid_input_and_unknown_id(self):
        for text in [None, 'x'*10001, {}]:
            with self.assertRaises(ValueError):
                self.model.recommend(text)
        with self.assertRaises(ValueError):
            self.model.recommend('Rwanda', 'invalid')

    def test_reproducible_training_and_held_out_groups(self):
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / 'model.json'
            trained = train(SNAPSHOT, path)
            self.assertEqual(json.loads(path.read_text()), json.loads(MODEL_PATH.read_text()))
            report = evaluate(trained['rows'])
            self.assertEqual(report['coffees'], 35)
            self.assertGreater(report['abstained'], 0)
            for prediction in report['predictions']:
                self.assertNotEqual(prediction['coffee_id'], prediction['reference_coffee_id'])


class OCRTests(unittest.TestCase):
    def test_invalid_image_and_oversized_input_rejected(self):
        for payload in [b'<svg></svg>', b'not a photo', b'\xff\xd8\xff\xe0\x00\x00']:
            with self.assertRaises(ValueError):
                image_dimensions(payload)
        with self.assertRaises(ValueError):
            extract(b'x' * 8000001)

    def test_tsv_quoted_text_and_line_order(self):
        tsv = 'level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tconf\ttext\n'
        tsv += '5\t1\t1\t1\t1\t1\t90\t"Coffee"\n5\t1\t1\t1\t2\t1\t80\tРуанда\n'
        result = parse_tsv(tsv)
        self.assertEqual(result['text'], '"Coffee"\nРуанда')
        self.assertEqual(result['mean_word_confidence'], 85)

    @unittest.skipUnless(status()['available'], 'Install Pillow, Tesseract and the pinned language weights')
    def test_real_ocr_on_synthetic_label_fixture(self):
        path = Path(__file__).parent / 'fixtures/rwanda-label.png'
        result = extract(path.read_bytes())
        self.assertIn('руанда', result['text'].casefold())
        recommendation = RecipeModel().recommend(result['text'])
        self.assertEqual(recommendation['kind'], 'catalog_match')


if __name__ == '__main__':
    unittest.main()
