$(document).ready(function () {
    var socket = io();
    
    socket.emit("GetAllDevices")
    socket.emit("GetAllConnectedPatients")

    socket.on('AddIpAddress', function (ipAddress) {
        $('#deviceList').append($('<option>', {
            value: ipAddress,
            text: ipAddress
        }));
    });

    socket.on('AddPatientConnection', function (firstName, lastName, birthday, ipAddress) {

        let newPatientEntry = $(`<button title="${ipAddress}"
        onclick="preSelectFormBy('${ipAddress}')" 
        type="button" id="${firstName + lastName + birthday}" 
        class="list-group-item list-group-item-action">${firstName} ${lastName} ${birthday}</button>`)

        $('#connectedPatients').append(newPatientEntry);
        $('#patientsDropdown').append($('<option>', {
            value: ipAddress,
            text: `${firstName} ${lastName} ${birthday}`
        }));
    });

});

function preSelectFormBy(ipAddress) {
    $('#patientsDropdown option[value="' + ipAddress + '"]').prop('selected', true)
}

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

