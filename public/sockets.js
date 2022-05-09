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
        let newPatientEntry = $(`
            <li class="list-group-item list-group-item-action" style="cursor: pointer;">
                <span title="${ipAddress}" onclick="preSelectFormBy('${ipAddress}')" type="button"
                  id="${firstName + lastName + birthday}" class="">${firstName} ${lastName} ${birthday}</span>
                <div class="progress">
                  <div id="BatteryOf${ipAddress}" class="progress-bar progress-bar-striped progress-bar-animated waromaColor" role="progressbar"
                    aria-valuenow="10" aria-valuemin="0" aria-valuemax="100" style="width: 10%">10%</div>
                </div>
            </li>
        `)
        $('#connectedPatients').append(newPatientEntry);
        $('#patientsDropdown').append($('<option>', {
            value: ipAddress,
            text: `${firstName} ${lastName} ${birthday}`
        }));
    });

    socket.on('batteryValue', function (ipAddress, batteryValue) {
        let idText = `BatteryOf${ipAddress}`
        let batteryProgressBar = $('div[id="' + idText + '"]')
        batteryProgressBar.attr('aria-valuenow', `${batteryValue}`)
        batteryProgressBar.attr('style', `width: ${batteryValue}%`)
        batteryProgressBar.text(`${batteryValue}%`)
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

