import io
import unittest
from unittest.mock import Mock, patch

from server import Handler
from recommender import RecipeModel


class PhotoAPITests(unittest.TestCase):
    def photo(self, text, needs_review):
        handler = Handler.__new__(Handler)
        handler.path = '/api/label'
        handler.headers = {'Content-Type': 'image/png', 'Content-Length': '5'}
        handler.rfile = io.BytesIO(b'photo')
        handler.connection = Mock()
        handler.send_json = Mock()
        scan = {'text': text, 'ocr': {'text': text, 'needs_review': needs_review}}
        with patch('server.scan_label', return_value=scan), patch('server.get_model', return_value=RecipeModel()):
            handler.do_POST()
        code, response = handler.send_json.call_args.args
        self.assertEqual(code, 200)
        return response

    def test_uncertain_known_name_requires_confirmation_with_original_recipe(self):
        text = 'The Welder Catherine\nРуанда Суса'
        response = self.photo(text, True)
        result = response['recommendation']
        self.assertEqual(response['text'], text)
        self.assertTrue(result['ocr_uncertain'])
        self.assertEqual(result['kind'], 'catalog_match')
        self.assertEqual(result['recipe_data']['product']['name'], 'Руанда Суса')
        self.assertEqual(response['photo_state'], 'confirmation')
        self.assertEqual(result['recipe_data']['recipes'], RecipeModel().recommend(text)['recipe_data']['recipes'])

    def test_unreadable_photo_has_no_automatic_recipe(self):
        for text in ('', '|', '123 / --'):
            with self.subTest(text=text):
                response = self.photo(text, True)
                result = response['recommendation']
                self.assertTrue(result['ocr_uncertain'])
                self.assertEqual(response['photo_state'], 'unreadable')
                self.assertIsNone(result['recipe_data'])
                self.assertIsNone(result['label']['country'])

    def test_uncertain_country_is_confirmable_without_invented_processing(self):
        response = self.photo('COLOMBIA', True)
        self.assertEqual(response['photo_state'], 'confirmation')
        self.assertEqual(response['recommendation']['label']['country'], 'CO')
        self.assertEqual(response['recommendation']['label']['processing'], [])
        self.assertIsNotNone(response['recommendation']['recipe_data'])

    def test_processing_without_country_is_confirmable(self):
        response = self.photo('washed', True)
        self.assertEqual(response['photo_state'], 'confirmation')
        self.assertEqual(response['recommendation']['label']['processing'], ['washed'])

    def test_model_exposes_the_parser_vocabularies(self):
        from recommender import COUNTRIES, PROCESSING
        handler = Handler.__new__(Handler)
        handler.path = '/api/model'
        handler.send_json = Mock()
        with patch('server.get_model', return_value=RecipeModel()), patch('server.ocr_status', return_value={'available': True}):
            handler.do_GET()
        code, response = handler.send_json.call_args.args
        self.assertEqual(code, 200)
        self.assertEqual(response['countries'], COUNTRIES)
        self.assertEqual(response['processing'], PROCESSING)

    def test_general_recipe_remains_available_by_explicit_request(self):
        handler = Handler.__new__(Handler)
        handler.path = '/api/recommend'
        handler.headers = {'Content-Type': 'application/json', 'Content-Length': '11'}
        handler.rfile = io.BytesIO(b'{"text":""}')
        handler.headers['Content-Length'] = str(len(handler.rfile.getvalue()))
        handler.connection = Mock()
        handler.send_json = Mock()
        with patch('server.get_model', return_value=RecipeModel()):
            handler.do_POST()
        code, response = handler.send_json.call_args.args
        self.assertEqual(code, 200)
        self.assertEqual(response['basis']['scope'], 'general')
        self.assertIsNotNone(response['recipe_data'])

    def test_confident_single_country_is_used_without_inventing_processing(self):
        result = self.photo('COLOMBIA', False)['recommendation']
        self.assertEqual(result['basis']['scope'], 'country')
        self.assertEqual(result['label']['country'], 'CO')
        self.assertEqual(result['label']['processing'], [])
        self.assertNotIn('ocr_uncertain', result)


class RecognitionThresholdTests(unittest.TestCase):
    def test_meaningful_words_and_confidence_boundaries(self):
        from label_ocr import needs_review
        for text, confidence, expected in [
            ('|', 72, True), ('', 99, True), ('123 456', 99, True),
            ('Colombia', 99, True), ('ab cd', 99, True), ('Руанда Суса', 70, False),
            ('Coffee washed', 69.9, True), ('Coffee washed', 70, False),
            ('Éthiopie, lavé!', 90, False), ('Colombia / 15g / |', 99, True),
        ]:
            with self.subTest(text=text, confidence=confidence):
                self.assertEqual(needs_review(text, confidence), expected)


if __name__ == '__main__':
    unittest.main()
