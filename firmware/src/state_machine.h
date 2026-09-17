// Brew controller: the state machine from docs/PROTOCOL.md. Non-blocking, driven by tick(millis()).
#pragma once
#include <Arduino.h>
#include <ArduinoJson.h>
#include "config.h"
#include "hardware.h"

enum class State { IDLE, PREHEAT, READY, BREWING, PAUSED, DONE, ERROR, ESTOP };
const char* stateName(State s);

struct Step {
  float targetG;
  float startS;
  float stopS;
};

struct Recipe {
  float doseG = 0, waterG = 0, temperatureC = 0, durationS = 0;
  int stepCount = 0;
  Step steps[MAX_STEPS];
};

class Brewer {
 public:
  Brewer(Output& pump, Output& heater, Scale& scale, TempSensor& temp, EStop& estop)
      : pump_(pump), heater_(heater), scale_(scale), temp_(temp), estop_(estop) {}

  void begin(unsigned long now);
  void tick(unsigned long now);                        // call every loop()
  // Handles one parsed command; fills `out` with the ack fields (ok/error/message/extras).
  void handle(JsonDocument& in, JsonDocument& out, unsigned long now);
  void telemetry(JsonDocument& out, unsigned long now) const;
  State state() const { return state_; }

 private:
  // command handlers
  bool loadRecipe(JsonDocument& in, JsonDocument& out);
  bool start(JsonDocument& out, unsigned long now);
  bool pause(JsonDocument& out);
  bool resume(JsonDocument& out, unsigned long now);
  void abort();
  bool tare(JsonDocument& out);
  bool setTemp(JsonDocument& in, JsonDocument& out);
  bool calibrate(JsonDocument& in, JsonDocument& out);
  // internals
  void setState(State s);
  void fail(const char* code);
  void outputsOff();
  void controlHeater(unsigned long now);
  void brew(unsigned long now);
  float pouredG() const;
  bool reject(JsonDocument& out, const char* code, const char* message = nullptr);

  Output& pump_;
  Output& heater_;
  Scale& scale_;
  TempSensor& temp_;
  EStop& estop_;

  State state_ = State::IDLE;
  const char* err_ = nullptr;
  Recipe recipe_;
  bool hasRecipe_ = false;
  float targetTempC_ = 0;
  int step_ = -1;
  bool pumpLatchedOff_ = false;
  unsigned long lastCommandMs_ = 0;
  unsigned long readySinceMs_ = 0;
  // brew clock: accumulated ms while BREWING
  unsigned long brewStartMs_ = 0, brewAccumMs_ = 0;
  float scaleZeroG_ = 0;      // scale reading at start
  float timedPouredG_ = 0;    // timed mode estimate
  unsigned long pumpOnMs_ = 0, dryRunSinceMs_ = 0;
  float dryRunWeightG_ = 0;
};
