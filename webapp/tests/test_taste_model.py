"""Runs the JavaScript tests of the personal taste model (static/taste-model.js) with Node."""

import shutil
import subprocess
import unittest
from pathlib import Path

TESTS = Path(__file__).with_name('test_taste_model.cjs')


@unittest.skipUnless(shutil.which('node'), 'Node.js is not installed')
class TasteModelTests(unittest.TestCase):
    def test_javascript_model(self):
        result = subprocess.run(['node', '--test', str(TESTS)], capture_output=True, text=True, timeout=60)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


if __name__ == '__main__':
    unittest.main()
