"""Learning content: every text has a source, one takeaway per diagnosis, usable lessons."""

from copy import deepcopy
import json
import tempfile
import unittest
from pathlib import Path

from brew_catalog import CatalogError
from brewing_engine import DIAGNOSIS_CODES
from course import CARD_LIMIT, TIMER_KEYS, WHY_KEYS, load_course
from test_recipe_api import request

COURSE = load_course()


def broken(change):
    data = deepcopy(COURSE)
    change(data)
    with tempfile.TemporaryDirectory() as directory:
        Path(directory, 'course.json').write_text(json.dumps(data), encoding='utf-8')
        return load_course(directory)


def lessons():
    return [lesson for module in COURSE['modules'] for lesson in module['lessons']]


class CourseTests(unittest.TestCase):
    def test_explanations_cover_every_number_and_step(self):
        self.assertEqual(set(COURSE['why']), set(WHY_KEYS))
        self.assertEqual(set(COURSE['timer']), set(TIMER_KEYS))

    def test_one_takeaway_per_engine_diagnosis(self):
        self.assertEqual(set(COURSE['takeaways']), set(DIAGNOSIS_CODES))

    def test_every_text_has_a_source_and_stays_short(self):
        texts = [*COURSE['why'].values(), *COURSE['timer'].values(), *COURSE['takeaways'].values()]
        for lesson in lessons():
            texts += [*lesson['cards'], lesson['takeaway'], *lesson.get('conclusions', {}).values()]
        for text in texts:
            self.assertTrue(text['source'])
            self.assertLessEqual(len(text['ru']), CARD_LIMIT)
            self.assertLessEqual(len(text['en']), CARD_LIMIT)

    def test_course_is_a_draft(self):
        self.assertEqual(COURSE['review'], 'draft')
        self.assertTrue(all(lesson['review'] == 'draft' for lesson in lessons()))

    def test_invalid_content_is_rejected(self):
        cases = [
            lambda d: d['why'].pop('grind'),
            lambda d: d['takeaways'].pop('under'),
            lambda d: d['timer']['bloom'].pop('source'),
            lambda d: d['timer']['bloom'].__setitem__('source', 'the internet'),
            lambda d: d['why']['dose'].__setitem__('ru', 'а' * (CARD_LIMIT + 1)),
            lambda d: d.__setitem__('review', 'approved'),
        ]
        for index, change in enumerate(cases):
            with self.subTest(case=index), self.assertRaises(CatalogError):
                broken(change)

    def test_school_modules_and_lessons(self):
        self.assertEqual([module['id'] for module in COURSE['modules']],
                         ['basics', 'grind', 'pours', 'taste', 'coffee', 'gear'])
        first = COURSE['modules'][0]['lessons'][0]
        self.assertEqual(first['practice']['kind'], 'build', 'the free lesson is a plain brew')
        experiments = [lesson for lesson in lessons() if lesson['practice']['kind'] == 'experiment']
        self.assertEqual({lesson['practice']['vary'] for lesson in experiments}, {'grind', 'temperature', 'ratio'})
        for lesson in experiments:
            self.assertEqual(set(lesson['conclusions']), {'a', 'b', 'same'})
        for lesson in lessons():
            self.assertTrue(2 <= len(lesson['cards']) <= 4)

    def test_broken_lessons_are_rejected(self):
        first = lambda d: d['modules'][0]['lessons'][0]
        experiment = lambda d: next(l for m in d['modules'] for l in m['lessons'] if l['practice']['kind'] == 'experiment')
        cases = [
            lambda d: first(d)['cards'].__setitem__(slice(1, None), []),
            lambda d: first(d).__setitem__('review', 'approved'),
            lambda d: first(d)['practice'].__setitem__('params', {'device_id': 'teapot'}),
            lambda d: experiment(d)['practice'].__setitem__('vary', 'dose'),
            lambda d: experiment(d)['conclusions'].pop('same'),
            lambda d: experiment(d)['practice'].__setitem__('params', {'device_id': 'french_press'}),
            lambda d: d['modules'][0]['lessons'].insert(0, deepcopy(experiment(d)) | {'id': 'first_experiment'}),
            lambda d: d['modules'][1]['lessons'].append(deepcopy(first(d))),
            lambda d: d.__setitem__('modules', []),
        ]
        for index, change in enumerate(cases):
            with self.subTest(case=index), self.assertRaises(CatalogError):
                broken(change)

    def test_api_serves_the_course(self):
        status, body = request('GET', '/api/course')
        self.assertEqual(status, 200)
        self.assertEqual(body, COURSE)


if __name__ == '__main__':
    unittest.main()
