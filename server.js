var connect = require('connect')
    , express = require('express')
    , port = (process.env.PORT || 8081)
    , slave = require('./fc_slave')
    , fcserver = require('./fc_server')
    , querystring = require('querystring')
    , http = require('http')
    , wol = require('wake_on_lan');

slave.init();
slave.start();

fcserver.init();
fcserver.startUpdating();

//Setup Express
var server = express.createServer();
server.configure(function () {
    server.set('views', __dirname + '/views');
    server.set('view options', { layout:false });
    server.use(connect.bodyParser());
    server.use(express.cookieParser());
    server.use(express.session({ secret:"iyutyityi798798"}));
    server.use(connect.static(__dirname + '/static'));
    server.use(server.router);
});

//setup the errors

server.error(function (err, req, res, next) {
    if (err instanceof NotFound) {
        res.render('404.jade', { locals:{
            title:'404 - Not Found', description:'', author:'', analyticssiteid:'XXXXXXX'
        }, status:404 });
    } else {
        res.render('500.jade', { locals:{
            title:'The Server Encountered an Error', description:'', author:'', analyticssiteid:'XXXXXXX', error:err
        }, status:500 });
    }
});
server.listen(port);
/*
 //Setup Socket.IO
 var io = io.listen(server);
 io.sockets.on('connection', function(socket){
 console.log('Client Connected');
 socket.on('message', function(data){
 socket.broadcast.emit('server_message',data);
 socket.emit('server_message',data);
 });
 socket.on('disconnect', function(){
 console.log('Client Disconnected.');
 });
 });
 */

///////////////////////////////////////////
//              Routes                   //
///////////////////////////////////////////

/////// ADD ALL YOUR ROUTES HERE  /////////

server.get('/', function (req, res) {
    res.render('index.jade', {
        locals:{
            title:'RenderFarmControl', description:'Main Panel', author:'Pavel Vojacek'
        }
    });
});

server.get('/slave/fullinfo', function (req, res) {
    var info = slave.fullInfo(function(info){res.send(info)});
});

server.get('/slave/realtimeinfo', function (req, res) {
    var info = slave.realtimeInfo();
    res.send(info);
});

server.post('/slave/run', function (req, res) {
    //
    var str = '';
    req.on('data', function (chunk) {
        str += chunk;
    });
    req.on('end', function (err) {
        console.log(str);
        slave.run(JSON.parse(str));
        console.log(JSON.stringify(JSON.parse(str)));
    });
    res.end();
});

server.post('/server/wol', function (req,res){
    console.log(req.body.mac);
    wol.wake(req.body.mac, function(error) {
        if (error) {
            console.log(err);
        } else {
            console.log('wol ok');
        }
    });
    res.end();
});


server.post('/server/run', function (req, res) {
    console.log(req.body.cmd);
    var hostname = req.body.hostname;
    var options = {
        hostname:hostname,
        port:8081,
        path:'/slave/run',
        method:'POST'
    };
    var reqp = http.request(options, function (res) {
        var str = '';
        res.on('data', function (chunk) {
            str += chunk;
        });
        res.on('error', function (err) {
            console.log('/server/run');
            console.log(err);
        });
        res.on('end', function (err) {
            console.log('done');
        });
    });
    reqp.setTimeout(100, function () {
    });
    reqp.on('error', function (err) {
        console.log(err);
    });
    reqp.write(JSON.stringify(req.body));
    reqp.end();
    res.end();
});

server.post('/server/wol', function (req, res) {

});

server.get('/server/infos', function (req, res) {
    var nfo = {data:fcserver.getSlavesInfo()};
    res.send(nfo);
});

server.get('/server/commands', function (req, res) {
    res.send(fcserver.getCommands());
});

//A Route for Creating a 500 Error (Useful to keep around)
server.get('/500', function (req, res) {
    throw new Error('This is a 500 Error');
});

//The 404 Route (ALWAYS Keep this as the last route)

server.get('/*', function (req, res) {
    throw new NotFound;
});

function NotFound(msg) {
    this.name = 'NotFound';
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
}

console.log('Listening on http://0.0.0.0:' + port);