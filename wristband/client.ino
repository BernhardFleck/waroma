#include "secrets.h"
#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>


WebServer server(80);
StaticJsonDocument<250> jsonDocument;
char buffer[250];
float temperature;
 
void loop() {    
  server.handleClient();     
}

void setup() {     
  Serial.begin(115200); 

  Serial.print("Connecting to Wi-Fi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
 
  Serial.print("Connected! IP Address: ");
  Serial.println(WiFi.localIP());
  setup_routing();     
}    
       

void setup_routing() {     
  server.on("/temperature", getTemperature);     
  //server.on("/led", HTTP_POST, handlePost);    
  server.begin();    
}

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

/*
void add_json_object(char *tag, float value, char *unit) {
  JsonObject obj = jsonDocument.createNestedObject();
  obj["type"] = tag;
  obj["value"] = value;
  obj["unit"] = unit; 
}

void getData() {
  Serial.println("Get BME280 Sensor Data");
  jsonDocument.clear();
  add_json_object("temperature", temperature, "°C");
  serializeJson(jsonDocument, buffer);
  server.send(200, "application/json", buffer);
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

*/
