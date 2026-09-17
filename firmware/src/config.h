// First Brew machine: pins, limits and calibration. Everything hardware-specific lives here.
#pragma once

// ---- Pins (ESP32 DevKit). ASSUMPTION: the owner did not specify pins; adjust before wiring.
#define PIN_PUMP        26   // MOSFET/relay driving the water pump (HIGH = on)
#define PIN_HEATER      27   // SSR/relay driving the heater (HIGH = on)
#define PIN_HX711_DT    16   // HX711 data
#define PIN_HX711_SCK   4    // HX711 clock
#define PIN_ONEWIRE     25   // DS18B20 water temperature sensor (ASSUMPTION: DS18B20 on 1-Wire)
#define PIN_ESTOP       -1   // emergency button; -1 = not installed
#define ESTOP_ACTIVE_LOW 1   // button pulls the pin to GND when pressed

#define HAS_SCALE       1    // 0 = no scale: timed pours from FLOW_G_PER_S ("mode":"timed")

// ---- Hard limits enforced in the firmware (commands beyond them are rejected)
#define MAX_TEMP_C      99.0f
#define MIN_TEMP_C      40.0f
#define MAX_WATER_G     400.0f
#define MAX_BREW_S      600.0f
#define MAX_STEPS       12
#define OVERHEAT_MARGIN_C 3.0f   // ERROR above MAX_TEMP_C + margin

// ---- Timing (milliseconds unless noted)
#define WATCHDOG_MS     3000   // no command from the server for this long → outputs off, ERROR
#define TELEMETRY_MS    250
#define DRY_RUN_MS      5000   // pump on but the weight not growing for this long → ERROR
#define DRY_RUN_MIN_G   1.0f
#define READY_BAND_C    1.0f   // PREHEAT → READY when |temp - target| ≤ band for READY_HOLD_MS
#define READY_HOLD_MS   2000
#define REHEAT_DROP_C   3.0f   // READY → PREHEAT when the water cools this much
#define TEMP_HYSTERESIS_C 0.5f // heater off at target, on again below target - hysteresis
#define TEMP_MIN_VALID_C -10.0f
#define TEMP_MAX_VALID_C 130.0f
#define TEMP_STALE_MS   3000   // no fresh sensor reading for this long counts as "no sensor"
#define TEMP_REQUEST_MS 1000   // DS18B20 conversion interval

// ---- Pour control
#define DRIP_G          3.0f     // water that still arrives after the pump stops (pump off early by this)
#define SCALE_FACTOR_DEFAULT 412.7f  // HX711 units per gram until calibrate_scale is run
#define SCALE_SAMPLES   4        // moving average of raw readings
#define FLOW_G_PER_S    5.0f     // timed mode: calibrated pump flow (see README)
#define TIMED_MARGIN    1.2f     // timed mode: never run longer than the computed time × margin

#define FW_VERSION      "0.1.0"
#define BOARD_NAME      "esp32"
#define LINE_MAX        1024
