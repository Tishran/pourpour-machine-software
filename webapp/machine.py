"""Bridge between the web server and the First Brew machine.

Two implementations share one interface: `SerialMachine` talks JSON lines over
USB serial to the ESP32 firmware (see docs/PROTOCOL.md); `SimulatedMachine`
emulates the machine so the interface can be developed and tested without
hardware. pyserial is imported only when a serial machine is created.
"""
import json
import queue
import random
import threading
import time

STATES = ('IDLE', 'PREHEAT', 'READY', 'BREWING', 'PAUSED', 'DONE', 'ERROR', 'ESTOP')
ACTIVE_STATES = {'PREHEAT', 'READY', 'BREWING', 'PAUSED'}
BUSY_STATES = {'BREWING', 'PAUSED'}
LIMITS = {'temperature_c': 99, 'min_temperature_c': 40, 'water_g': 400, 'brew_s': 600, 'steps': 12}
PING_INTERVAL_S = 1.0
COMMAND_TIMEOUT_S = 2.0

ERROR_MESSAGES = {
    'limit_temperature': 'The recipe temperature is outside the machine limits.',
    'limit_water': 'The recipe needs more water than the machine allows.',
    'limit_time': 'The recipe is longer than the machine allows.',
    'limit_steps': 'The recipe has no pours or too many pours for the machine.',
    'bad_steps': 'The pour schedule is inconsistent (weights or times out of order).',
    'bad_state': 'The machine cannot do that in its current state.',
    'bad_params': 'The command parameters are invalid.',
    'no_recipe': 'No recipe is loaded on the machine.',
    'not_ready': 'The water is still heating.',
    'no_scale': 'This machine has no scale.',
    'unknown_cmd': 'The machine does not know this command.',
    'invalid_json': 'The machine could not read the command.',
    'estop': 'The emergency stop is engaged. Restart the machine.',
    'incomplete_recipe': 'The recipe is incomplete: every pour needs a weight and a time.',
    'busy': 'The machine is already brewing. Stop it first.',
    'disconnected': 'The machine is not connected.',
    'timeout': 'The machine did not answer in time.',
    'watchdog': 'The link to the machine was lost during the brew.',
    'dry_run': 'The pump ran but the weight did not change. Check the water tank.',
    'no_temp_sensor': 'No reading from the temperature sensor.',
    'overheat': 'The water got too hot. The heater was switched off.',
}
STATUS_FOR = {'bad_state': 409, 'busy': 409, 'not_ready': 409, 'no_recipe': 409,
              'disconnected': 503, 'timeout': 504, 'estop': 503}


class MachineError(Exception):
    def __init__(self, code, message=None):
        self.code = code
        self.message = message or ERROR_MESSAGES.get(code, code)
        super().__init__(self.message)

    @property
    def status(self):
        return STATUS_FOR.get(self.code, 400)


# ---------------------------------------------------------------------------
# Protocol helpers shared by the simulator, the bridge and the tests
# ---------------------------------------------------------------------------
def _number(value):
    return value if isinstance(value, (int, float)) and not isinstance(value, bool) and value == value else None


def validate_recipe(payload, limits=LIMITS):
    """Check a `load_recipe` payload against the machine limits; return a normalized copy."""
    if not isinstance(payload, dict):
        raise MachineError('bad_params')
    dose, water, temperature = (_number(payload.get(k)) for k in ('dose', 'water', 'temperature'))
    if dose is None or water is None or temperature is None or dose <= 0 or water <= 0:
        raise MachineError('bad_params')
    if not limits['min_temperature_c'] <= temperature <= limits['temperature_c']:
        raise MachineError('limit_temperature', f"temperature {temperature:g} is outside {limits['min_temperature_c']}-{limits['temperature_c']} C")
    if water > limits['water_g']:
        raise MachineError('limit_water', f"water {water:g} g exceeds the {limits['water_g']} g limit")
    steps = payload.get('steps')
    if not isinstance(steps, list) or not steps or len(steps) > limits['steps']:
        raise MachineError('limit_steps')
    clean, last_target, last_stop = [], 0, 0
    for raw in steps:
        if not isinstance(raw, dict):
            raise MachineError('bad_steps')
        target, start, stop = (_number(raw.get(k)) for k in ('target_g', 'start_s', 'stop_s'))
        if target is None or start is None or stop is None:
            raise MachineError('bad_steps')
        if target < last_target or start < last_stop or stop < start or target <= 0:
            raise MachineError('bad_steps')
        if target > limits['water_g']:
            raise MachineError('limit_water', f"pour target {target:g} g exceeds the {limits['water_g']} g limit")
        if stop > limits['brew_s']:
            raise MachineError('limit_time', f"pour ends at {stop:g} s, later than the {limits['brew_s']} s limit")
        clean.append({'target_g': float(target), 'start_s': float(start), 'stop_s': float(stop)})
        last_target, last_stop = target, stop
    duration = _number(payload.get('duration_s'))
    if duration is None:
        duration = last_stop
    if duration < last_stop or duration > limits['brew_s']:
        raise MachineError('limit_time')
    return {'dose': float(dose), 'water': float(water), 'temperature': float(temperature),
            'duration_s': float(duration), 'steps': clean}


def recipe_to_machine(recipe):
    """Convert the web app's recipe object (unchanged roaster data) to a `load_recipe` payload."""
    if not isinstance(recipe, dict) or not isinstance(recipe.get('steps'), list):
        raise MachineError('incomplete_recipe')
    steps = []
    for step in recipe['steps']:
        if not isinstance(step, dict):
            raise MachineError('incomplete_recipe')
        target, start, stop = (step.get(k) for k in ('total_water_g', 'start_seconds', 'stop_seconds'))
        if _number(target) is None or _number(start) is None or _number(stop) is None:
            raise MachineError('incomplete_recipe')
        steps.append({'target_g': target, 'start_s': start, 'stop_s': stop})
    payload = {'dose': recipe.get('coffee_g'), 'water': recipe.get('water_g'),
               'temperature': recipe.get('temperature_c'), 'duration_s': recipe.get('duration_seconds'), 'steps': steps}
    if any(_number(payload[k]) is None for k in ('dose', 'water', 'temperature')) or not steps:
        raise MachineError('incomplete_recipe')
    if _number(payload['duration_s']) is None:
        payload['duration_s'] = steps[-1]['stop_s']
    return validate_recipe(payload)


# ---------------------------------------------------------------------------
# Common machine interface
# ---------------------------------------------------------------------------
class Machine:
    """Base class: event fan-out, latest telemetry and the server-side ping loop."""
    def __init__(self):
        self._listeners = set()
        self._listeners_lock = threading.Lock()
        self.latest = None
        self.info = {}
        self._pinger = None
        self._closed = threading.Event()

    @property
    def connected(self):
        return False

    @property
    def state(self):
        return self.latest['state'] if self.latest else None

    def command(self, cmd, **params):
        raise NotImplementedError

    def subscribe(self, maxsize=64):
        q = queue.Queue(maxsize=maxsize)
        with self._listeners_lock:
            self._listeners.add(q)
        return q

    def unsubscribe(self, q):
        with self._listeners_lock:
            self._listeners.discard(q)

    def _emit(self, event):
        if event.get('ev') == 'state':
            self.latest = event
        with self._listeners_lock:
            listeners = list(self._listeners)
        for q in listeners:
            try:
                q.put_nowait(event)
            except queue.Full:
                try:
                    q.get_nowait()  # drop the oldest event for a slow client
                    q.put_nowait(event)
                except (queue.Empty, queue.Full):
                    pass

    def start_pinger(self, interval=PING_INTERVAL_S):
        """The server keeps the firmware watchdog fed while the machine has outputs on."""
        def loop():
            while not self._closed.wait(interval):
                if self.connected and self.state in ACTIVE_STATES:
                    try:
                        self.command('ping')
                    except MachineError:
                        pass
        self._pinger = threading.Thread(target=loop, name='machine-pinger', daemon=True)
        self._pinger.start()

    def close(self):
        self._closed.set()


# ---------------------------------------------------------------------------
# Simulator
# ---------------------------------------------------------------------------
class SimulatedMachine(Machine):
    """A software machine: heating, weight growth, drip after the pump stops, faults on demand.

    `time_scale` speeds up the physics (20 = a 3-minute brew in 9 seconds). The link
    watchdog uses real seconds because it protects the link, not the brew.
    """
    HEAT_RATE = 1.6        # °C per second with the heater on
    COOL_RATE = 0.04       # °C per second towards the room
    FLOW_G_S = 5.0         # pump flow
    DRIP_G = 3.0           # water still arriving after the pump stops
    DRIP_S = 1.5
    READY_BAND_C = 1.0
    READY_HOLD_S = 2.0
    DRY_RUN_S = 5.0
    DRY_RUN_MIN_G = 1.0

    def __init__(self, time_scale=1.0, faults=False, watchdog_s=3.0, telemetry_s=0.25,
                 start_temp=22.0, has_scale=True, seed=None):
        super().__init__()
        self.time_scale = time_scale
        self.faults = faults
        self.watchdog_s = watchdog_s
        self.telemetry_s = telemetry_s
        self.has_scale = has_scale
        self.random = random.Random(seed)
        self.lock = threading.RLock()
        self.info = {'fw': 'sim-0.1.0', 'board': 'sim', 'scale': has_scale,
                     'mode': 'scale' if has_scale else 'timed', 'limits': dict(LIMITS)}
        self.temp = start_temp
        self.room = start_temp
        self.temp_sensor_ok = True
        self.scale_factor = 1.0
        self.reset_session()
        self._state = 'IDLE'
        self.err = None
        self.heater = False
        self.pump = False
        self.target_temp = None
        self.last_command = time.monotonic()
        self._emit(self.telemetry())  # `latest` is valid before the first tick
        self._thread = threading.Thread(target=self._run, name='machine-sim', daemon=True)
        self._thread.start()

    def reset_session(self):
        self.recipe = None
        self.t = 0.0
        self.poured = 0.0
        self.step = -1
        self.pump_latched_off = False
        self.drip_left = 0.0
        self.ready_since = None
        self.dry_run_since = None
        self.dry_run_weight = 0.0
        self.flow_blocked = False

    @property
    def connected(self):
        return not self._closed.is_set()

    # -- commands -----------------------------------------------------------
    def command(self, cmd, **params):
        if not self.connected:
            raise MachineError('disconnected')
        with self.lock:
            self.last_command = time.monotonic()
            handler = getattr(self, f'_cmd_{cmd}', None)
            if handler is None:
                raise MachineError('unknown_cmd')
            if self._state == 'ESTOP' and cmd not in ('hello', 'status', 'ping'):
                raise MachineError('estop')
            result = handler(**params) or {}
            return {'ok': True, **result}

    def _cmd_hello(self):
        return dict(self.info)

    def _cmd_ping(self):
        return {}

    def _cmd_status(self):
        self._emit(self.telemetry())
        return {}

    def _cmd_load_recipe(self, **payload):
        if self._state not in ('IDLE', 'READY', 'DONE'):
            raise MachineError('bad_state')
        recipe = validate_recipe(payload, self.info['limits'])
        self.reset_session()
        self.recipe = recipe
        self.target_temp = recipe['temperature']
        self.heater = True
        self._set_state('PREHEAT')
        return {}

    def _cmd_start(self):
        if self.recipe is None:
            raise MachineError('no_recipe')
        if self._state == 'PREHEAT':
            raise MachineError('not_ready')
        if self._state != 'READY':
            raise MachineError('bad_state')
        self.t = 0.0
        self.poured = 0.0
        self.step = -1
        self._set_state('BREWING')
        return {}

    def _cmd_pause(self):
        if self._state != 'BREWING':
            raise MachineError('bad_state')
        self.pump = False
        self._set_state('PAUSED')
        return {}

    def _cmd_resume(self):
        if self._state != 'PAUSED':
            raise MachineError('bad_state')
        self._set_state('BREWING')
        return {}

    def _cmd_abort(self):
        self._outputs_off()
        self.reset_session()
        self.err = None
        self.target_temp = None
        self._set_state('IDLE')
        return {}

    def _cmd_tare(self):
        if self._state not in ('IDLE', 'READY'):
            raise MachineError('bad_state')
        if not self.has_scale:
            raise MachineError('no_scale')
        self.poured = 0.0
        return {}

    def _cmd_set_temp(self, temperature=None):
        if self._state not in ('IDLE', 'READY', 'PREHEAT'):
            raise MachineError('bad_state')
        value = _number(temperature)
        if value is None:
            raise MachineError('bad_params')
        limits = self.info['limits']
        if not limits['min_temperature_c'] <= value <= limits['temperature_c']:
            raise MachineError('limit_temperature')
        self.target_temp = float(value)
        if self._state == 'READY':
            self.ready_since = None
            self._set_state('PREHEAT')
        return {}

    def _cmd_calibrate_scale(self, known_g=None):
        if self._state != 'IDLE':
            raise MachineError('bad_state')
        if not self.has_scale:
            raise MachineError('no_scale')
        if _number(known_g) is None or known_g <= 0:
            raise MachineError('bad_params')
        self.scale_factor = 412.7
        return {'factor': self.scale_factor}

    # -- test/fault hooks ---------------------------------------------------
    def inject(self, fault):
        """Force a fault: 'dry_run' (no flow), 'temp_sensor' (sensor dropout), 'estop'."""
        with self.lock:
            if fault == 'dry_run':
                self.flow_blocked = True
            elif fault == 'temp_sensor':
                self.temp_sensor_ok = False
            elif fault == 'estop':
                self._outputs_off()
                self.err = 'estop'
                self._set_state('ESTOP')
            else:
                raise ValueError(fault)

    # -- physics ------------------------------------------------------------
    def _outputs_off(self):
        self.pump = False
        self.heater = False

    def _fail(self, code):
        self._outputs_off()
        self.err = code
        self._set_state('ERROR')

    def _set_state(self, state):
        if state != self._state:
            self._state = state
            self._emit(self.telemetry())

    def telemetry(self):
        current = self.recipe['steps'][self.step] if self.recipe and self.step >= 0 else None
        upcoming = None
        if self.recipe and current is None:
            upcoming = next((s for s in self.recipe['steps'] if self.poured < s['target_g'] - 0.5), None)
        target = (current or upcoming or {}).get('target_g', 0.0)
        event = {'ev': 'state', 'state': self._state, 't': round(self.t, 2), 'step': self.step,
                 'poured_g': round(self.poured, 1), 'target_g': target,
                 'temp_c': round(self.temp, 1) if self.temp_sensor_ok else None,
                 'heater': int(self.heater), 'pump': int(self.pump), 'err': self.err, 'mode': self.info['mode']}
        if self.target_temp is not None:
            event['target_temp_c'] = self.target_temp
        return event

    def _run(self):
        last = time.monotonic()
        last_telemetry = last
        while not self._closed.wait(0.02):
            now = time.monotonic()
            dt = (now - last) * self.time_scale
            last = now
            with self.lock:
                self._tick(dt, now)
                if now - last_telemetry >= self.telemetry_s:
                    last_telemetry = now
                    self._emit(self.telemetry())

    def _tick(self, dt, now):
        if self._state == 'ESTOP':
            return
        # Link watchdog: real seconds without a command while outputs may be on.
        if self._state in ACTIVE_STATES and self.watchdog_s and now - self.last_command > self.watchdog_s:
            self._fail('watchdog')
            return
        if self.faults and self.random.random() < 0.002 * dt:
            self.temp_sensor_ok = not self.temp_sensor_ok
        # Heating.
        if self.heater:
            if not self.temp_sensor_ok:
                self._fail('no_temp_sensor')
                return
            if self.temp > LIMITS['temperature_c'] + 3:
                self._fail('overheat')
                return
            if self.target_temp is not None and self.temp < self.target_temp:
                self.temp = min(self.target_temp + 0.3, self.temp + self.HEAT_RATE * dt)
            else:
                self.temp -= self.COOL_RATE * dt
        else:
            self.temp += (self.room - self.temp) * min(1.0, self.COOL_RATE * dt / 10)
        # Drip after the pump stops.
        if self.drip_left > 0:
            drop = min(self.drip_left, self.DRIP_G / self.DRIP_S * dt)
            self.drip_left -= drop
            self.poured += drop
        if self._state == 'PREHEAT':
            if abs(self.temp - self.target_temp) <= self.READY_BAND_C:
                self.ready_since = self.ready_since if self.ready_since is not None else self.t_real(now)
                if self.t_real(now) - self.ready_since >= self.READY_HOLD_S / self.time_scale:
                    self._set_state('READY')
            else:
                self.ready_since = None
        elif self._state == 'READY':
            if self.temp < self.target_temp - 3:
                self.ready_since = None
                self._set_state('PREHEAT')
        elif self._state == 'BREWING':
            self._brew(dt, now)

    @staticmethod
    def t_real(now):
        return now

    def _brew(self, dt, now):
        self.t += dt
        steps = self.recipe['steps']
        # The active step: started, not yet poured to target.
        active = -1
        for i, s in enumerate(steps):
            if self.t >= s['start_s'] and self.poured < s['target_g'] - 0.5:
                active = i
                break
        if active != self.step:
            self.step = active
            self.pump_latched_off = False
        want_pump = False
        if active >= 0:
            s = steps[active]
            if self.poured >= s['target_g'] - self.DRIP_G:
                self.pump_latched_off = True
            want_pump = not self.pump_latched_off
        if want_pump and not self.pump:
            self.dry_run_since, self.dry_run_weight = now, self.poured
        if self.pump and not want_pump:
            self.drip_left = self.DRIP_G
        self.pump = want_pump
        if self.pump:
            if self.faults and self.random.random() < 0.003 * dt:
                self.flow_blocked = True
            if not self.flow_blocked:
                # Never overshoot the latch point inside one tick (matters at high time scales).
                room = max(0.0, steps[active]['target_g'] - self.DRIP_G - self.poured)
                self.poured += min(room, self.FLOW_G_S * dt * (1 + self.random.uniform(-0.05, 0.05)))
            if self.poured - self.dry_run_weight >= self.DRY_RUN_MIN_G:
                self.dry_run_since, self.dry_run_weight = now, self.poured
            elif now - self.dry_run_since >= self.DRY_RUN_S / self.time_scale:
                self._fail('dry_run')
                return
        finished = self.poured >= steps[-1]['target_g'] - 0.5 and self.t >= self.recipe['duration_s']
        if finished:
            self._outputs_off()
            self.step = -1
            self._set_state('DONE')

    def close(self):
        super().close()
        self._thread.join(timeout=1)


# ---------------------------------------------------------------------------
# Serial bridge
# ---------------------------------------------------------------------------
class SerialMachine(Machine):
    """JSON lines over USB serial with port autodetection and reconnection."""
    USB_HINTS = ('usbserial', 'usbmodem', 'ttyUSB', 'ttyACM', 'wchusbserial', 'SLAB_USBtoUART')

    def __init__(self, port=None, baud=115200, reconnect_s=2.0):
        super().__init__()
        import serial  # pyserial, only needed for real hardware
        import serial.tools.list_ports
        self._serial_module = serial
        self._list_ports = serial.tools.list_ports.comports
        self.port_hint = port
        self.baud = baud
        self.reconnect_s = reconnect_s
        self.port = None
        self._link = None
        self._connected = False
        self._write_lock = threading.Lock()
        self._pending = {}
        self._pending_lock = threading.Lock()
        self._next_id = 1
        self._thread = threading.Thread(target=self._run, name='machine-serial', daemon=True)
        self._thread.start()

    @property
    def connected(self):
        return self._connected

    def find_port(self):
        if self.port_hint:
            return self.port_hint
        ports = list(self._list_ports())
        for p in ports:
            if p.vid is not None and (p.vid in (0x10C4, 0x1A86, 0x303A, 0x0403) or 'CP210' in (p.description or '') or 'CH340' in (p.description or '')):
                return p.device
        for p in ports:
            if any(hint in p.device for hint in self.USB_HINTS):
                return p.device
        return None

    def _run(self):
        serial = self._serial_module
        while not self._closed.is_set():
            port = self.find_port()
            if not port:
                self._closed.wait(self.reconnect_s)
                continue
            try:
                self._link = serial.Serial(port, self.baud, timeout=1)
                self.port = port
                self._closed.wait(1.5)  # the ESP32 resets when the port opens
                self._link.reset_input_buffer()
                self._connected = True
                self._emit({'ev': 'link', 'connected': True, 'port': port})
                try:
                    self.info = {k: v for k, v in self.command('hello').items() if k != 'ok'}
                    self._emit({'ev': 'link', 'connected': True, 'port': port, 'info': self.info})
                except MachineError:
                    pass
                while not self._closed.is_set():
                    line = self._link.readline()
                    if not line:
                        continue
                    self._handle_line(line)
            except (OSError, serial.SerialException):
                pass
            finally:
                self._drop_link()
            self._closed.wait(self.reconnect_s)

    def _drop_link(self):
        was_connected = self._connected
        self._connected = False
        try:
            if self._link:
                self._link.close()
        except Exception:
            pass
        self._link = None
        with self._pending_lock:
            for waiter in self._pending.values():
                waiter['error'] = MachineError('disconnected')
                waiter['event'].set()
            self._pending.clear()
        if was_connected:
            self._emit({'ev': 'link', 'connected': False, 'port': self.port})

    def _handle_line(self, line):
        try:
            message = json.loads(line.decode('utf-8', 'replace'))
        except ValueError:
            return
        if not isinstance(message, dict):
            return
        if 'ack' in message:
            with self._pending_lock:
                waiter = self._pending.pop(message['ack'], None)
            if waiter:
                waiter['reply'] = message
                waiter['event'].set()
        elif message.get('ev') == 'state':
            self._emit(message)
        elif message.get('ev') == 'hello':
            self.info = {k: v for k, v in message.items() if k != 'ev'}
            self._emit({'ev': 'link', 'connected': True, 'port': self.port, 'info': self.info})

    def command(self, cmd, **params):
        if not self._connected or self._link is None:
            raise MachineError('disconnected')
        with self._pending_lock:
            request_id = self._next_id
            self._next_id += 1
            waiter = {'event': threading.Event(), 'reply': None, 'error': None}
            self._pending[request_id] = waiter
        line = json.dumps({'cmd': cmd, 'id': request_id, **params}, ensure_ascii=False, separators=(',', ':')) + '\n'
        try:
            with self._write_lock:
                self._link.write(line.encode('utf-8'))
                self._link.flush()
        except Exception:
            with self._pending_lock:
                self._pending.pop(request_id, None)
            raise MachineError('disconnected')
        if not waiter['event'].wait(COMMAND_TIMEOUT_S):
            with self._pending_lock:
                self._pending.pop(request_id, None)
            raise MachineError('timeout')
        if waiter['error']:
            raise waiter['error']
        reply = waiter['reply']
        if not reply.get('ok'):
            raise MachineError(reply.get('error', 'bad_params'), reply.get('message'))
        return {k: v for k, v in reply.items() if k != 'ack'}

    def close(self):
        super().close()
        self._drop_link()


def create_machine(spec, sim_speed=1.0, sim_faults=False):
    """`--machine none|sim|serial[:/dev/tty...]`."""
    spec = (spec or 'none').strip()
    if spec == 'none':
        return None
    if spec == 'sim':
        return SimulatedMachine(time_scale=sim_speed, faults=sim_faults)
    if spec == 'serial' or spec.startswith('serial:'):
        port = spec.partition(':')[2] or None
        return SerialMachine(port=port)
    raise ValueError(f'Unknown machine: {spec!r}. Use none, sim or serial[:/dev/tty...].')
