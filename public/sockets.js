$(document).ready(function () {
    var socket = io();

    socket.emit("GetAllDevices")
    console.log("Requested all devices")

    socket.on('AddIpAddress', function (ipAddress) {
        let newListNode = document.createElement('li');
        newListNode.textContent = ipAddress;
        $('#deviceList').append(newListNode)
    });

});