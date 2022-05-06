/**
 * Notes: 
 * Always beautify your code before committing (On Windows: Shift + Alt + F)
 * Never push unworking code
 * Try to use readable names
 */

const express = require('express');
const app = express();
const PORT = 3000;
const fetch = require('node-fetch');
let http = require('http').Server(app);
let io = require('socket.io')(http);
let connectedDevices = []
let connectedPatients = []

app.use(express.static('public'));
http.listen(PORT, () => console.log(`server listening on port ${PORT}!`));
io.on('connection', async (socket) => {
    let socketId = socket.id
    console.log(`Client connected: ${socketId}`)

    socket.on('GetAllDevices', function () {
        console.log(`Print all devices onto the UI of client ${socketId}`)
        connectedDevices.forEach(ipAddress =>
            io.to(socket.id).emit("AddIpAddress", ipAddress))
    });

    socket.on('flashWristband', function (ipAddress) {
        flashDisplayOfWristbandBy(ipAddress)
    });

    socket.on('assignPatientToWristband', function (firstName, lastName, birthday, ipAddress) {
        connectedPatients.push({ firstName, lastName, birthday, ipAddress })
        io.emit("AddPatientConnection", firstName, lastName, birthday, ipAddress)
        console.log(`Add a new row in patients table: ${firstName} ${lastName} ${birthday} ${ipAddress} `)
    });
});

app.get("/connect/:ip", (request, response) => {
    let ipAddress = request.params.ip
    let databaseDoesNotContainIp = !connectedDevices.includes(ipAddress)

    if (databaseDoesNotContainIp) {
        updateDatabaseByInserting(ipAddress)
        updateClientsAboutConnectionOf(ipAddress)
        flashDisplayOfWristbandBy(ipAddress)
        console.log("wristband connected")
    }

    response.end()
})

function updateDatabaseByInserting(ipAddress) {
    connectedDevices.push(ipAddress)
}

function updateClientsAboutConnectionOf(ipAddress) {
    io.emit("AddIpAddress", ipAddress)
    console.log(`Wristband with IP Address ${ipAddress} trys to connect`)
}

async function flashDisplayOfWristbandBy(ipAddress) {
    console.log("flash wristband" + ipAddress)
    /*
    const request = `http://${ipAddress}/flashDisplay`
    const response = await fetch(request)
    if (!response.ok)
        console.log('Error with request: ' + response.statusText);
    */

    //io.emit
    /* 
    //for reading data
    const data = await response.json();
    const jsonResult = JSON.stringify(data)
    console.log(jsonResult)
    */
}

app.get("/sendPatientToRoom", (request, response) => {
    let patientsIP = request.query.patientsDropdown
    let room = request.query.roomNumberField

    if (patientsIP && room && room != " ")
        sendPatientToRoom(patientsIP, room)

    response.end()
})

async function sendPatientToRoom(ipAddress, room) {
    console.log("request" + ipAddress + room)
    /*
    const singleLetter = room.charAt(0)
    const request = `http://${ipAddress}/displayRoom/${singleLetter}`
    const response = await fetch(request);
    if (!response.ok)
        console.log('Error with request: ' + response.statusText)
    */
}


