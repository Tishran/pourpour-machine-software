# First Brew machine firmware (ESP32)

PlatformIO project for the ESP32 (Arduino framework). The board talks to `webapp/server.py`
over USB serial using the JSON-lines protocol in [docs/PROTOCOL.md](../docs/PROTOCOL.md).
`loop()` never blocks: serial input is read byte by byte, sensors are polled, and the
state machine (`src/state_machine.cpp`) ticks on `millis()`. No `delay()` in the working cycle.

## Hardware (assumptions, change in `src/config.h`)

The owner confirmed: ESP32, USB link, water pump (relay/MOSFET), heater (relay/SSR),
HX711 scale, a temperature sensor, no emergency button. Pins and the sensor type were not
specified, so these defaults are **assumptions**:

| function | pin | note |
| --- | --- | --- |
| pump | GPIO 26 | `HIGH` = on, through a MOSFET/relay module |
| heater | GPIO 27 | `HIGH` = on, through an SSR; never drive a heater from the GPIO directly |
| HX711 DT / SCK | GPIO 16 / GPIO 4 | load cell under the dripper |
| temperature | GPIO 25 | DS18B20 (1-Wire, waterproof probe) with a 4.7 kΩ pull-up |
| emergency button | not installed (`PIN_ESTOP -1`) | set a pin and `ESTOP_ACTIVE_LOW` if one is added |

Limits (`MAX_TEMP_C` 99, `MAX_WATER_G` 400, `MAX_BREW_S` 600, `MAX_STEPS` 12) and the timing
constants (watchdog 3 s, dry run 5 s, telemetry 250 ms) are in the same file.
If there is no scale, set `HAS_SCALE 0`: pours become timed from `FLOW_G_PER_S` and the
telemetry reports `"mode":"timed"`.

## Build and flash

```sh
pip install platformio          # once
cd firmware
pio run                         # compile
pio run -t upload               # flash over USB
pio device monitor -b 115200    # watch the JSON lines
```

The USB port is detected automatically by `pio` and by the server (`python3 server.py --machine serial`).
Opening the port resets the ESP32; the server waits 1.5 s and then sends `hello`.

## Safety in the firmware

- Link watchdog: with outputs on (`PREHEAT`, `READY`, `BREWING`, `PAUSED`) and no command for 3 s,
  the pump and heater are switched off and the state becomes `ERROR` (`watchdog`).
- The heater never runs without a fresh, valid sensor reading; losing the sensor with the heater on
  → `ERROR` (`no_temp_sensor`). Above `MAX_TEMP_C + 3` → `ERROR` (`overheat`).
- Pump on but the scale not gaining 1 g in 5 s → `ERROR` (`dry_run`).
- Every error switches the outputs off before it is reported. `abort` returns to `IDLE`.
- Emergency button (if installed): a hardware interrupt cuts both outputs and latches `ESTOP`
  until the board is restarted.
- Recipes above the limits are rejected with `ok:false`.

Heating uses hysteresis (`TEMP_HYSTERESIS_C`, off at the target, on again half a degree below).
A PID loop can replace it later in `Brewer::controlHeater`.

## Calibrating the scale

1. Power the machine with nothing on the scale. After the first four HX711 samples the current
   reading becomes zero (`tare` repeats this).
2. Put a known weight on it, e.g. a 200 g calibration weight or a measured cup of water.
3. Send `{"cmd":"calibrate_scale","id":1,"known_g":200}` (from `pio device monitor`, or through the
   server with a small script). The ack returns the factor; it is stored in flash (NVS) and survives reboots.
4. Check: telemetry `poured_g` during a brew should match the scale you compare against within a few grams.

`DRIP_G` (3 g by default) is how early the pump stops before the target, to absorb the water still in
the tube. Measure it once with water: pour to 100 g, note where the scale settles, adjust.

## Calibrating the flow (timed mode only)

Run the pump into a cup for 20 s (`HAS_SCALE 0`, then `load_recipe` with a single 100 g step and `start`),
weigh the water and set `FLOW_G_PER_S = grams / 20`. The pump never runs longer than the computed
time × `TIMED_MARGIN` (1.2).

## Dry check without water

1. Leave the tank empty, connect only USB, flash the firmware.
2. `pio device monitor -b 115200`: you should see the `hello` line and a `state` line every 250 ms
   with `"state":"IDLE"`, the temperature and the scale.
3. Send `{"cmd":"load_recipe","id":1,"dose":15,"water":250,"temperature":50,"steps":[{"target_g":50,"start_s":0,"stop_s":15}]}`
   (a low temperature so the heater test is short). The state goes `PREHEAT` → `READY` when the water reaches 50 °C.
   Without a heater or sensor connected the firmware refuses to heat and reports `no_temp_sensor` — that is the check working.
4. Stop sending anything for 3 s: the state becomes `ERROR` with `"err":"watchdog"` and both outputs read `0`.
5. `{"cmd":"abort","id":2}` returns to `IDLE`.
6. Press on the scale with a finger during a `start`ed brew to see `poured_g` grow; release for 5 s with the pump on to see `dry_run`.

## Layout

- `src/config.h` — pins, limits, timing, calibration constants.
- `src/hardware.*` — pump/heater outputs, HX711 scale (non-blocking, filtered, NVS-stored factor),
  DS18B20 (asynchronous conversions), emergency button interrupt.
- `src/state_machine.*` — `Brewer`: commands, validation, state transitions, heater and pour control, telemetry.
- `src/main.cpp` — serial line reader, JSON parsing (ArduinoJson), telemetry timer.
