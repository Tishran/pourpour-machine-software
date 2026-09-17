#include "hardware.h"
#include <HX711.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <Preferences.h>

namespace {
HX711 hx711;
OneWire oneWire(PIN_ONEWIRE);
DallasTemperature sensors(&oneWire);
Preferences prefs;
Output* estopPump = nullptr;
Output* estopHeater = nullptr;
}

// ---- Scale ------------------------------------------------------------------
void Scale::begin() {
#if HAS_SCALE
  hx711.begin(PIN_HX711_DT, PIN_HX711_SCK);
  prefs.begin("firstbrew", true);
  factor_ = prefs.getFloat("scale", SCALE_FACTOR_DEFAULT);
  prefs.end();
  if (!(factor_ > 0)) factor_ = SCALE_FACTOR_DEFAULT;
#endif
}

void Scale::update() {
#if HAS_SCALE
  if (!hx711.is_ready()) return;
  raw_ = (float)hx711.read();
  samples_[sampleIndex_] = raw_;
  sampleIndex_ = (sampleIndex_ + 1) % SCALE_SAMPLES;
  if (sampleCount_ < SCALE_SAMPLES) sampleCount_++;
  float sum = 0;
  for (int i = 0; i < sampleCount_; i++) sum += samples_[i];
  float filtered = sum / sampleCount_;
  if (!ready_ && sampleCount_ == SCALE_SAMPLES) {
    offset_ = filtered;   // first stable reading becomes zero
    ready_ = true;
  }
  grams_ = (filtered - offset_) / factor_;
#endif
}

void Scale::tare() {
  float sum = 0;
  for (int i = 0; i < sampleCount_; i++) sum += samples_[i];
  if (sampleCount_) offset_ = sum / sampleCount_;
  grams_ = 0;
}

float Scale::calibrate(float knownGrams) {
  float sum = 0;
  for (int i = 0; i < sampleCount_; i++) sum += samples_[i];
  float filtered = sampleCount_ ? sum / sampleCount_ : raw_;
  float factor = (filtered - offset_) / knownGrams;
  if (factor > 0) {
    factor_ = factor;
    prefs.begin("firstbrew", false);
    prefs.putFloat("scale", factor_);
    prefs.end();
  }
  grams_ = (filtered - offset_) / factor_;
  return factor_;
}

// ---- Temperature -------------------------------------------------------------
void TempSensor::begin() {
  sensors.begin();
  sensors.setWaitForConversion(false);
  sensors.setResolution(11);   // ~375 ms conversion, 0.125 °C
}

void TempSensor::update() {
  unsigned long now = millis();
  if (pending_ && sensors.isConversionComplete()) {
    float value = sensors.getTempCByIndex(0);
    pending_ = false;
    if (value != DEVICE_DISCONNECTED_C && value > TEMP_MIN_VALID_C && value < TEMP_MAX_VALID_C) {
      temp_ = value;
      lastValid_ = now;
    }
  }
  if (!pending_ && now - lastRequest_ >= TEMP_REQUEST_MS) {
    sensors.requestTemperatures();
    lastRequest_ = now;
    pending_ = true;
  }
}

bool TempSensor::valid(unsigned long now) const {
  return !isnan(temp_) && lastValid_ != 0 && now - lastValid_ <= TEMP_STALE_MS;
}

// ---- Emergency stop ----------------------------------------------------------
volatile bool EStop::triggered = false;

static void IRAM_ATTR onEstop() {
  EStop::triggered = true;
  // Cut power in the interrupt itself: do not wait for loop().
  digitalWrite(PIN_PUMP, LOW);
  digitalWrite(PIN_HEATER, LOW);
}

void EStop::begin(Output* pump, Output* heater) {
  estopPump = pump;
  estopHeater = heater;
#if PIN_ESTOP >= 0
  pinMode(PIN_ESTOP, ESTOP_ACTIVE_LOW ? INPUT_PULLUP : INPUT_PULLDOWN);
  attachInterrupt(digitalPinToInterrupt(PIN_ESTOP), onEstop, ESTOP_ACTIVE_LOW ? FALLING : RISING);
  if (pressed()) triggered = true;
#endif
}

bool EStop::pressed() const {
#if PIN_ESTOP >= 0
  int level = digitalRead(PIN_ESTOP);
  return ESTOP_ACTIVE_LOW ? level == LOW : level == HIGH;
#else
  return false;
#endif
}
