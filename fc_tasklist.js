function getProcessAsync(data,callback) {
    var plist = data.proclist;
    if (plist.length>0)
    {
    var exec = require('child_process').exec;
    exec('tasklist /nh', function(err, stdout, stderr) {
        if (err) {
            callback(err,null);
        }
        else
        {
            var status = {};
            var lines = stdout.split('\n');
            for (var j = 0; j<plist.length; j++) {
                status[plist[j]] = false;
                for (var i=0; i<lines.length; i++){
                    if (lines[i].indexOf(plist[j]) === 0) {
                        status[plist[j]] = true;
                        break;
                    }
                }
            }
            callback(null,status);
        }
    });
    }
    else {
        callback('no processes to check.',null)
    }
}

module.exports = { getProcessAsync:getProcessAsync};