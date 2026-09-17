#include "state_machine.h"

const char* stateName(State s) {
  switch (s) {
    case State::IDLE: return "IDLE";
    case State::PREHEAT: return "PREHEAT";
    case State::READY: return "READY";
    case State::BREWING: return "BREWING";
    case State::PAUSED: return "PAUSED";
    case State::DONE: return "DONE";
    case State::ERROR: return "ERROR";
    case State::ESTOP: return "ESTOP";
  }
  return "?";
}

static bool isNumber(JsonVariantConst v) { return v.is<float>() || v.is<int>() || v.is<long>() || v.is<double>(); }

void Brewer::begin(unsigned long now) {
  lastCommandMs_ = now;
  outputsOff();
}

bool Brewer::reject(JsonDocument& out, const char* code, const char* message) {
  out["ok"] = false;
  out["error"] = code;
  if (message) out["message"] = message;
  return false;
}

void Brewer::outputsOff() {
  pump_.set(false);
  heater_.set(false);
}

void Brewer::setState(State s) { state_ = s; }

void Brewer::fail(const char* code) {
  outputsOff();   // de-energise first, report second
  err_ = code;
  setState(State::ERROR);
}

float Brewer::pouredG() const {
  if (scale_.available()) return scale_.grams() - scaleZeroG_;
  return timedPouredG_;
}

// ---- commands ---------------------------------------------------------------
void Brewer::handle(JsonDocument& in, JsonDocument& out, unsigned long now) {
  lastCommandMs_ = now;   // any command feeds the link watchdog
  const char* cmd = in["cmd"] | "";
  out["ok"] = true;
  if (state_ == State::ESTOP && strcmp(cmd, "hello") && strcmp(cmd, "status") && strcmp(cmd, "ping")) {
    reject(out, "estop", "emergency stop engaged; restart the machine");
    return;
  }
  if (!strcmp(cmd, "hello")) {
    out["fw"] = FW_VERSION;
    out["board"] = BOARD_NAME;
    out["scale"] = (bool)scale_.available();
    out["mode"] = scale_.available() ? "scale" : "timed";
    JsonObject limits = out["limits"].to<JsonObject>();
    limits["temperature_c"] = MAX_TEMP_C;
    limits["water_g"] = MAX_WATER_G;
    limits["brew_s"] = MAX_BREW_S;
    limits["steps"] = MAX_STEPS;
  } else if (!strcmp(cmd, "ping") || !strcmp(cmd, "status")) {
    // status: the caller emits telemetry right after the ack
  } else if (!strcmp(cmd, "load_recipe")) {
    loadRecipe(in, out);
  } else if (!strcmp(cmd, "start")) {
    start(out, now);
  } else if (!strcmp(cmd, "pause")) {
    pause(out);
  } else if (!strcmp(cmd, "resume")) {
    resume(out, now);
  } else if (!strcmp(cmd, "abort")) {
    abort();
  } else if (!strcmp(cmd, "tare")) {
    tare(out);
  } else if (!strcmp(cmd, "set_temp")) {
    setTemp(in, out);
  } else if (!strcmp(cmd, "calibrate_scale")) {
    calibrate(in, out);
  } else {
    reject(out, "unknown_cmd");
  }
}

bool Brewer::loadRecipe(JsonDocument& in, JsonDocument& out) {
  if (state_ != State::IDLE && state_ != State::READY && state_ != State::DONE) return reject(out, "bad_state");
  if (!isNumber(in["dose"]) || !isNumber(in["water"]) || !isNumber(in["temperature"])) return reject(out, "bad_params");
  Recipe r;
  r.doseG = in["dose"].as<float>();
  r.waterG = in["water"].as<float>();
  r.temperatureC = in["temperature"].as<float>();
  if (r.doseG <= 0 || r.waterG <= 0) return reject(out, "bad_params");
  if (r.temperatureC > MAX_TEMP_C || r.temperatureC < MIN_TEMP_C) return reject(out, "limit_temperature", "temperature outside the machine limits");
  if (r.waterG > MAX_WATER_G) return reject(out, "limit_water", "water exceeds the machine limit");
  JsonArrayConst steps = in["steps"].as<JsonArrayConst>();
  if (steps.isNull() || steps.size() == 0 || steps.size() > MAX_STEPS) return reject(out, "limit_steps");
  float lastTarget = 0, lastStop = 0;
  for (JsonObjectConst s : steps) {
    if (!isNumber(s["target_g"]) || !isNumber(s["start_s"]) || !isNumber(s["stop_s"])) return reject(out, "bad_steps");
    Step step{s["target_g"].as<float>(), s["start_s"].as<float>(), s["stop_s"].as<float>()};
    if (step.targetG <= 0 || step.targetG < lastTarget || step.startS < lastStop || step.stopS < step.startS) return reject(out, "bad_steps");
    if (step.targetG > MAX_WATER_G) return reject(out, "limit_water", "pour target exceeds the machine limit");
    if (step.stopS > MAX_BREW_S) return reject(out, "limit_time", "pour ends after the machine time limit");
    r.steps[r.stepCount++] = step;
    lastTarget = step.targetG;
    lastStop = step.stopS;
  }
  r.durationS = isNumber(in["duration_s"]) ? in["duration_s"].as<float>() : lastStop;
  if (r.durationS < lastStop || r.durationS > MAX_BREW_S) return reject(out, "limit_time");
  recipe_ = r;
  hasRecipe_ = true;
  targetTempC_ = r.temperatureC;
  err_ = nullptr;
  step_ = -1;
  brewAccumMs_ = 0;
  timedPouredG_ = 0;
  readySinceMs_ = 0;
  setState(State::PREHEAT);   // heater is switched on by controlHeater() once the sensor is valid
  return true;
}

bool Brewer::start(JsonDocument& out, unsigned long now) {
  if (!hasRecipe_) return reject(out, "no_recipe");
  if (state_ == State::PREHEAT) return reject(out, "not_ready");
  if (state_ != State::READY) return reject(out, "bad_state");
  scaleZeroG_ = scale_.available() ? scale_.grams() : 0;   // the dripper is on the scale now
  timedPouredG_ = 0;
  brewAccumMs_ = 0;
  brewStartMs_ = now;
  step_ = -1;
  pumpLatchedOff_ = false;
  setState(State::BREWING);
  return true;
}

bool Brewer::pause(JsonDocument& out) {
  if (state_ != State::BREWING) return reject(out, "bad_state");
  brewAccumMs_ += millis() - brewStartMs_;
  pump_.set(false);
  setState(State::PAUSED);
  return true;
}

bool Brewer::resume(JsonDocument& out, unsigned long now) {
  if (state_ != State::PAUSED) return reject(out, "bad_state");
  brewStartMs_ = now;
  setState(State::BREWING);
  return true;
}

void Brewer::abort() {
  outputsOff();
  hasRecipe_ = false;
  err_ = nullptr;
  step_ = -1;
  brewAccumMs_ = 0;
  timedPouredG_ = 0;
  setState(State::IDLE);
}

bool Brewer::tare(JsonDocument& out) {
  if (state_ != State::IDLE && state_ != State::READY) return reject(out, "bad_state");
  if (!scale_.available()) return reject(out, "no_scale");
  scale_.tare();
  return true;
}

bool Brewer::setTemp(JsonDocument& in, JsonDocument& out) {
  if (state_ != State::IDLE && state_ != State::READY && state_ != State::PREHEAT) return reject(out, "bad_state");
  if (!isNumber(in["temperature"])) return reject(out, "bad_params");
  float value = in["temperature"].as<float>();
  if (value > MAX_TEMP_C || value < MIN_TEMP_C) return reject(out, "limit_temperature");
  targetTempC_ = value;
  if (state_ == State::READY) { readySinceMs_ = 0; setState(State::PREHEAT); }
  return true;
}

bool Brewer::calibrate(JsonDocument& in, JsonDocument& out) {
  if (state_ != State::IDLE) return reject(out, "bad_state");
  if (!scale_.available()) return reject(out, "no_scale");
  if (!isNumber(in["known_g"]) || in["known_g"].as<float>() <= 0) return reject(out, "bad_params");
  out["factor"] = scale_.calibrate(in["known_g"].as<float>());
  return true;
}

// ---- control loop ------------------------------------------------------------
void Brewer::tick(unsigned long now) {
  if (EStop::triggered || estop_.pressed()) {
    outputsOff();
    err_ = "estop";
    setState(State::ESTOP);
    return;
  }
  if (state_ == State::ESTOP || state_ == State::ERROR) { outputsOff(); return; }

  bool outputsMayBeOn = state_ == State::PREHEAT || state_ == State::READY || state_ == State::BREWING || state_ == State::PAUSED;
  if (outputsMayBeOn && now - lastCommandMs_ > WATCHDOG_MS) { fail("watchdog"); return; }

  controlHeater(now);
  if (state_ == State::ERROR) return;

  float temp = temp_.celsius();
  if (state_ == State::PREHEAT) {
    if (temp_.valid(now) && fabsf(temp - targetTempC_) <= READY_BAND_C) {
      if (readySinceMs_ == 0) readySinceMs_ = now;
      if (now - readySinceMs_ >= READY_HOLD_MS) setState(State::READY);
    } else {
      readySinceMs_ = 0;
    }
  } else if (state_ == State::READY) {
    if (temp_.valid(now) && temp < targetTempC_ - REHEAT_DROP_C) { readySinceMs_ = 0; setState(State::PREHEAT); }
  } else if (state_ == State::BREWING) {
    brew(now);
  }
}

// Hysteresis around the target; the heater never runs without a valid, fresh sensor reading.
void Brewer::controlHeater(unsigned long now) {
  bool wantHeat = hasRecipe_ && (state_ == State::PREHEAT || state_ == State::READY || state_ == State::BREWING || state_ == State::PAUSED);
  if (!wantHeat) { heater_.set(false); return; }
  if (!temp_.valid(now)) {
    if (heater_.isOn()) fail("no_temp_sensor");
    else heater_.set(false);
    return;
  }
  float temp = temp_.celsius();
  if (temp > MAX_TEMP_C + OVERHEAT_MARGIN_C) { fail("overheat"); return; }
  if (heater_.isOn() && temp >= targetTempC_) heater_.set(false);
  else if (!heater_.isOn() && temp < targetTempC_ - TEMP_HYSTERESIS_C) heater_.set(true);
}

void Brewer::brew(unsigned long now) {
  float t = (brewAccumMs_ + (now - brewStartMs_)) / 1000.0f;
  float poured = pouredG();
  int active = -1;
  for (int i = 0; i < recipe_.stepCount; i++) {
    const Step& s = recipe_.steps[i];
    if (t >= s.startS && poured < s.targetG - 0.5f) { active = i; break; }
  }
  if (active != step_) { step_ = active; pumpLatchedOff_ = false; }
  bool wantPump = false;
  if (active >= 0) {
    const Step& s = recipe_.steps[active];
    if (poured >= s.targetG - DRIP_G) pumpLatchedOff_ = true;
    if (!scale_.available()) {
      // Timed mode: run the pump for the calibrated time, never longer than that × margin.
      float need = (s.targetG - (active > 0 ? recipe_.steps[active - 1].targetG : 0)) / FLOW_G_PER_S * 1000.0f;
      if (pump_.isOn() && now - pumpOnMs_ > need * TIMED_MARGIN) pumpLatchedOff_ = true;
    }
    wantPump = !pumpLatchedOff_;
  }
  if (wantPump && !pump_.isOn()) {
    pumpOnMs_ = now;
    dryRunSinceMs_ = now;
    dryRunWeightG_ = poured;
  }
  pump_.set(wantPump);
  if (pump_.isOn()) {
    if (scale_.available()) {
      if (poured - dryRunWeightG_ >= DRY_RUN_MIN_G) { dryRunSinceMs_ = now; dryRunWeightG_ = poured; }
      else if (now - dryRunSinceMs_ >= DRY_RUN_MS) { fail("dry_run"); return; }
    } else {
      timedPouredG_ += FLOW_G_PER_S * 0.001f * (now - pumpOnMs_);
      pumpOnMs_ = now;
    }
  }
  bool finished = poured >= recipe_.steps[recipe_.stepCount - 1].targetG - 0.5f && t >= recipe_.durationS;
  if (finished) {
    outputsOff();
    step_ = -1;
    setState(State::DONE);
  }
}

void Brewer::telemetry(JsonDocument& out, unsigned long now) const {
  out["ev"] = "state";
  out["state"] = stateName(state_);
  float t = 0;
  if (state_ == State::BREWING) t = (brewAccumMs_ + (now - brewStartMs_)) / 1000.0f;
  else if (state_ == State::PAUSED || state_ == State::DONE) t = brewAccumMs_ / 1000.0f;
  out["t"] = roundf(t * 100) / 100;
  out["step"] = step_;
  out["poured_g"] = hasRecipe_ && (state_ == State::BREWING || state_ == State::PAUSED || state_ == State::DONE) ? roundf(pouredG() * 10) / 10 : 0;
  float target = 0;
  if (hasRecipe_) {
    if (step_ >= 0) target = recipe_.steps[step_].targetG;
    else {
      float poured = pouredG();
      for (int i = 0; i < recipe_.stepCount; i++) if (poured < recipe_.steps[i].targetG - 0.5f) { target = recipe_.steps[i].targetG; break; }
    }
  }
  out["target_g"] = target;
  if (temp_.valid(now)) out["temp_c"] = roundf(temp_.celsius() * 10) / 10; else out["temp_c"] = nullptr;
  if (hasRecipe_) out["target_temp_c"] = targetTempC_;
  out["heater"] = heater_.isOn() ? 1 : 0;
  out["pump"] = pump_.isOn() ? 1 : 0;
  if (err_) out["err"] = err_; else out["err"] = nullptr;
  out["mode"] = scale_.available() ? "scale" : "timed";
}
