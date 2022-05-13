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

    socket.on('RemovePatientIpFromDeviceList', function (ipAddress) {
        $('#deviceList option[value="' + ipAddress + '"]').remove()
    });

    socket.on('AddPatientConnection', function (firstName, lastName, birthday, ipAddress) {
        let newPatientEntry = $(`
            <button id="PatientRow${ipAddress}" onclick="preSelectFormBy('${ipAddress}')" type="button" class="list-group-item list-group-item-action" style="cursor: pointer;">
                <span title="${ipAddress}" 
                  id="${firstName + lastName + birthday}" class="">${firstName} ${lastName} ${birthday}</span>
                <i id="AbsenceIconOf${ipAddress}" class="bi bi-hourglass-split d-none"></i>
                <div class="progress">
                  <div id="BatteryOf${ipAddress}" class="progress-bar progress-bar-striped progress-bar-animated waromaColor" role="progressbar"
                    aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%">Battery Level is loading ...</div>
                </div>
            </button>
        `)
        $('#connectedPatients').append(newPatientEntry);
        $('#patientsDropdown').append($('<option>', {
            value: ipAddress,
            text: `${firstName} ${lastName} ${birthday}`
        }));
    });

    socket.on('toggleAbsenceIconOnServer', function (ipAddress) {
        const absenceIcon = document.getElementById(`AbsenceIconOf${ipAddress}`)
        const patientRow = document.getElementById(`PatientRow${ipAddress}`)
        const invisibleClass = 'd-none'
        const colorizedBackgroundClass = 'bg-light'

        absenceIcon.classList.toggle(invisibleClass)
        patientRow.classList.toggle(colorizedBackgroundClass)
    });

    socket.on('batteryValue', function (ipAddress, batteryValue) {
        let idText = `BatteryOf${ipAddress}`
        let batteryProgressBar = $('div[id="' + idText + '"]')
        batteryProgressBar.attr('aria-valuenow', `${batteryValue}`)
        batteryProgressBar.attr('style', `width: ${batteryValue}%`)
        batteryProgressBar.text(`${batteryValue}%`)

        let ipInDeviceList = $('#deviceList option[value="' + ipAddress + '"]')
        ipInDeviceList.text(`${ipAddress} (${batteryValue}%)`)
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
    let firstName = $('#firstNameField').val().toUpperCase()
    let lastName = $('#lastNameField').val().toUpperCase()
    let birthday = $('#birthdayField').val().toUpperCase()
    let ipAddress = $("#deviceList").val().toUpperCase()

    if (firstName && lastName && birthday && ipAddress) {
        let socket = io();
        socket.emit("assignPatientToWristband", firstName, lastName, birthday, ipAddress)
    }
}

