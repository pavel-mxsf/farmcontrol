var settings;
var slaves = [];
var timer;
var fs = require('fs');
var http = require('http');

function init() {
    var data = fs.readFileSync('server.config.json');
    settings = JSON.parse(data);
    console.log(settings);
    slaves = settings.slaves;
}

function updateSlave(hostname, done) {
    console.log(hostname);
    var data;
    var options = {
        hostname:hostname,
        port:(process.env.PORT || 8081),
        path:'/slave/fullinfo',
        method:'POST'
    };
    var req = http.request(options, function (res)
            res.on('data', function (chunk) {
                console.log('BODY: ' + chunk);
            })
    )
)
    ;
}

function update() {
    for (var i = 0; i < slaves.length; i++) {
        updateSlave(slaves[i]);
    }
}

function startUpdating() {
    console.log(slaves);
    timer = setInterval(update, 1000);
}

function stopUpdating() {
    clearInterval(timer);
}


function fullInfo() {
}
function realtimeInfo() {
}

module.exports = {fullInfo:fullInfo, realtimeInfo:realtimeInfo, init:init, startUpdating:startUpdating};