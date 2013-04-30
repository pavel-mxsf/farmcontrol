var status = {};
var names=['calc.exe'];

function refresh() {
    if (names.length>0)
    {
    var exec = require('child_process').exec;
    exec('tasklist /nh', function(err, stdout, stderr) {
        if (err) {

        }
        else
        {
            var lines=stdout.split('\n');
            for (var j=0;j<names.length;j++) {
                status[names[j]] = false;
                for (var i=0;i<lines.length;i++){
                    if (lines[i].indexOf(names[j])===0) {
                        status[names[j]] = true;
                        break;
                    }
                }
            }
        }
    });
    }
}

module.exports = { status:status, names:names, refresh:refresh };