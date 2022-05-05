$(document).ready(function () {
    var socket = io();

    socket.emit("GetAllDevices")
    console.log("Requested all devices")

    socket.on('AddIpAddress', function (ipAddress) {
        $('#deviceList').append($('<li>', {
            text: ipAddress
        }));

        $('#patientsDropdown').append($('<option>', {
            value: ipAddress,
            text: ipAddress
        }));
    });
});

