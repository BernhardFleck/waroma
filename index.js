const express = require('express');
const { Socket } = require('socket.io');
const app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const PORT = 3000;

http.listen(PORT, () => console.log(`server listening on port ${PORT}!`));
app.use(express.static('public'));
app.get("/test", (request, response) => response.send("Hello World"))
app.get("/connect/:ip", (request, response) => {
    let ipAddress = request.params.ip
    connectWristbandBy(ipAddress)
})

function connectWristbandBy(ipAddress){
    io.emit("DeviceConnection", ipAddress)
    console.log(`Wristband with IP Address ${ipAddress} trys to connect`)
}
