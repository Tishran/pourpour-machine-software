"""Plans, entitlements and the owner's machine right (principle 1)."""

from copy import deepcopy
from datetime import date
import json
import tempfile
import unittest
from pathlib import Path

import server
from brew_catalog import CatalogError
from brewing_engine import build, restore_recipe
from machine import SimulatedMachine
from plans import ENTITLEMENTS, allowed, effective_plan, load_plans
from test_machine import RECIPE
from test_recipe_api import request

PLANS = load_plans()
FREE = {'plan': 'free', 'machineOwner': False}
MEMBER = {'plan': 'member', 'machineOwner': False}
OWNER = {'plan': 'free', 'machineOwner': True}


def broken(change):
    """Load a modified copy of plans.json from a temporary directory."""
    data = deepcopy(PLANS)
    change(data)
    with tempfile.TemporaryDirectory() as directory:
        Path(directory, 'plans.json').write_text(json.dumps(data), encoding='utf-8')
        return load_plans(directory)


class PlansFileTests(unittest.TestCase):
    def test_three_plans_in_pitch_order(self):
        self.assertEqual([plan['id'] for plan in PLANS['plans']], ['free', 'member', 'machine_bundle'])
        self.assertEqual([plan['tagline']['en'] for plan in PLANS['plans']], ['Try it', 'Teach me', 'Brew it for me'])
        self.assertEqual(PLANS['plans'][0]['price_rub'], 0)
        self.assertEqual(PLANS['plans'][1]['period'], 'month')
        self.assertIn('included_months', PLANS['plans'][2])
        self.assertTrue(PLANS['price_is_hypothesis'])
        self.assertEqual((PLANS['cafe_cup_rub'], PLANS['home_cup_rub']), (500, 100))

    def test_every_right_and_limit_is_defined(self):
        self.assertEqual(set(PLANS['entitlements']), set(ENTITLEMENTS))
        self.assertEqual(PLANS['limits'], {'free_builder_tries': 1, 'free_adjustments': 1,
                                           'own_recipes_free': 3, 'journal_recent': 3})

    def test_feature_lists_reference_known_rights(self):
        for plan in PLANS['plans']:
            for feature in plan['features']:
                self.assertTrue(feature['entitlement'] is None or feature['entitlement'] in PLANS['entitlements'])

    def test_invalid_files_are_rejected(self):
        cases = [
            lambda d: d['plans'].pop(),
            lambda d: d['plans'].reverse(),
            lambda d: d['entitlements'].pop('learn_why'),
            lambda d: d['entitlements'].__setitem__('flying', {'access': 'free', 'benefit': {'ru': 'а', 'en': 'a'}}),
            lambda d: d['entitlements']['machine_brew'].__setitem__('access', 'member'),
            lambda d: d['entitlements']['roaster_recipe'].__setitem__('access', 'member'),
            lambda d: d['entitlements']['builder'].__setitem__('free_limit', 'missing'),
            lambda d: d['plans'][1]['features'].append({'entitlement': 'teleport', 'ru': 'а', 'en': 'a'}),
            lambda d: d['plans'][1].__setitem__('period', 'week'),
            lambda d: d['plans'][2].__setitem__('price_rub', {'min': 40000, 'max': 30000}),
            lambda d: d['plans'][0].__setitem__('price_rub', 100),
            lambda d: d['plans'][0].__setitem__('cta', 'buy'),
            lambda d: d['plans'][0]['name'].pop('en'),
            lambda d: d['limits'].__setitem__('free_adjustments', -1),
            lambda d: d.__setitem__('home_cup_rub', 600),
            lambda d: d.__setitem__('survey_url', 'http://forms.example'),
        ]
        for index, change in enumerate(cases):
            with self.subTest(case=index), self.assertRaises(CatalogError):
                broken(change)

    def test_api_serves_the_validated_file(self):
        status, body = request('GET', '/api/plans')
        self.assertEqual(status, 200)
        self.assertEqual(body, PLANS)


class EntitlementTests(unittest.TestCase):
    def test_free_path_is_always_open(self):
        for feature in ('roaster_recipe', 'learn_why', 'school_intro', 'journal_recent'):
            self.assertTrue(allowed(PLANS, FREE, feature, used=10**6))

    def test_member_rights(self):
        for feature in ('builder', 'recipe_adjust', 'champion_recipes', 'school_full',
                        'experiments', 'journal_full', 'own_recipes'):
            self.assertFalse(allowed(PLANS, FREE, feature, used=10**6), feature)
            self.assertTrue(allowed(PLANS, MEMBER, feature, used=10**6), feature)

    def test_free_limits(self):
        self.assertTrue(allowed(PLANS, FREE, 'builder', used=0))
        self.assertFalse(allowed(PLANS, FREE, 'builder', used=1))
        self.assertTrue(allowed(PLANS, FREE, 'recipe_adjust', used=0))
        self.assertFalse(allowed(PLANS, FREE, 'recipe_adjust', used=1))
        self.assertTrue(allowed(PLANS, FREE, 'own_recipes', used=2))
        self.assertFalse(allowed(PLANS, FREE, 'own_recipes', used=3))
        self.assertFalse(allowed(PLANS, FREE, 'champion_recipes', used=0), 'no free tries for champions')

    def test_machine_right_belongs_to_the_owner(self):
        self.assertTrue(allowed(PLANS, OWNER, 'machine_brew'))
        self.assertFalse(allowed(PLANS, MEMBER, 'machine_brew'), 'membership alone is not a machine')
        self.assertFalse(allowed(PLANS, FREE, 'machine_brew'))

    def test_bundle_months_end_but_the_machine_stays(self):
        bundle = {'plan': 'member', 'machineOwner': True, 'includedUntil': '2026-12-24'}
        self.assertEqual(effective_plan(bundle, date(2026, 12, 24)), 'member')
        self.assertTrue(allowed(PLANS, bundle, 'school_full', today=date(2026, 12, 24)))
        after = date(2026, 12, 25)
        self.assertEqual(effective_plan(bundle, after), 'free')
        self.assertFalse(allowed(PLANS, bundle, 'school_full', today=after))
        self.assertTrue(allowed(PLANS, bundle, 'machine_brew', today=after))
        self.assertEqual(effective_plan({'plan': 'machine_bundle'}), 'free', 'the bundle is stored as member + owner')
        self.assertEqual(effective_plan({'plan': 'member', 'includedUntil': 'soon'}), 'free')


class MachineWithoutMembershipTests(unittest.TestCase):
    """Principle 1: plan free + machine owner brews the roaster recipe and saved recipes."""

    def setUp(self):
        self.sim = SimulatedMachine(time_scale=40, start_temp=70, telemetry_s=0.05, watchdog_s=None, seed=1)
        server.set_machine(self.sim)

    def tearDown(self):
        server.set_machine(None)

    def send(self, recipe):
        status, reply = request('POST', '/api/machine/recipe', {'recipe': recipe})
        if status == 200:
            request('POST', '/api/machine/abort')
        return status, reply

    def test_free_owner_sends_roaster_and_saved_recipes(self):
        self.assertTrue(allowed(PLANS, OWNER, 'machine_brew'))
        self.assertFalse(allowed(PLANS, OWNER, 'builder', used=1), 'the owner is on the free plan')
        # The server keeps no plan state: nothing about membership reaches the machine route.
        status, reply = self.send(RECIPE)
        self.assertEqual((status, reply['ok']), (200, True))
        saved = restore_recipe(build({'device_id': 'v60'})[0])
        self.assertTrue(saved['machine_compatible'])
        status, reply = self.send(saved)
        self.assertEqual((status, reply['ok']), (200, True))


if __name__ == '__main__':
    unittest.main()
