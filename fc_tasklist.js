
function getProcessAsync(data, callback) {
    'use strict';
    var plist = data.proclist;
    if (plist.length > 0) {
        var exec = require('child_process').exec;
        var child = exec('tasklist /nh', function (err, stdout) {
            if (!err) {
                var status = {};
                var lines = stdout.split('\n');
                for (var j = 0; j < plist.length; j++) {
                    status[plist[j]] = false;
                    for (var i = 0; i < lines.length; i++) {
                        if (lines[i].indexOf(plist[j]) === 0) {
                            status[plist[j]] = true;
                            break;
                        }
                    }
                }
                callback(null, status);
                child.kill();
            } else {
                callback(err, null);
                child.kill();
            }
        });
    } else {
        callback('no processes to check.',null);
    }
}

module.exports = { getProcessAsync:getProcessAsync};