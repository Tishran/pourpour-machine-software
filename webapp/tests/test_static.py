import json
import re
import unittest
from pathlib import Path
from unittest.mock import Mock

from server import Handler, STATIC_FILES, ROOT


def get(path):
    handler = Handler.__new__(Handler)
    handler.path = path
    handler.headers = {}
    handler.respond = Mock()
    handler.send_json = Mock()
    handler.do_GET()
    if handler.send_json.called:
        return handler.send_json.call_args.args + (None,)
    code, body, mime = handler.respond.call_args.args
    return code, body, mime


class StaticFileTests(unittest.TestCase):
    def test_every_static_file_exists_and_is_served(self):
        for url, (name, mime) in STATIC_FILES.items():
            self.assertTrue((ROOT / name).is_file(), name)
            code, body, served = get(url)
            self.assertEqual(code, 200, url)
            self.assertEqual(served, mime)
            self.assertEqual(body, (ROOT / name).read_bytes())

    def test_unknown_path_is_404(self):
        code, body, _ = get('/missing.png')
        self.assertEqual(code, 404)

    def test_manifest_is_installable(self):
        code, body, mime = get('/manifest.webmanifest')
        self.assertEqual(mime, 'application/manifest+json; charset=utf-8')
        manifest = json.loads(body)
        self.assertEqual(manifest['display'], 'standalone')
        self.assertEqual(manifest['start_url'], '/')
        self.assertTrue(manifest['theme_color'])
        sizes = {icon['sizes'] for icon in manifest['icons']}
        self.assertTrue({'192x192', '512x512'} <= sizes)
        for icon in manifest['icons']:
            self.assertIn(icon['src'], STATIC_FILES)
        for name in ('icon-192.png', 'icon-512.png', 'apple-touch-icon.png'):
            self.assertTrue((ROOT / name).read_bytes().startswith(b'\x89PNG'), name)

    def test_index_is_a_mobile_app_shell(self):
        html = (ROOT / 'index.html').read_text(encoding='utf-8')
        self.assertIn('<html lang="ru">', html)
        self.assertIn('rel="manifest"', html)
        self.assertIn('viewport-fit=cover', html)
        self.assertIn('accept="image/*" capture="environment"', html)
        for screen in ('screen-find', 'screen-recipe', 'screen-brew'):
            self.assertIn(f'id="{screen}"', html)
        self.assertIn('id="screen-construct"', html)
        self.assertIn('id="open-builder"', html)
        self.assertIn('id="builder-language"', html)
        for element in ('brew-ready', 'brew-step-count', 'brew-step-tiles',
                        'brew-prev-step', 'brew-next-step'):
            self.assertIn(f'id="{element}"', html)
        self.assertIn('id="recents"', html)
        self.assertNotIn('id="recents-hint"', html)
        self.assertIn('id="scan-preview"', html)
        self.assertIn('id="recipe-photo"', html)
        self.assertIn('href="https://forms.yandex.ru/u/6ab10c8390fa7ba71fa6d1cb"', html)
        # No scripts, fonts or images are loaded from the internet.
        self.assertNotRegex(html, r'src="https?://')

    def test_ui_strings_are_defined_in_the_dictionary(self):
        script = (ROOT / 'app.js').read_text(encoding='utf-8')
        dictionary = script[script.index('const STRINGS'):script.index('const SETTINGS_KEY')]
        languages = {}
        for match in re.finditer(r'^\s{2}(\w+): \{\n(.*?)^\s{2}\},', dictionary, re.M | re.S):
            languages[match[1]] = set(re.findall(r'^\s{4}([a-z_]+):', match[2], re.M))
        self.assertEqual(set(languages), {'en', 'ru'})
        self.assertEqual(languages['en'], languages['ru'], 'every string exists in both languages')
        used = set(re.findall(r"\bt\('([a-z_]+)'", script))
        used |= {f'{key}_hint' for key in ('vibrate', 'sound')}
        self.assertFalse(used - languages['en'], used - languages['en'])
        self.assertIn("let LANG = 'ru'", script)
        self.assertIn("firstbrew.settings.v1", script)
        self.assertNotIn('http://', script.replace('http://127.0.0.1', ''))
        self.assertNotIn('https://', script)
        css = (ROOT / 'style.css').read_text(encoding='utf-8')
        self.assertNotIn('@import', css)
        self.assertNotIn('http', css)
        self.assertIn('prefers-color-scheme: dark', css)
        self.assertIn('prefers-reduced-motion', css)
        self.assertIn('env(safe-area-inset-bottom', css)


if __name__ == '__main__':
    unittest.main()
