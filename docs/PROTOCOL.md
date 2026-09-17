# First Brew machine protocol

Link between `webapp/server.py` and the brewing machine (ESP32, Arduino framework).
The phone never talks to the board directly:

```
Phone (browser) ──HTTP + SSE──▶ webapp/server.py ──USB serial (JSON lines)──▶ ESP32
```

## Transport

- USB serial, **115200 baud**, 8N1, UTF-8.
- One JSON object per line, terminated by `\n`. No pretty printing, no line longer than 1024 bytes.
- The server sends **commands**; the machine answers every command with exactly one **ack**.
- The machine also sends **events** on its own, without a request: `state` telemetry every 250 ms
  and a `hello` event once after boot.
- Anything that is not valid JSON, or has no `cmd`, gets `{"ack": null, "ok": false, "error": "invalid_json"}`.

## Commands

Every command is `{"cmd": "<name>", "id": <number or string>, ...params}`.
The ack is `{"ack": <same id>, "ok": true, ...result}` or
`{"ack": <same id>, "ok": false, "error": "<code>", "message": "<human text>"}`.

| cmd | params | allowed in | effect / result |
| --- | --- | --- | --- |
| `hello` | — | any | `{"fw": "0.1.0", "board": "esp32", "scale": true, "mode": "scale", "limits": {"temperature_c": 99, "water_g": 400, "brew_s": 600, "steps": 12}}` |
| `status` | — | any | ack, followed immediately by a `state` event |
| `ping` | — | any | ack; resets the link watchdog (see Safety) |
| `load_recipe` | `dose` g, `water` g, `temperature` °C, `duration_s` (optional, defaults to the last `stop_s`), `steps`: list of `{"target_g", "start_s", "stop_s"}` | `IDLE`, `READY`, `DONE` | validates limits, stores the recipe, turns the heater on → `PREHEAT` |
| `start` | — | `READY` | records the current scale reading as zero, starts the brew clock → `BREWING` |
| `pause` | — | `BREWING` | pump off, clock frozen, heater keeps temperature → `PAUSED` |
| `resume` | — | `PAUSED` | → `BREWING`; the pour that was interrupted continues |
| `abort` | — | any except `ESTOP` | pump and heater off, recipe cleared → `IDLE`; also clears `ERROR` |
| `tare` | — | `IDLE`, `READY` | zeroes the scale (`no_scale` if the machine has no scale) |
| `set_temp` | `temperature` °C | `IDLE`, `READY`, `PREHEAT` | changes the target water temperature within limits |
| `calibrate_scale` | `known_g` (a known weight currently on the scale) | `IDLE` | computes and stores the HX711 scale factor; result `{"factor": 412.7}` |

`target_g` is the **cumulative** weight on the scale at the end of the pour, exactly as the roaster's
recipe lists it (`total_water_g` in the web app). `start_s`/`stop_s` are seconds from the start of the brew.

### Validation of `load_recipe`

Rejected with `ok:false` and one of these codes when:

| error | condition |
| --- | --- |
| `limit_temperature` | `temperature` > `MAX_TEMP_C` (default 99) or < 40 |
| `limit_water` | `water` or any `target_g` > `MAX_WATER_G` (default 400) |
| `limit_time` | `duration_s` or any `stop_s` > `MAX_BREW_S` (default 600) |
| `limit_steps` | no steps or more than `MAX_STEPS` (default 12) |
| `bad_steps` | targets not non-decreasing, `stop_s` < `start_s`, steps overlapping or out of order, non-numeric fields |
| `bad_state` | the machine is brewing, paused, preheating, in `ERROR` or `ESTOP` |

Other error codes: `unknown_cmd`, `invalid_json`, `no_recipe` (`start` without a loaded recipe),
`not_ready` (`start` while still preheating), `no_scale`, `bad_params`, `estop`.

## Telemetry

Every 250 ms, in every state:

```json
{"ev":"state","state":"BREWING","t":42.5,"step":2,"poured_g":118.4,"target_g":150,"temp_c":95.6,"heater":1,"pump":1,"err":null,"mode":"scale"}
```

| field | meaning |
| --- | --- |
| `state` | one of the states below |
| `t` | brew clock, seconds since `start`; `0` before start, frozen while paused |
| `step` | index of the current step (0-based), `-1` when no step is active |
| `poured_g` | water poured since `start`, from the scale (or estimated in timed mode) |
| `target_g` | target of the current step, or of the next step while waiting; `0` when idle |
| `temp_c` | water temperature; `null` if the sensor gives no reading |
| `target_temp_c` | current target temperature (present when a recipe is loaded) |
| `heater`, `pump` | `0`/`1` actual output state |
| `err` | error code while in `ERROR`/`ESTOP`, otherwise `null` |
| `mode` | `scale` (weight-controlled) or `timed` (no scale: pump time from a calibrated flow rate) |

After boot: `{"ev":"hello","fw":"0.1.0","board":"esp32","scale":true,"mode":"scale"}`.

## States

`IDLE` → `PREHEAT` → `READY` → `BREWING` ⇄ `PAUSED` → `DONE`, plus `ERROR` and `ESTOP`.

| from | event | to | outputs |
| --- | --- | --- | --- |
| `IDLE` | `load_recipe` ok | `PREHEAT` | heater on |
| `PREHEAT` | temperature within ±1 °C of target for 2 s | `READY` | heater holds temperature |
| `READY` | `start` | `BREWING` | scale zeroed, clock starts |
| `READY` | temperature drifts more than 3 °C below target | `PREHEAT` | heater on |
| `BREWING` | `t` reaches a step's `start_s` and `poured_g` < `target_g` | `BREWING` | pump on |
| `BREWING` | `poured_g` ≥ `target_g` − `DRIP_G` | `BREWING` | pump off (drip compensation) |
| `BREWING` | `pause` | `PAUSED` | pump off, clock frozen |
| `PAUSED` | `resume` | `BREWING` | clock continues |
| `BREWING` | all targets reached and `t` ≥ `duration_s` | `DONE` | pump off, heater off |
| `DONE` | `load_recipe` | `PREHEAT` | heater on |
| any but `ESTOP` | `abort` | `IDLE` | pump off, heater off |
| any | safety fault | `ERROR` | pump off, heater off; `err` set |
| `ERROR` | `abort` | `IDLE` | — |
| any | emergency button pressed | `ESTOP` | everything off until reboot |

## Safety (enforced by the firmware, not by the app)

- **Link watchdog.** Whenever the heater or pump may be on (`PREHEAT`, `READY`, `BREWING`, `PAUSED`),
  a gap of more than `WATCHDOG_MS` (3000 ms) without any command (`ping` or other) turns the pump and heater
  off and moves to `ERROR` with `err: "watchdog"`. The server pings once a second.
- **Hard limits** on temperature, water and time live in `config.h`; commands above them are rejected.
- **Dry run.** With the pump on, if the scale gains less than 1 g in 5 s → `ERROR` `dry_run`.
  In timed mode the pump additionally never runs longer than the calibrated time for one step plus 20 %.
- **No temperature reading** (sensor missing or reading outside −10…130 °C) → the heater never turns on;
  if it happens with the heater on → `ERROR` `no_temp_sensor`.
- **Overheat.** Temperature above `MAX_TEMP_C + 3` → `ERROR` `overheat`.
- **Any error** de-energises the pump and heater first, then reports.
- **Emergency button** (if wired, `ESTOP_PIN` ≥ 0): hardware interrupt cuts the outputs and moves to `ESTOP`;
  only a reboot leaves that state.

## Server bridge

`webapp/machine.py` implements the same interface twice: `SerialMachine` (pyserial, port autodetection,
reconnection) and `SimulatedMachine` (full emulation for development and tests). The server exposes:

| HTTP | purpose |
| --- | --- |
| `GET /api/machine` | `{"enabled", "connected", "state", "firmware", "mode", "telemetry"}` |
| `POST /api/machine/recipe` | body: the `recipe` object from `/api/recipes/{id}` or the photo flow, unchanged; converted to `load_recipe` |
| `POST /api/machine/start`, `/pause`, `/resume`, `/abort`, `/tare` | forwards the command |
| `GET /api/machine/events` | Server-Sent Events: `event: state` with the telemetry JSON, `event: link` on connect/disconnect |

The server sends `ping` every second by itself. Only one brew session exists: `POST /api/machine/recipe`
answers `409` while a brew is `BREWING` or `PAUSED`; `abort` first.

## Example: a three-pour recipe

Server → machine lines are marked `>`, machine → server `<`. Telemetry lines are shortened.

```
> {"cmd":"hello","id":1}
< {"ack":1,"ok":true,"fw":"0.1.0","board":"esp32","scale":true,"mode":"scale","limits":{"temperature_c":99,"water_g":400,"brew_s":600,"steps":12}}
< {"ev":"state","state":"IDLE","t":0,"step":-1,"poured_g":0,"target_g":0,"temp_c":71.8,"heater":0,"pump":0,"err":null,"mode":"scale"}
> {"cmd":"load_recipe","id":2,"dose":15,"water":250,"temperature":96,"duration_s":150,"steps":[{"target_g":50,"start_s":0,"stop_s":15},{"target_g":150,"start_s":30,"stop_s":45},{"target_g":250,"start_s":75,"stop_s":90}]}
< {"ack":2,"ok":true}
< {"ev":"state","state":"PREHEAT","t":0,"step":-1,"poured_g":0,"target_g":50,"temp_c":72.1,"target_temp_c":96,"heater":1,"pump":0,"err":null,"mode":"scale"}
> {"cmd":"ping","id":3}
< {"ack":3,"ok":true}
   … heating, one state line every 250 ms, one ping every second …
< {"ev":"state","state":"READY","t":0,"step":-1,"poured_g":0,"target_g":50,"temp_c":96.2,"target_temp_c":96,"heater":1,"pump":0,"err":null,"mode":"scale"}
> {"cmd":"start","id":9}
< {"ack":9,"ok":true}
< {"ev":"state","state":"BREWING","t":0.2,"step":0,"poured_g":0.4,"target_g":50,"temp_c":96.1,"target_temp_c":96,"heater":1,"pump":1,"err":null,"mode":"scale"}
< {"ev":"state","state":"BREWING","t":8.0,"step":0,"poured_g":48.6,"target_g":50,"temp_c":96.0,"target_temp_c":96,"heater":1,"pump":0,"err":null,"mode":"scale"}
< {"ev":"state","state":"BREWING","t":20.0,"step":-1,"poured_g":50.3,"target_g":150,"temp_c":95.9,"target_temp_c":96,"heater":1,"pump":0,"err":null,"mode":"scale"}
< {"ev":"state","state":"BREWING","t":30.3,"step":1,"poured_g":51.1,"target_g":150,"temp_c":96.0,"target_temp_c":96,"heater":1,"pump":1,"err":null,"mode":"scale"}
> {"cmd":"pause","id":40}
< {"ack":40,"ok":true}
< {"ev":"state","state":"PAUSED","t":36.5,"step":1,"poured_g":91.0,"target_g":150,"temp_c":96.0,"target_temp_c":96,"heater":1,"pump":0,"err":null,"mode":"scale"}
> {"cmd":"resume","id":41}
< {"ack":41,"ok":true}
< {"ev":"state","state":"BREWING","t":36.7,"step":1,"poured_g":91.2,"target_g":150,"temp_c":96.0,"target_temp_c":96,"heater":1,"pump":1,"err":null,"mode":"scale"}
   … third pour at t=75 …
< {"ev":"state","state":"BREWING","t":90.0,"step":-1,"poured_g":250.4,"target_g":0,"temp_c":95.8,"target_temp_c":96,"heater":1,"pump":0,"err":null,"mode":"scale"}
< {"ev":"state","state":"DONE","t":150.0,"step":-1,"poured_g":250.4,"target_g":0,"temp_c":94.9,"target_temp_c":96,"heater":0,"pump":0,"err":null,"mode":"scale"}
> {"cmd":"abort","id":160}
< {"ack":160,"ok":true}
< {"ev":"state","state":"IDLE","t":0,"step":-1,"poured_g":0,"target_g":0,"temp_c":94.7,"heater":0,"pump":0,"err":null,"mode":"scale"}
```

A rejected command, for comparison:

```
> {"cmd":"load_recipe","id":5,"dose":15,"water":250,"temperature":120,"steps":[{"target_g":250,"start_s":0,"stop_s":30}]}
< {"ack":5,"ok":false,"error":"limit_temperature","message":"temperature 120 exceeds the 99 C limit"}
```
