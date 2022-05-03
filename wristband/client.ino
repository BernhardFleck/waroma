#include "secrets.h"
#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>

WebServer server(80);
StaticJsonDocument<250> jsonDocument;
char buffer[250];
float temperature;
String response = "";
DynamicJsonDocument doc(2048);
String ip; 
const String waroma_server = "192.168.0.185:3000";

void loop() {    
  server.handleClient();     
}

void setup() {     
  Serial.begin(115200); 
  Serial.println("Connecting to Wi-Fi");
  connectToWiFi();
  Serial.println("Connected! IP Address: " + ip);
  connectToServer();
  Serial.println((String)"Connected to " + waroma_server);
  setup_routing();     
}    

void connectToWiFi(){
  //WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
   ip = getIpAsStringOf(WiFi.localIP());
}

String getIpAsStringOf(const IPAddress& ipAddress) {
  return (String)ipAddress[0] + "." + (String)ipAddress[1] + "." + (String)ipAddress[2] + "." + (String)ipAddress[3];
}

void connectToServer(){
  HTTPClient http;
  String request = "http://"+waroma_server+"/connect/"+ip; 
  delay(1000);
  http.begin(request);
  http.GET();
  /*
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
  */
  //Close connection  
  http.end();
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