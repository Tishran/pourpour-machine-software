// Thin wrappers around the actuators and sensors so the state machine stays readable.
#pragma once
#include <Arduino.h>
#include "config.h"

class Output {
 public:
  explicit Output(int pin) : pin_(pin) {}
  void begin() { pinMode(pin_, OUTPUT); set(false); }
  void set(bool on) { on_ = on; digitalWrite(pin_, on ? HIGH : LOW); }
  bool isOn() const { return on_; }
 private:
  int pin_;
  bool on_ = false;
};

// HX711 load cell, non-blocking: a sample is taken only when the chip says it is ready.
class Scale {
 public:
  void begin();
  void update();                 // call from loop()
  bool available() const { return HAS_SCALE && ready_; }
  float grams() const { return grams_; }   // filtered, relative to the last tare
  void tare();
  float calibrate(float knownGrams);       // returns the new factor (units per gram), stores it in NVS
  float factor() const { return factor_; }
 private:
  float raw_ = 0, offset_ = 0, factor_ = SCALE_FACTOR_DEFAULT, grams_ = 0;
  bool ready_ = false;
  float samples_[SCALE_SAMPLES] = {0};
  int sampleIndex_ = 0, sampleCount_ = 0;
};

// DS18B20 in asynchronous mode: request, then read when the conversion is done.
class TempSensor {
 public:
  void begin();
  void update();
  bool valid(unsigned long now) const;     // fresh reading within a sane range
  float celsius() const { return temp_; }
 private:
  float temp_ = NAN;
  unsigned long lastRequest_ = 0, lastValid_ = 0;
  bool pending_ = false;
};

// Emergency button: hardware interrupt cuts the outputs immediately; the state machine then latches ESTOP.
class EStop {
 public:
  void begin(Output* pump, Output* heater);
  bool pressed() const;
  static volatile bool triggered;
};
