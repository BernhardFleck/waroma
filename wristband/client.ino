#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <TFT_eSPI.h>
#include <SPI.h>
#include <uri/UriBraces.h>
#include <EasyButton.h>
#include <ArduinoOTA.h>
#include "esp_adc_cal.h"
#include "adc.h"
#include "secrets.h"
#include "waroma_logo.h"

#define TP_PIN_PIN          33
#define TP_PWR_PIN          25

EasyButton button(TP_PIN_PIN, 80, true, false);
TFT_eSPI screen = TFT_eSPI();
WebServer server(80);
StaticJsonDocument<250> jsonDocument;
char buffer[250];
String response = "";
DynamicJsonDocument doc(2048);
String ip;
const String waroma_server = "192.168.0.185:3000";
int screenWidth = screen.width();
int screenHeight = screen.height();
boolean isAbsent = false;
int buttonClickCounter = 0;

void loop() {
  server.handleClient();
  button.read();
  ArduinoOTA.handle();
  //delay(2000);
}

void setup() {
  Serial.begin(115200);
  Serial.println("Connecting to Wi-Fi");
  connectToWiFi();
  Serial.println("Connected! IP Address: " + ip);
  setupOTA();
  connectToServer();
  Serial.println((String)"Connected to " + waroma_server);
  setupEndpoints();
  screen.begin();
  turnOffDisplay();
  setupADC();
  initButton();
  Serial.println("Show Logo");
  showWaromaLogoForSeconds(3);
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
  String connectionEndpoint = "http://" + waroma_server + "/connect/" + ip;
  doGETRequestTo(connectionEndpoint);
}

void doGETRequestTo(String endpoint) {
  HTTPClient httpClient;
  httpClient.begin(endpoint);
  httpClient.GET();
  httpClient.end();
}

void setupEndpoints() {
  server.on("/connectionCheck", send200OK);
  server.on("/battery", getBatteryLevel);
  server.on("/flashDisplay", flashDisplay);
  server.on(UriBraces("/displayRoom/{}"), []() {
    String number = server.pathArg(0);
    displayRoom(number);
  });
  server.begin();
}

void send200OK() {
  server.send(200);
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
  screen.setRotation(0);
  screen.setCursor(0, 0);
  screen.fillScreen(TFT_BLACK);
  screen.setTextColor(TFT_WHITE, TFT_BLACK);
  screen.setTextDatum(MC_DATUM);
  screen.setTextSize(3);
  screen.print("Raum");
  screen.println();
  screen.setTextSize(7); //max is 7, go into library for changing that
  screen.drawString((String)alphanumericLetter.charAt(0), screenWidth / 2, screenHeight / 2);
  turnOnDisplay();
  delay(10 * 1000); //TODO remove this timer!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
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
  if (batteryLevel.length() > 3 && !batteryLevel.startsWith("-"))
    batteryLevel = "100";
  if (batteryLevel.startsWith("-"))
    batteryLevel = "0";
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
  button.onPressed(displayMenu);
  button.onPressedFor(5000, toggleAbsenceIconOnServer);
}

void displayMenu() {
  if (buttonClickCounter == 0)
    showWaromaLogoForSeconds(10);

  if (buttonClickCounter == 1)
    if (isAbsent) display("You are absent", 1);
    else display("You are Present", 1);

  if (buttonClickCounter == 2) {
    display("Press 5 seconds ...", 3);
    display("... for being absent", 3);
  }

  buttonClickCounter++;
  if (buttonClickCounter > 2) buttonClickCounter = 0;
}


void showWaromaLogoForSeconds(int sec) {
  screen.init();
  screen.fillScreen(TFT_BLACK);
  screen.setRotation(1);
  screen.setSwapBytes(true);
  screen.pushImage(0, 20,  160, 40, waroma_logo);
  turnOnDisplay();
  delay(1000 * sec);
  turnOffDisplay();
}

void display(String message, int sec) {
  screen.setRotation(1);
  screen.setCursor(0, 0);
  screen.fillScreen(TFT_BLACK);
  screen.setTextColor(TFT_WHITE, TFT_BLACK);
  screen.setTextDatum(MC_DATUM);
  screen.setTextSize(3);
  screen.print(message);
  turnOnDisplay();
  delay(sec * 1000);
  turnOffDisplay();
  server.send(200);
}

void toggleAbsenceIconOnServer() {
  Serial.println("Show absence notification on server");
  String notificationEndpoint = "http://" + waroma_server + "/absence/" + ip;
  doGETRequestTo(notificationEndpoint);
  isAbsent = !isAbsent;
  if (isAbsent) display("Absent", 1);
  else display("Present", 1);
}

void setupOTA() {
  ArduinoOTA.setHostname("Band1");
  ArduinoOTA
  .onStart([]() {
    String type;
    if (ArduinoOTA.getCommand() == U_FLASH)
      type = "sketch";
    else // U_SPIFFS
      type = "filesystem";

    // NOTE: if updating SPIFFS this would be the place to unmount SPIFFS using SPIFFS.end()
    Serial.println("Start updating " + type);
  })
  .onEnd([]() {
    Serial.println("\nEnd");
  })
  .onProgress([](unsigned int progress, unsigned int total) {
    Serial.printf("Progress: %u%%\r", (progress / (total / 100)));
  })
  .onError([](ota_error_t error) {
    Serial.printf("Error[%u]: ", error);
    if (error == OTA_AUTH_ERROR) Serial.println("Auth Failed");
    else if (error == OTA_BEGIN_ERROR) Serial.println("Begin Failed");
    else if (error == OTA_CONNECT_ERROR) Serial.println("Connect Failed");
    else if (error == OTA_RECEIVE_ERROR) Serial.println("Receive Failed");
    else if (error == OTA_END_ERROR) Serial.println("End Failed");
  });

  ArduinoOTA.begin();
}