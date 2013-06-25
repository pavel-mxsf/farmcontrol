var querystring = require('querystring');
var wol = require('wake_on_lan');
var fs = require('fs');
var http = require('http');

var updating = [];
var settings;
var slaves = [];
var timer;
var slavesInfo = {};


function init() {
    'use strict';
    console.log('initializing server part...');
    /*slaves = [];
    updating = [];
    slavesInfo = [];*/
    var data = fs.readFileSync('server.config.json');
    settings = JSON.parse(data);
    slaves = settings.slaves;
    console.log('deleting slaves info: '+slavesInfo);

    startUpdating();
}

function fcwol(mac,done) {
    'use strict';
    wol.wake(mac, {address: "255.255.255.255"}, function (err) {
        if (err) {
            console.log(err);
            done(err);
        } else {
            console.log('wol ok');
            done();
        }
    });
}

function reloadConfig(callback) {
    'use strict';
    function onConfigLoad(err, data) {
        if (err) {
            callback(err, null);
        } else {
            settings = JSON.parse(data);
            slaves = settings.slaves;
            callback(null, data);
        }
    }
    fs.readFile('server.config.json', onConfigLoad);
}

function setSlaveFullInfo(hostname, info) {
    'use strict';
    slavesInfo[hostname].fullInfo = info;
}

function clearSlaveFullInfo(hostname) {
    'use strict';
    slavesInfo[hostname].fullInfo = null;
}

function setSlaveRTInfo(hostname, info) {
    'use strict';
    slavesInfo[hostname].rtInfo = info;
}

function clearSlaveRTInfo(hostname) {
    'use strict';
    slavesInfo[hostname].rtInfo = null;
}

function updateFullInfo(hostname) {
    'use strict';
    if (!updating[hostname]) {
    var proclist = ['server.exe', 'calc.exe', 'node.exe', 'vrayspawner2012.exe','vrayspawner2014.exe','vrayspawner2009.exe'];
    var proclistQuery = querystring.stringify({process:proclist});
    updating[hostname] = true;
    var options = {
        hostname: hostname,
        port: 8081,
        path: '/slave/fullinfo?'+proclistQuery,
        method: 'GET'
    };
    var req = http.get(options, function fullInfoGet (res) {
        var str = '';
        res.on('data', function (chunk) {
            str += chunk;
        });
        res.on('error', function fullInfoResError () {
            updating[hostname] = false;
        });
        res.on('end', function fullInfoEnd (err) {
            updating[hostname] = false;
            if (!err) {
                try {
                    var json = JSON.parse(str);
                    setSlaveFullInfo(hostname, json);
                    req = null;
                } catch (e) {
                    req = null;
                }
            }
        });
    });

    req.setTimeout(800, function fullInfoTimeout () {
        updating[hostname] = false;
        if (req.end) {req.end();}
        req = null;
    });
    req.on('error', function fullInfoReqError (err) {
        updating[hostname] = false;
        req = null;
    });
    }
}

function updateRTInfo(hostname) {
    'use strict';
    var options = {
        hostname: hostname,
        port: 8081,
        path: "/slave/realtimeinfo",
        method: 'GET'
    };
    var req = http.get(options, function httpGetRealTimeInfo (res) {
        var str = '';
        res.on('data', function realTimeInfoData (chunk) {
            str += chunk;
        });
        res.on('error', function realTimeInfoError (err) {
            clearSlaveRTInfo(hostname);
        });
        res.on('end', function realTimeInfoEnd (err) {
            if (err) {
                clearSlaveRTInfo(hostname);
            } else {
                var json = JSON.parse(str);
                setSlaveRTInfo(hostname, json);
            }
        });
    });
    req.setTimeout(1000, function realTimeInfoTimeout () {
        clearSlaveRTInfo(hostname);
        updating[hostname] = false;
        req = null;
    });
    req.on('error', function realTimeInfoReqError (err) {
        clearSlaveRTInfo(hostname);
        updating[hostname] = false;
        req = null;
    });
}

function updateSlave(hostname) {
    'use strict';
    if (!slavesInfo[hostname]) {
        slavesInfo[hostname] = {};
    }
    if (!updating[hostname]) {
        if (!slavesInfo[hostname].fullInfo) {
            updateFullInfo(hostname);
        } else {
            updateRTInfo(hostname);
        }
    }
}

function update() {
    'use strict';
    var i;
    for (i = 0; i < slaves.length; i++) {
        /*if (!updating[slaves[i]]) {
            updating[slaves[i]] = false;
        }*/
        updateSlave(slaves[i]);
    }
}

function startUpdating() {
    'use strict';
    timer = setInterval(update, settings.updateInterval);
}

function stopUpdating() {
    'use strict';
    slavesInfo = [];
    clearInterval(timer);
}

function getSlavesInfo() {
    'use strict';
    return slavesInfo;
}

function getCommands() {
    'use strict';
    return settings.commands;
}
module.exports = {
    getSlavesInfo: getSlavesInfo,
    init: init,
    startUpdating: startUpdating,
    getCommands: getCommands,
    fcwol:fcwol
};