$(document).ready(function () {
    var socket = io();

    socket.on('DeviceConnection', function (ipAddress) {
        let newListNode = document.createElement('li');
        newListNode.textContent = ipAddress;
        $('#deviceList').append(newListNode)
    });

});