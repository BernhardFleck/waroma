#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <TFT_eSPI.h>
#include <SPI.h>
#include <uri/UriBraces.h>
#include <EasyButton.h>
#include "esp_adc_cal.h"
#include "adc.h"
#include "secrets.h"

#define TP_PIN_PIN          33
#define TP_PWR_PIN          25

EasyButton button(TP_PIN_PIN, 80, true, false);
TFT_eSPI screen = TFT_eSPI();
WebServer server(80);
StaticJsonDocument<250> jsonDocument;
char buffer[250];
float temperature;
String response = "";
DynamicJsonDocument doc(2048);
String ip;
const String waroma_server = "192.168.0.185:3000";
int screenWidth = screen.width();
int screenHeight = screen.height();

void loop() {
  server.handleClient();
  button.read();
  //delay(2000);
}

void setup() {
  Serial.begin(115200);
  Serial.println("Connecting to Wi-Fi");
  connectToWiFi();
  Serial.println("Connected! IP Address: " + ip);
  connectToServer();
  Serial.println((String)"Connected to " + waroma_server);
  setupEndpoints();
  screen.begin();
  screen.setRotation(2);
  turnOffDisplay();
  //TODO reset screen or show welcome screen
  setupADC();
  initButton();
}

void connectToWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println();
  ip = getIpAsStringOf(WiFi.localIP());
}

String getIpAsStringOf(const IPAddress& ipAddress) {
  return (String)ipAddress[0] + "." + (String)ipAddress[1] + "." + (String)ipAddress[2] + "." + (String)ipAddress[3];
}

void connectToServer() {
  HTTPClient httpClient;
  String request = "http://" + waroma_server + "/connect/" + ip;
  httpClient.begin(request);
  httpClient.GET();
  httpClient.end();
}

void setupEndpoints() {
  server.on("/battery", getBatteryLevel);
  server.on("/flashDisplay", flashDisplay);
  server.on(UriBraces("/displayRoom/{}"), []() {
    String number = server.pathArg(0);
    displayRoom(number);
  });
  server.begin();
}

void flashDisplay() {
  turnOnDisplay();
  for (int i = 0; i < 2; i++) {
    screen.fillScreen(TFT_BLACK);
    delay(800);
    screen.fillScreen(TFT_GREEN);
    delay(800);
  }
  screen.fillScreen(TFT_BLACK);
  turnOffDisplay();
  server.send(200);
}

void displayRoom(String alphanumericLetter) {
  turnOnDisplay();
  screen.setCursor(0, 0);
  screen.fillScreen(TFT_BLACK);
  screen.setTextColor(TFT_WHITE, TFT_BLACK);
  screen.setTextDatum(MC_DATUM);
  screen.setTextSize(3);
  screen.print("Raum");
  screen.println();
  screen.setTextSize(7); //max is 7, go into library for changing that
  screen.drawString((String)alphanumericLetter.charAt(0), screenWidth / 2, screenHeight / 2);
  delay(10 * 1000); //TODO remove this timer
  turnOffDisplay();
  server.send(200);
}

void turnOnDisplay() {
  digitalWrite(TFT_BL , HIGH); //backlight on
  screen.writecommand(ST7735_DISPON);  // display on
  delay(150);
  screen.writecommand(ST7735_SLPOUT);  // display sleep off
  delay(150);
}

void turnOffDisplay() {
  screen.writecommand(ST7735_SLPIN);  // display sleep on
  delay(150);
  screen.writecommand(ST7735_DISPOFF);  // display off
  delay(200);
  digitalWrite( TFT_BL , LOW);  //backlight off
}

void getBatteryLevel() {
  char battArr[8];
  String batteryLevel = getBattPerc();
  if (batteryLevel.length() > 2)
    batteryLevel = "100";
  batteryLevel.toCharArray(battArr, 6);
  create_json("batteryLevel", battArr);
  server.send(200, "application/json", buffer);
}

void create_json(char *key, char *value) {
  jsonDocument.clear();
  jsonDocument[key] = value;
  serializeJson(jsonDocument, buffer);
}

void initButton()
{
  pinMode(TP_PWR_PIN, PULLUP);
  digitalWrite(TP_PWR_PIN, HIGH);
  button.begin();
  button.onPressed(onPressed);
  //button.onPressedFor(1500, onPressed);
}

void onPressed() {
  Serial.println("Button has been pressed!");
}
/*
  // for sending json data
  //server.on("/led", HTTP_POST, handlePost);

  void getData() {
  Serial.println("Get BME280 Sensor Data");
  jsonDocument.clear();
  add_json_object("temperature", temperature, "°C");
  serializeJson(jsonDocument, buffer);
  server.send(200, "application/json", buffer);
  }

  void add_json_object(char *tag, float value, char *unit) {
  JsonObject obj = jsonDocument.createNestedObject();
  obj["type"] = tag;
  obj["value"] = value;
  obj["unit"] = unit;
  }

  void handlePost() {
  if (server.hasArg("plain") == false) {
  }
  String body = server.arg("plain");
  deserializeJson(jsonDocument, body);

  int red_value = jsonDocument["red"];
  int green_value = jsonDocument["green"];
  int blue_value = jsonDocument["blue"];

  server.send(200, "application/json", "{}");
  }


  //for sending json data to server
  //server.on("/temperature", getTemperature);

  void getTemperature() {
  Serial.println("Get temperature");
  create_json("temperature", 15, "°C");
  server.send(200, "application/json", buffer);
  }

  void create_json(char *tag, float value, char *unit) {
  jsonDocument.clear();
  jsonDocument["type"] = tag;
  jsonDocument["value"] = value;
  jsonDocument["unit"] = unit;
  serializeJson(jsonDocument, buffer);
  }


  // for requesting json data from server
  HTTPClient http;
  String request = "http://" + waroma_server + "/connect/" + ip;
  delay(1000);
  http.begin(request);
  http.GET();

    // The rest is for retrieving data
    //Response from server
    response = http.getString();
    //Parse JSON, read error if any
    DeserializationError error = deserializeJson(doc, response);
    if(error) {
     Serial.print(F("deserializeJson() failed: "));
     Serial.println(error.f_str());
     return;
    }
    //Print parsed value on Serial Monitor
    Serial.println(doc["value"].as<char*>());

  //Close connection
  http.end();
*/