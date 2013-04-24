var os = require('os');
var getmac = require('getmac');
var realtimeupdate = false;
var realTimeInfo = {};
var interval;
var updateSpeed = 1000;
var last=process.hrtime();
var previousCPU = os.cpus();
var asyncblock = require('asyncblock');

function startUpdating() {
    realtimeupdate = true;
    interval = setInterval(update, updateSpeed);
}

var historyData = function(){
    this.data=[];
    this.limit=10;
};

historyData.prototype.add = function(data) {
    this.data.push(data);
    if (this.data.length>this.limit) { this.data.shift() }
};
historyData.prototype.getAvg = function() {
    var tot=0.0;
    for (var i=0;i<this.data.length;i++) {
        tot+=this.data[i];
    };
    return (tot/(this.data.length));
};
historyData.prototype.getHistory = function() {
    return this.data;
};

var hdTotal=new historyData();
var hdCpus=[];
for (var i=0;i<os.cpus().length;i++) {hdCpus.push(new historyData())}

function stopUpdating() {
    realtimeupdate = false;
    clearInterval(interval);
}

var getTimeInterval = function() {
    var diff=process.hrtime(last);
    last=process.hrtime();
    return (diff[0] * 1e9 + diff[1])/1000000;
};

var fullInfo = {
    hostname: os.hostname(),
    type: os.type(),
    platform: os.platform(),
    arch: os.arch(),
    release: os.release(),
    totalmem: os.totalmem(),
    cpucount: os.cpus().length,
    networkinterfaces: os.networkInterfaces()
};

function init() {
    getmac.getMac(function(err,macAddress){
        fullInfo.mac = macAddress;
    });
    update();
}

function getRTinfo() {
    return realTimeInfo;
}

function update() {
    var cpus=os.cpus();
    var cpuTotal=0;
    var time=getTimeInterval();
    var cpusPerc=[];
    var cpusSpeeds=[];
    for (var i=0;i<cpus.length;i++)
    {
        var cpuPerc=100-((cpus[i].times.idle-previousCPU[i].times.idle)/time*100);
        if (cpuPerc>100) { cpuPerc=100 };
        if (cpuPerc<0) { cpuPerc=0 };
        cpusPerc.push(cpuPerc);
        cpuTotal+=cpuPerc;
        hdCpus[i].add(cpuPerc);
        cpusSpeeds.push(cpus[i].speed);
    }
    var cpuTotalPerc = cpuTotal/cpus.length;
    cpuTotalPerc = cpuTotalPerc.toFixed(0);
    hdTotal.add(cpuTotalPerc);
    previousCPU=cpus;

    cpuTotalPercAvg=hdTotal.getAvg();

    cpuTotalPercHistory=hdTotal.getHistory();
    cpuPercAvg=[];
    cpuPercHistory=[];
    for (var i=0;i<cpus.length;i++) {
        cpuPercAvg[i] = hdCpus[i].getAvg();
        cpuPercHistory[i] = hdCpus[i].getHistory();
    }

    realTimeInfo = {
        uptime: os.uptime(),
        loadAverage: os.loadavg(),
        freemem: os.freemem(),
        cpuTotalPerc: cpuTotalPerc,
        cpusPerc: cpusPerc,
        cpuPercAvg: cpuPercAvg,
        cpuPercHistory: cpuPercHistory
    };
}

function run(reqbody) {
    console.log('running ' + reqbody.name);
    asyncblock(function(flow){
        flow.errorCallback = function(err) {console.log(err)};
        for (var i=0;i<reqbody.commands.length;i++){
            var exec = require('child_process').exec;
            console.log(reqbody.commands[i]);
            exec(reqbody.commands[i], {timeout:0}, flow.add({ignoreError:true,timeout:500,timeoutIsError:false}));
            flow.wait();
        }
    })
}

module.exports = {fullInfo:fullInfo,
    init:init,
    realtimeInfo: getRTinfo,
    start: startUpdating,
    stop: stopUpdating,
    run: run
};