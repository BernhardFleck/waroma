/**
 * Notes: 
 * Always beautify your code before committing (On Windows: Shift + Alt + F)
 * Never push unworking code
 * Try to use readable names
 */

const express = require('express');
const app = express();
const PORT = 3000;
const BATTERY_TIME_INTERVAL = 5000;
const CONNECTION_CHECK_TIME_INTERVAL = 1000 * 60; // 1min
const fetch = require('node-fetch');
let http = require('http').Server(app);
let io = require('socket.io')(http);
let availableDevices = [] // format: ipAddresses only
let connectedPatients = [] // format: { firstName, lastName, birthday, ipAddress }
let allIntervals = [] // format {ipAddress, intervalId}

app.use(express.static('public'));
http.listen(PORT, () => console.log(`server listening on port ${PORT}!`));
io.on('connection', async (socket) => {
    let socketId = socket.id
    console.log(`Client connected: ${socketId}`)

    socket.on('GetAllDevices', function () {
        console.log(`Print all devices onto the UI of client ${socketId}`)
        availableDevices.forEach(ipAddress =>
            io.to(socket.id).emit("AddIpAddress", ipAddress))
    });

    socket.on('GetAllConnectedPatients', function () {
        console.log(`Print all patients onto the UI of client ${socketId}`)
        connectedPatients.forEach(row =>
            io.to(socket.id).emit("AddPatientConnection", row.firstName, row.lastName, row.birthday, row.ipAddress))
    });

    socket.on('flashWristband', function (ipAddress) {
        flashDisplayOfWristbandBy(ipAddress)
    });

    socket.on('assignPatientToWristband', function (firstName, lastName, birthday, ipAddress) {
        connectedPatients.push({ firstName, lastName, birthday, ipAddress })
        io.emit("AddPatientConnection", firstName, lastName, birthday, ipAddress)
        console.log(`Add a new row in patients table: ${firstName} ${lastName} ${birthday} ${ipAddress} `)
        reduceAvailableDevicesBy(ipAddress)
        io.emit("RemovePatientIpFromDeviceList", ipAddress)
    });

    socket.on('PreSelectReturnForm', function (ipAddress) {
        console.log(`Get data of ${ipAddress} onto the UI of client ${socketId}`)
        let patient = connectedPatients.filter(patient => patient.ipAddress == ipAddress)[0]
        io.to(socket.id).emit("PreSelectReturnForm", patient.ipAddress, patient.firstName, patient.lastName, patient.birthday)
    });

});

function reduceAvailableDevicesBy(ipAddress) {
    console.log(availableDevices)
    let ipIndex = availableDevices.indexOf(ipAddress)
    availableDevices.splice(ipIndex, 1)
    console.log(availableDevices)
}

app.get("/connect/:ip", (request, response) => {
    let ipAddress = request.params.ip
    let databaseDoesNotContainIp = !availableDevices.includes(ipAddress)

    if (databaseDoesNotContainIp) {
        availableDevices.push(ipAddress)
        const ipIsConnected = connectedPatients.filter(patient => patient.ipAddress == ipAddress).length > 0
        if (ipIsConnected)
            io.emit("Reconnect", ipAddress)
        else {
            io.emit("AddIpAddress", ipAddress)
            let intervalId = setInterval(() => readBatteryLevelFrom(ipAddress), BATTERY_TIME_INTERVAL);
            allIntervals.push({ ipAddress, intervalId })
            intervalId = setInterval(() => checkConnectionOf(ipAddress), CONNECTION_CHECK_TIME_INTERVAL);
            allIntervals.push({ ipAddress, intervalId })
            flashDisplayOfWristbandBy(ipAddress)
        }
    }
    response.end()
})

async function flashDisplayOfWristbandBy(ipAddress) {
    try {
        console.log("flash wristband" + ipAddress)
        const request = `http://${ipAddress}/flashDisplay`
        const response = await fetch(request)
        if (!response.ok)
            console.log('Error with request: ' + response.statusText);
        //io.emit error?
    } catch (error) { }
}

app.get("/sendPatientToRoom", (request, response) => {
    let patientsIP = request.query.patientsDropdown
    let room = request.query.roomNumberField

    if (patientsIP && room && room != " ")
        sendPatientToRoom(patientsIP, room)

    response.end()
})

async function sendPatientToRoom(ipAddress, room) {
    try {
        console.log("request" + ipAddress + room)
        const singleLetter = room.charAt(0)
        const request = `http://${ipAddress}/displayRoom/${singleLetter}`
        const response = await fetch(request);
        if (!response.ok)
            console.log('Error with request: ' + response.statusText)
    } catch (error) { }
}

async function readBatteryLevelFrom(ipAddress) {
    try {
        const request = `http://${ipAddress}/battery`
        const response = await fetch(request)
        if (!response.ok)
            console.log('Error with request: ' + response.statusText)
        //io.emit error ?
        const data = await response.json()
        const stringifiedJson = JSON.stringify(data)
        const parsedJson = JSON.parse(stringifiedJson)
        const batteryValue = parsedJson.batteryLevel.replace('%', '')

        io.emit("batteryValue", ipAddress, batteryValue)
    } catch (error) { }
}

async function checkConnectionOf(ipAddress) {
    try {
        console.log(`Check connection to ${ipAddress}`)
        const request = `http://${ipAddress}/connectionCheck`
        const response = await fetch(request)
        if (!response.ok)
            io.emit("ConnectionLost", ipAddress)
        else
            io.emit("Reconnect", ipAddress)
    } catch (error) {
        io.emit("ConnectionLost", ipAddress)
    }
}

app.get("/absence/:ip", (request, response) => {
    let ipAddress = request.params.ip
    console.log("toggle absence icon for " + ipAddress)
    const ipIsConnected = connectedPatients.filter(patient => patient.ipAddress == ipAddress).length > 0

    if (ipIsConnected)
        io.emit("toggleAbsenceIconOnServer", ipAddress)
    response.end()
})

app.get("/returnWristband", (request, response) => {
    let ipAddress = request.query.returnIpAddress
    reduceConnectedPatientsBy(ipAddress)
    endTimeIntervallsOf(ipAddress)
    io.emit("WristbandReturned", ipAddress)
    response.end()
})

function reduceConnectedPatientsBy(ipAddress) {
    let patientIndex = connectedPatients.findIndex(patient => patient.ipAddress == ipAddress)
    connectedPatients.splice(patientIndex, 1)
}

function endTimeIntervallsOf(ipAddress) {
    let patientIntervals = allIntervals.filter(interval => interval.ipAddress == ipAddress)
    patientIntervals.forEach(row => {
        clearInterval(row.intervalId)
        reduceIntervalsBy(row.intervalId)
    })
}

function reduceIntervalsBy(intervalId) {
    let intervalIndex = allIntervals.findIndex(row => row.intervalId == intervalId)
    allIntervals.splice(intervalIndex, 1)
}