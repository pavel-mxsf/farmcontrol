var wmi = require('wmi');
var wmiinstance;
function init() {
    'use strict';
    wmi.connect(function(err, wmi){
        if (err !== null) {console.log(err);}
        wmi.connect('localhost','root\\OpenHardwareMonitor');
        wmiinstance = wmi;
    });
}
function parseResults (data, done) {
    'use strict';
    var result = {cpuTemp:[],cpuClock:[]};
    for (var i=0;i<data.length;i++) {
        if (data[i].SensorType==='Temperature' && data[i].Name.substring(0,3)==='CPU') {
            result.cpuTemp.push(data[i].Value);
        }
        if (data[i].SensorType==='Clock' && data[i].Name.substring(0,3)==='CPU') {
            result.cpuClock.push(data[i].Value);
        }
    }
    done(result);
}

function report(done) {
    'use strict';
    if (wmiinstance) {
    wmiinstance.query('SELECT * FROM Sensor', function(err,result) {
        if (err !== null) {
            //console.log(err);
        }
        else {
            var output = parseResults(result,done);
        }
    });
    }
    else {init();done(null);}
}

module.exports={report: report};