var settings;
var slaves = [];
var timer;
var slavesInfo = {};
var fs = require('fs');
var http = require('http');
var updating = [];
function init() {
    var data = fs.readFileSync('server.config.json');
    settings = JSON.parse(data);
    slaves = settings.slaves;
}

function setSlaveFullInfo(hostname, info) {
    slavesInfo[hostname].fullInfo = info;
}

function clearSlaveFullInfo(hostname) {
    slavesInfo[hostname].fullInfo = null;
}

function setSlaveRTInfo(hostname, info) {
    slavesInfo[hostname].rtInfo = info;
}

function clearSlaveRTInfo(hostname) {
    slavesInfo[hostname].rtInfo = null;
}

function updateFullInfo(hostname) {
    updating[hostname] = true;
    var options = {
        hostname:hostname,
        port:8081,
        path:'/slave/fullinfo',
        method:'GET'
    };
    var req = http.get(options, function (res) {

        var str = '';
        res.on('data', function (chunk) {
            str += chunk;
        });
        res.on('error', function (err) {
            updating[hostname] = false;
        });
        res.on('end', function (err) {
            updating[hostname] = false;
            if (err) {

            }
            else {
                json = JSON.parse(str);
                setSlaveFullInfo(hostname, json);
            }
        });
    });
    req.setTimeout(100, function () {
        updating[hostname] = false;
    });
    req.on('error', function (err) {
        updating[hostname] = false;
    });
}

function updateRTInfo(hostname) {
    var options = {
        hostname:hostname,
        port:8081,
        path:'/slave/realtimeinfo',
        method:'GET'
    };
    var req = http.get(options, function (res) {
        var str = '';
        res.on('data', function (chunk) {
            str += chunk;
        });
        res.on('error', function (err) {
            clearSlaveRTInfo(hostname);
        });
        res.on('end', function (err) {
            if (err) {
                clearSlaveRTInfo(hostname);
            }
            else {
                json = JSON.parse(str);
                setSlaveRTInfo(hostname, json);
            }
        });
    });
    req.setTimeout(100, function () {
        clearSlaveRTInfo(hostname);
    });
    req.on('error', function (err) {
        clearSlaveRTInfo(hostname);
        updating[hostname] = false;
    });
}

function updateSlave(hostname, done) {
    if (!slavesInfo[hostname]) {
        slavesInfo[hostname] = {}
    }
    if (updating[hostname] === false) {
        if (slavesInfo[hostname].fullInfo) {
            updateRTInfo(hostname);
        }
        else {
            updateFullInfo(hostname);
        }
    }
}

function update() {
    for (var i = 0; i < slaves.length; i++) {
        if (!updating[slaves[i]]) {
            updating[slaves[i]] = false
        }
        updateSlave(slaves[i]);
    }
}

function startUpdating() {
    timer = setInterval(update, settings.updateInterval);
}

function stopUpdating() {
    clearInterval(timer);
}


function fullInfo() {
}
function realtimeInfo() {
}

function getSlavesInfo() {
    return slavesInfo;
}

function getCommands() {
    return settings.commands;
}
module.exports = {
    getSlavesInfo:getSlavesInfo,
    init:init,
    startUpdating:startUpdating,
    getCommands:getCommands
};