import io
import json
import time
import unittest
from unittest.mock import Mock

import server
from machine import (LIMITS, MachineError, SimulatedMachine, create_machine,
                     recipe_to_machine, validate_recipe)

RECIPE = {'coffee_g': 15, 'water_g': 250, 'temperature_c': 96, 'duration_seconds': 150,
          'steps': [{'total_water_g': 50, 'start_seconds': 0, 'stop_seconds': 15},
                    {'total_water_g': 150, 'start_seconds': 30, 'stop_seconds': 45},
                    {'total_water_g': 250, 'start_seconds': 75, 'stop_seconds': 90}]}


def wait_for(machine, predicate, timeout=10):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if predicate(machine.latest or {}):
            return machine.latest
        time.sleep(0.02)
    raise AssertionError(f'timed out waiting; last state {machine.latest}')


class ProtocolTests(unittest.TestCase):
    def test_recipe_conversion_keeps_roaster_values(self):
        payload = recipe_to_machine(RECIPE)
        self.assertEqual((payload['dose'], payload['water'], payload['temperature'], payload['duration_s']), (15, 250, 96, 150))
        self.assertEqual([s['target_g'] for s in payload['steps']], [50, 150, 250])
        self.assertEqual([(s['start_s'], s['stop_s']) for s in payload['steps']], [(0, 15), (30, 45), (75, 90)])

    def test_incomplete_recipe_is_rejected(self):
        for broken in [dict(RECIPE, steps=[]), dict(RECIPE, coffee_g=None), dict(RECIPE, temperature_c=None),
                       dict(RECIPE, steps=[dict(RECIPE['steps'][0], total_water_g=None)]),
                       dict(RECIPE, steps=[dict(RECIPE['steps'][0], start_seconds=None)]), 'text', None]:
            with self.assertRaises(MachineError) as caught:
                recipe_to_machine(broken)
            self.assertEqual(caught.exception.code, 'incomplete_recipe')

    def test_limits_reject_hot_large_and_long_recipes(self):
        base = recipe_to_machine(RECIPE)
        cases = [(dict(base, temperature=LIMITS['temperature_c'] + 1), 'limit_temperature'),
                 (dict(base, temperature=30), 'limit_temperature'),
                 (dict(base, water=LIMITS['water_g'] + 1), 'limit_water'),
                 (dict(base, steps=[dict(base['steps'][0], target_g=LIMITS['water_g'] + 1)]), 'limit_water'),
                 (dict(base, duration_s=LIMITS['brew_s'] + 1), 'limit_time'),
                 (dict(base, steps=[{'target_g': 50, 'start_s': 0, 'stop_s': LIMITS['brew_s'] + 1}]), 'limit_time'),
                 (dict(base, steps=[]), 'limit_steps'),
                 (dict(base, steps=[{'target_g': 10, 'start_s': i * 10, 'stop_s': i * 10 + 5} for i in range(LIMITS['steps'] + 1)]), 'limit_steps'),
                 (dict(base, steps=[{'target_g': 150, 'start_s': 0, 'stop_s': 15}, {'target_g': 50, 'start_s': 30, 'stop_s': 45}]), 'bad_steps'),
                 (dict(base, steps=[{'target_g': 50, 'start_s': 20, 'stop_s': 10}]), 'bad_steps'),
                 (dict(base, steps=[{'target_g': 50, 'start_s': 0, 'stop_s': 30}, {'target_g': 100, 'start_s': 20, 'stop_s': 40}]), 'bad_steps'),
                 (dict(base, steps=[{'target_g': 'x', 'start_s': 0, 'stop_s': 1}]), 'bad_steps'),
                 (dict(base, dose=0), 'bad_params'), ('nope', 'bad_params')]
        for payload, code in cases:
            with self.assertRaises(MachineError, msg=code) as caught:
                validate_recipe(payload)
            self.assertEqual(caught.exception.code, code)
        self.assertEqual(validate_recipe(dict(base, duration_s=None))['duration_s'], 90)

    def test_error_status_codes(self):
        self.assertEqual(MachineError('busy').status, 409)
        self.assertEqual(MachineError('disconnected').status, 503)
        self.assertEqual(MachineError('limit_water').status, 400)
        self.assertTrue(MachineError('dry_run').message)

    def test_create_machine_spec(self):
        self.assertIsNone(create_machine('none'))
        sim = create_machine('sim', sim_speed=5)
        self.assertEqual(sim.time_scale, 5)
        sim.close()
        with self.assertRaises(ValueError):
            create_machine('bluetooth')


class SimulatorTests(unittest.TestCase):
    def setUp(self):
        self.sim = SimulatedMachine(time_scale=40, start_temp=70, telemetry_s=0.05, watchdog_s=None, seed=1)

    def tearDown(self):
        self.sim.close()

    def load(self):
        return self.sim.command('load_recipe', **recipe_to_machine(RECIPE))

    def test_hello_and_unknown_commands(self):
        hello = self.sim.command('hello')
        self.assertTrue(hello['ok'])
        self.assertEqual(hello['mode'], 'scale')
        self.assertIn('limits', hello)
        with self.assertRaises(MachineError) as caught:
            self.sim.command('fly')
        self.assertEqual(caught.exception.code, 'unknown_cmd')

    def test_full_cycle_preheat_brew_done(self):
        self.assertTrue(self.load()['ok'])
        self.assertEqual(self.sim.state, 'PREHEAT')
        with self.assertRaises(MachineError) as caught:
            self.sim.command('start')
        self.assertEqual(caught.exception.code, 'not_ready')
        ready = wait_for(self.sim, lambda s: s.get('state') == 'READY', timeout=15)
        self.assertAlmostEqual(ready['temp_c'], 96, delta=1.5)
        self.sim.command('start')
        seen_pump = wait_for(self.sim, lambda s: s.get('pump') == 1, timeout=5)
        self.assertEqual(seen_pump['state'], 'BREWING')
        self.assertEqual(seen_pump['step'], 0)
        self.assertEqual(seen_pump['target_g'], 50)
        done = wait_for(self.sim, lambda s: s.get('state') == 'DONE', timeout=20)
        self.assertAlmostEqual(done['poured_g'], 250, delta=6)
        self.assertGreaterEqual(done['t'], 150)
        self.assertEqual((done['heater'], done['pump']), (0, 0))
        # A finished machine accepts the next recipe.
        self.assertTrue(self.load()['ok'])

    def test_pours_stop_at_target_with_drip_compensation(self):
        self.load()
        wait_for(self.sim, lambda s: s.get('state') == 'READY', timeout=15)
        self.sim.command('start')
        wait_for(self.sim, lambda s: s.get('step') == -1 and s.get('poured_g', 0) > 40, timeout=10)
        time.sleep(0.2)
        first = self.sim.latest['poured_g']
        self.assertAlmostEqual(first, 50, delta=4)
        self.assertLessEqual(first, 53)

    def test_pause_resume_and_abort(self):
        self.load()
        wait_for(self.sim, lambda s: s.get('state') == 'READY', timeout=15)
        with self.assertRaises(MachineError):
            self.sim.command('pause')
        self.sim.command('start')
        wait_for(self.sim, lambda s: s.get('pump') == 1, timeout=5)
        self.sim.command('pause')
        paused = wait_for(self.sim, lambda s: s.get('state') == 'PAUSED')
        self.assertEqual(paused['pump'], 0)
        t_paused = paused['t']
        time.sleep(0.3)
        self.assertEqual(self.sim.latest['t'], t_paused, 'the brew clock is frozen while paused')
        self.sim.command('resume')
        wait_for(self.sim, lambda s: s.get('state') == 'BREWING' and s['t'] > t_paused)
        self.sim.command('abort')
        idle = wait_for(self.sim, lambda s: s.get('state') == 'IDLE')
        self.assertEqual((idle['heater'], idle['pump'], idle['t'], idle['poured_g']), (0, 0, 0, 0))

    def test_load_is_rejected_while_brewing(self):
        self.load()
        wait_for(self.sim, lambda s: s.get('state') == 'READY', timeout=15)
        self.sim.command('start')
        with self.assertRaises(MachineError) as caught:
            self.load()
        self.assertEqual(caught.exception.code, 'bad_state')

    def test_watchdog_cuts_outputs_without_pings(self):
        self.sim.close()
        self.sim = SimulatedMachine(time_scale=40, start_temp=70, telemetry_s=0.05, watchdog_s=0.3, seed=1)
        self.load()
        error = wait_for(self.sim, lambda s: s.get('state') == 'ERROR', timeout=3)
        self.assertEqual(error['err'], 'watchdog')
        self.assertEqual((error['heater'], error['pump']), (0, 0))
        with self.assertRaises(MachineError):
            self.load()  # ERROR must be cleared with abort first
        self.sim.command('abort')
        wait_for(self.sim, lambda s: s.get('state') == 'IDLE')

    def test_pings_keep_the_watchdog_quiet(self):
        self.sim.close()
        self.sim = SimulatedMachine(time_scale=40, start_temp=70, telemetry_s=0.05, watchdog_s=0.3, seed=1)
        self.load()
        for _ in range(6):
            time.sleep(0.1)
            self.sim.command('ping')
        self.assertIn(self.sim.state, ('PREHEAT', 'READY'))

    def test_dry_run_and_sensor_faults_stop_everything(self):
        self.load()
        wait_for(self.sim, lambda s: s.get('state') == 'READY', timeout=15)
        self.sim.inject('dry_run')
        self.sim.command('start')
        error = wait_for(self.sim, lambda s: s.get('state') == 'ERROR', timeout=5)
        self.assertEqual(error['err'], 'dry_run')
        self.assertEqual((error['heater'], error['pump']), (0, 0))
        self.sim.command('abort')
        self.load()
        self.sim.inject('temp_sensor')
        error = wait_for(self.sim, lambda s: s.get('state') == 'ERROR', timeout=5)
        self.assertEqual(error['err'], 'no_temp_sensor')
        self.assertIsNone(error['temp_c'])

    def test_estop_blocks_everything_until_restart(self):
        self.sim.inject('estop')
        for cmd in ('load_recipe', 'abort', 'tare'):
            with self.assertRaises(MachineError) as caught:
                self.sim.command(cmd, **(recipe_to_machine(RECIPE) if cmd == 'load_recipe' else {}))
            self.assertEqual(caught.exception.code, 'estop')
        self.assertTrue(self.sim.command('ping')['ok'])

    def test_subscribers_receive_state_events(self):
        events = self.sim.subscribe()
        self.load()
        event = events.get(timeout=2)
        self.assertEqual(event['ev'], 'state')
        self.sim.unsubscribe(events)


class MachineAPITests(unittest.TestCase):
    def setUp(self):
        self.sim = SimulatedMachine(time_scale=40, start_temp=70, telemetry_s=0.05, watchdog_s=None, seed=1)
        server.set_machine(self.sim)

    def tearDown(self):
        server.set_machine(None)

    def request(self, method, path, body=None):
        handler = server.Handler.__new__(server.Handler)
        handler.path = path
        payload = json.dumps(body).encode() if body is not None else b''
        handler.headers = {'Content-Type': 'application/json', 'Content-Length': str(len(payload)), 'Host': '127.0.0.1:8000'}
        handler.rfile = io.BytesIO(payload)
        handler.connection = Mock()
        handler.send_json = Mock()
        (handler.do_POST if method == 'POST' else handler.do_GET)()
        return handler.send_json.call_args.args

    def test_status_recipe_start_and_done(self):
        code, status = self.request('GET', '/api/machine')
        self.assertEqual((code, status['enabled'], status['connected'], status['firmware']), (200, True, True, 'sim-0.1.0'))
        code, reply = self.request('POST', '/api/machine/recipe', {'recipe': RECIPE})
        self.assertEqual((code, reply['ok'], reply['state']), (200, True, 'PREHEAT'))
        code, reply = self.request('POST', '/api/machine/start')
        self.assertEqual((code, reply['code']), (409, 'not_ready'))
        wait_for(self.sim, lambda s: s.get('state') == 'READY', timeout=15)
        code, reply = self.request('POST', '/api/machine/start')
        self.assertEqual((code, reply['state']), (200, 'BREWING'))
        code, reply = self.request('POST', '/api/machine/recipe', {'recipe': RECIPE})
        self.assertEqual((code, reply['code']), (409, 'busy'))
        code, reply = self.request('POST', '/api/machine/pause')
        self.assertEqual((code, reply['state']), (200, 'PAUSED'))
        code, reply = self.request('POST', '/api/machine/resume')
        self.assertEqual((code, reply['state']), (200, 'BREWING'))
        wait_for(self.sim, lambda s: s.get('state') == 'DONE', timeout=20)
        code, status = self.request('GET', '/api/machine')
        self.assertEqual(status['state'], 'DONE')
        self.assertGreater(status['telemetry']['poured_g'], 240)

    def test_incomplete_and_oversized_recipes_are_refused(self):
        code, reply = self.request('POST', '/api/machine/recipe', {'recipe': dict(RECIPE, steps=[])})
        self.assertEqual((code, reply['code']), (400, 'incomplete_recipe'))
        code, reply = self.request('POST', '/api/machine/recipe', {'recipe': dict(RECIPE, temperature_c=120)})
        self.assertEqual((code, reply['code']), (400, 'limit_temperature'))
        self.assertEqual(self.sim.state, 'IDLE')

    def test_abort_and_tare(self):
        self.request('POST', '/api/machine/recipe', {'recipe': RECIPE})
        code, reply = self.request('POST', '/api/machine/abort')
        self.assertEqual((code, reply['state']), (200, 'IDLE'))
        code, reply = self.request('POST', '/api/machine/tare')
        self.assertEqual(code, 200)
        code, reply = self.request('POST', '/api/machine/dance')
        self.assertEqual(code, 404)

    def test_error_from_machine_is_explained_and_cleared_by_new_recipe(self):
        self.request('POST', '/api/machine/recipe', {'recipe': RECIPE})
        self.sim.inject('temp_sensor')
        wait_for(self.sim, lambda s: s.get('state') == 'ERROR', timeout=5)
        code, status = self.request('GET', '/api/machine')
        self.assertEqual(status['telemetry']['err'], 'no_temp_sensor')
        self.sim.temp_sensor_ok = True
        code, reply = self.request('POST', '/api/machine/recipe', {'recipe': RECIPE})
        self.assertEqual((code, reply['state']), (200, 'PREHEAT'))

    def test_disconnected_and_absent_machine(self):
        self.sim.close()
        code, reply = self.request('POST', '/api/machine/start')
        self.assertEqual((code, reply['code']), (503, 'disconnected'))
        server.set_machine(None)
        code, status = self.request('GET', '/api/machine')
        self.assertEqual((code, status['enabled']), (200, False))
        code, reply = self.request('POST', '/api/machine/start')
        self.assertEqual(code, 404)


if __name__ == '__main__':
    unittest.main()
