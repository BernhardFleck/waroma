$(document).ready(function () {
    var socket = io();

    socket.emit("GetAllDevices")

    socket.on('AddIpAddress', function (ipAddress) {
        $('#deviceList').append($('<option>', {
            value: ipAddress,
            text: ipAddress
        }));
    });

    socket.on('AddPatientConnection', function (firstName, lastName, birthday, ipAddress) {
        $('#connectedPatients').append($('<li>', {
            text: `(${ipAddress}) ${firstName} ${lastName} ${birthday}`,
            class: "list-group-item"
        }));

        $('#patientsDropdown').append($('<option>', {
            value: ipAddress,
            text: `(${ipAddress}) ${firstName} ${lastName} ${birthday}`
        }));
    });

});

function flashWristband() {
    let selectedIP = $("#deviceList").val()
    if (selectedIP) {
        let socket = io();
        socket.emit("flashWristband", selectedIP)
    }
}

function assignPatientToWristband() {
    let firstName = $('#firstNameField').val()
    let lastName = $('#lastNameField').val()
    let birthday = $('#birthdayField').val()
    let ipAddress = $("#deviceList").val()

    if (firstName && lastName && birthday && ipAddress) {
        let socket = io();
        socket.emit("assignPatientToWristband", firstName, lastName, birthday, ipAddress)
    }
}

