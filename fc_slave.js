var os = require('os');
var getmac = require('getmac');
var realtimeupdate = false;
var realTimeInfo = {};
var interval;
var updateSpeed = 1000;
var last = process.hrtime();
var previousCPU = os.cpus();
var mac = '';
var perfmon = require('perfmon');
var getProcess = require('./fc_tasklist.js');
var wmi = require('./fc_wmi');

/**
 * Should return exact time, but apparently broken.
 * @returns {number}
 */
function getTimeInterval() {
    'use strict';
    //var diff = process.hrtime(last);
    //last = process.hrtime();
    //return (diff[0].toFixed(3) * 1000);// + diff[1].toFixed(0) / 1000000);
    return updateSpeed;
}
/**
 *
 * @param done callback function
 * @returns {{hostname: (*|string), type: *, platform: (*|string), arch: *, release: *, totalmem: *, cpucount: Number, networkinterfaces: *, mac: string}}
 */
function fullInfo(done) {
    'use strict';
    getmac.getMac(function (err, macAddress) {
        mac = macAddress;
        done({
            hostname: os.hostname(),
            type: os.type(),
            platform: os.platform(),
            arch: os.arch(),
            release: os.release(),
            totalmem: os.totalmem(),
            cpucount: os.cpus().length,
            networkinterfaces: os.networkInterfaces(),
            mac: mac
        });
    });
    return {
        hostname: os.hostname(),
        type: os.type(),
        platform: os.platform(),
        arch: os.arch(),
        release: os.release(),
        totalmem: os.totalmem(),
        cpucount: os.cpus().length,
        networkinterfaces: os.networkInterfaces(),
        mac: mac
    };
}

function getRTinfo() {
    'use strict';
    return realTimeInfo;
}

function addProcessInfo(err, nfo) {
    'use strict';
    if (err) {

        console.log('ERROR! '+err);
    } else { realTimeInfo.processInfo = nfo; }
}

function update() {
    'use strict';
    getProcess.getProcessAsync({proclist: ['server.exe', 'calc.exe', 'node.exe', 'vrayspawner2012.exe','vrayspawner2013.exe','vrayspawner2014.exe','vrayspawner2009.exe'] }, addProcessInfo);
    wmi.report(function(data) {
            realTimeInfo.hwInfo = data;
        }
    );
    var cpus = os.cpus(),
        time = getTimeInterval(),
        cpusPerc = [],
        cpusSpeeds = [],
        i;
    for (i = 0; i < cpus.length; i++) {
        var cpuPerc = (100 - ((cpus[i].times.idle - previousCPU[i].times.idle) / time * 100)).toFixed(2);

        if (cpuPerc > 100) {
            cpuPerc = 100;
        }
        if (cpuPerc < 0) {
            cpuPerc = 0;
        }
        cpusPerc.push(cpuPerc);
        cpusSpeeds.push(cpus[i].speed);

    }
    previousCPU = cpus;

    realTimeInfo.uptime = os.uptime();
    realTimeInfo.loadAverage = os.loadavg();
    realTimeInfo.freemem = os.freemem();
    realTimeInfo.cpusPerc = cpusPerc;
    realTimeInfo.cpusSpeeds = cpusSpeeds;
}

function run(toExecute) {
    'use strict';
    console.log('running ' + JSON.stringify(toExecute.cmd));
    var command = toExecute.cmd;
    var terminal = require('child_process').spawn('cmd');
    var str = '';
    terminal.stdout.on('data', function (data) {
        str += data;
    });

    terminal.on('exit', function (code) {
        console.log('child process exited with code ' + code);
        console.log('stdout: ' + str);
    });

    for (var i = 0; i < command.commands.length; i++) {
        /* var exec = require('child_process').exec;
         console.log(command.commands[i]);
         exec(command.commands[i], {timeout:0}, function(err, stdout, stderr ){console.log(stderr)});*/
        terminal.stdin.write(command.commands[i] + '\n');
    }
    terminal.stdin.end();
}
function init() {
    'use strict';
    getmac.getMac(function (err, macAddress) {
        mac = macAddress;
    });
    update();
}

function startUpdating() {
    'use strict';
    realtimeupdate = true;
    interval = setInterval(update, updateSpeed);
}

function stopUpdating() {
    'use strict';
    realtimeupdate = false;
    clearInterval(interval);
}

module.exports = {fullInfo:fullInfo,
    init:init,
    realtimeInfo: getRTinfo,
    start: startUpdating,
    stop: stopUpdating,
    run: run
};