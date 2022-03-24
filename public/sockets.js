$(document).ready(function () {
    var socket = io();

    socket.emit("GetAllDevices")
    console.log("Requested all devices")

    socket.on('DeviceConnection', function (ipAddress) {
        let newListNode = document.createElement('li');
        newListNode.textContent = ipAddress;
        $('#deviceList').append(newListNode)
    });

});