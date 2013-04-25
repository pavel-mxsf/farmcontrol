var os = require('os');
var getmac = require('getmac');
var realtimeupdate = false;
var realTimeInfo = {};
var interval;
var updateSpeed = 1000;
var last = process.hrtime();
var previousCPU = os.cpus();
var asyncblock = require('asyncblock');

function startUpdating() {
    this.realtimeupdate = true;
    interval = setInterval(update, updateSpeed);
}

function stopUpdating() {
    this.realtimeupdate = false;
    clearInterval(interval);
}

function getTimeInterval() {
    var diff = process.hrtime(last);
    last = process.hrtime();
    return (diff[0] * 1e9 + diff[1]) / 1000000;
}

function fullInfo() {
    return {
        hostname:os.hostname(),
        type:os.type(),
        platform:os.platform(),
        arch:os.arch(),
        release:os.release(),
        totalmem:os.totalmem(),
        cpucount:os.cpus().length,
        networkinterfaces:os.networkInterfaces()
    }
}

function init() {
    getmac.getMac(function (err, macAddress) {
        fullInfo.mac = macAddress;
    });
    update();
}

function getRTinfo() {
    return realTimeInfo;
}

function update() {
    var cpus = os.cpus();
    var time = getTimeInterval();
    var cpusPerc = [];
    var cpusSpeeds = [];
    for (var i = 0; i < cpus.length; i++) {
        var cpuPerc = (100 - ((cpus[i].times.idle - previousCPU[i].times.idle) / time * 100)).toFixed(0);
        if (cpuPerc > 100) {
            cpuPerc = 100
        }
        if (cpuPerc < 0) {
            cpuPerc = 0
        }
        cpusPerc.push(cpuPerc);
        cpusSpeeds.push(cpus[i].speed);
    }
    previousCPU = cpus;

    realTimeInfo = {
        uptime:os.uptime(),
        loadAverage:os.loadavg(),
        freemem:os.freemem(),
        cpusPerc:cpusPerc
    };
}

function run(reqbody) {
    console.log('running ' + reqbody.name);
    asyncblock(function (flow) {
        flow.errorCallback = function (err) {
            console.log(err)
        };
        for (var i = 0; i < reqbody.commands.length; i++) {
            var exec = require('child_process').exec;
            console.log(reqbody.commands[i]);
            exec(reqbody.commands[i], {timeout:0}, flow.add({ignoreError:true, timeout:500, timeoutIsError:false}));
            flow.wait();
        }
    })
}


module.exports = {fullInfo:fullInfo,
    init:init,
    realtimeInfo:getRTinfo,
    start:startUpdating,
    stop:stopUpdating,
    run:run
};