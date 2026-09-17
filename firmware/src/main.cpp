// First Brew machine firmware. JSON lines over USB serial, see docs/PROTOCOL.md.
// loop() never blocks: serial is read byte by byte, sensors are polled, the state machine ticks on millis().
#include <Arduino.h>
#include <ArduinoJson.h>
#include "config.h"
#include "hardware.h"
#include "state_machine.h"

static Output pump(PIN_PUMP);
static Output heater(PIN_HEATER);
static Scale scale;
static TempSensor temperature;
static EStop estop;
static Brewer brewer(pump, heater, scale, temperature, estop);

static char line[LINE_MAX];
static size_t lineLength = 0;
static bool lineOverflow = false;
static unsigned long lastTelemetry = 0;

static void sendJson(JsonDocument& doc) {
  serializeJson(doc, Serial);
  Serial.print('\n');
}

static void sendTelemetry(unsigned long now) {
  JsonDocument doc;
  brewer.telemetry(doc, now);
  sendJson(doc);
}

static void handleLine(const char* text, unsigned long now) {
  JsonDocument in;
  JsonDocument out;
  DeserializationError error = deserializeJson(in, text);
  if (error || !in.is<JsonObject>() || !in["cmd"].is<const char*>()) {
    out["ack"] = nullptr;
    out["ok"] = false;
    out["error"] = "invalid_json";
    sendJson(out);
    return;
  }
  out["ack"] = in["id"];
  brewer.handle(in, out, now);
  sendJson(out);
  if (!strcmp(in["cmd"] | "", "status")) sendTelemetry(now);
}

void setup() {
  pump.begin();
  heater.begin();
  Serial.begin(115200);
  scale.begin();
  temperature.begin();
  estop.begin(&pump, &heater);
  brewer.begin(millis());
  JsonDocument hello;
  hello["ev"] = "hello";
  hello["fw"] = FW_VERSION;
  hello["board"] = BOARD_NAME;
  hello["scale"] = (bool)HAS_SCALE;
  hello["mode"] = HAS_SCALE ? "scale" : "timed";
  sendJson(hello);
}

void loop() {
  unsigned long now = millis();
  while (Serial.available()) {
    char c = (char)Serial.read();
    if (c == '\n' || c == '\r') {
      if (lineLength && !lineOverflow) {
        line[lineLength] = '\0';
        handleLine(line, now);
      } else if (lineOverflow) {
        JsonDocument out;
        out["ack"] = nullptr;
        out["ok"] = false;
        out["error"] = "invalid_json";
        out["message"] = "line too long";
        sendJson(out);
      }
      lineLength = 0;
      lineOverflow = false;
    } else if (lineLength < LINE_MAX - 1) {
      line[lineLength++] = c;
    } else {
      lineOverflow = true;
    }
  }
  scale.update();
  temperature.update();
  brewer.tick(now);
  if (now - lastTelemetry >= TELEMETRY_MS) {
    lastTelemetry = now;
    sendTelemetry(now);
  }
}
