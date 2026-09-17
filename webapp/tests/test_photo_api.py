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

    def test_uncertain_ocr_cannot_identify_even_a_complete_catalog_name(self):
        text = 'The Welder Catherine\nРуанда Суса'
        response = self.photo(text, True)
        result = response['recommendation']
        self.assertEqual(response['text'], text)
        self.assertTrue(result['label_review_required'])
        self.assertEqual(result['kind'], 'suggested_baseline')
        self.assertEqual(result['basis']['scope'], 'general')
        self.assertIsNone(result['label']['country'])
        self.assertEqual(result['candidates'], [])
        self.assertIn('general recipe', result['recipe_data']['explanation'])

    def test_confident_single_country_is_used_without_inventing_processing(self):
        result = self.photo('COLOMBIA', False)['recommendation']
        self.assertEqual(result['basis']['scope'], 'country')
        self.assertEqual(result['label']['country'], 'CO')
        self.assertEqual(result['label']['processing'], [])
        self.assertNotIn('label_review_required', result)


if __name__ == '__main__':
    unittest.main()
