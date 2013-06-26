var connect = require('connect');
var express = require('express');
var port = (process.env.PORT || 8081);
var slave = require('./fc_slave');

var querystring = require('querystring');
var http = require('http');

/*
require('nodetime').profile({
    accountKey: '912b85d34b58f2a00d5a8ab6528ba82661586b09',
    appName: 'Node.js Application'
});
*/
require('look').start();
//SSL
/*
var fs = require('fs');
var privateKey  = fs.readFileSync('cert/key.pem').toString();
var certificate = fs.readFileSync('cert/cert.pem').toString();
var credentials = {key: privateKey, cert: certificate};
var server = express.createServer(credentials);*/

//Setup Express

var server = express();
server.configure(function () {
    'use strict';
    var cookieSessions = require('./node_modules/connect/lib/middleware/cookieSession.js');
    server.set('views', __dirname + '/views');
    server.set('view options', { layout: false });
    server.use(connect.bodyParser(),null);
    server.use(express.cookieParser('sadadsaf'),null);
    server.use(cookieSessions('sid'));
    server.use(express.session({ secret:"iyutyityi798798" }),null);
    server.use(express.favicon(__dirname + '/static/images/favicon.ico'));
    //server.use(express.staticCache());
    //server.use(express.compress());
    server.use(express.responseTime());
    //noinspection JSUnresolvedFunction
    server.use(connect.static(__dirname + '/static'), {maxAge: 31557600000});

    server.use(server.router,null);
});

//setup the errors

server.use(function (err, req, res, next) {
    'use strict';
    if (err instanceof NotFound) {
        console.log(err);
        res.render('404.jade', { locals: {
            title: '404 - Not Found',
            description: '',
            author: '',
            analyticssiteid: 'XXXXXXX',
            error: err
        }, status: 404 });
    } else {
        console.log(err);
        res.render('500.jade', { locals: {
            title: 'The Server Encountered an Error',
            description: '',
            author: '',
            analyticssiteid: 'XXXXXXX',
            error: err
        }, status: 500 });
    }
});
server.listen(port);

server.get('/heapdump', function heapDump (req, res) {
    'use strict';
    console.log('creating heapdump');
    var hd = require('c:\\Users\\vojacek\\AppData\\Roaming\\npm\\node_modules\\heapdump\\build\\Release\\heapdump');
    hd.writeSnapshot();
    console.log('done');
    res.end();
});

server.get('/gc', function garbageCollection (req, res) {
    'use strict';
    console.log('GC!');
    global.gc();
    console.log('done');
    res.end('garbage collected');
});

if (process.argv[2] === "server") {
// work as server
    console.log('starting RenderFarmControl SERVER ');
    var fcserver = require('./fc_server');
    fcserver.init();

    server.get('/', checkAuth, function getIndex (req, res) {
        'use strict';
        var username = req.session.user_id;
        res.render('index.jade', {
                title: 'RenderFarmControl',
                description: 'Main Panel',
                author: 'Pavel Vojacek',
                user: username
        });
    });

    server.post('/server/wol', checkAuth, function postWol (req, res) {
        'use strict';
        console.log(req.body.mac);
        fcserver.fcwol(req.body.mac, function(err) {console.log(err);});
        res.end();
    });

    server.post('/server/run', checkAuth, function postRun (req, res) {
        'use strict';
        console.log(req.body.cmd);
        var hostname = req.body.hostname;
        var options = {
            hostname: hostname,
            port: 8081,
            path: '/slave/run',
            method: 'POST'
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
            res.on('end', function () {
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

    server.get('/server/infos', checkAuth, function (req, res) {
        'use strict';
        //if (typeof global.gc === 'function') {global.gc();};

        var nfo = {data: fcserver.getSlavesInfo()};
        res.send(nfo);
    });

    server.get('/server/commands', checkAuth, function (req, res) {
        'use strict';
        res.send(fcserver.getCommands());
    });


     function checkAuth (req, res, next) {
        'use strict';
        if (!req.session.user_id) {
            res.redirect('/login');
            //res.send('You are not authorized to view this page');
        } else {
            res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
            next();
        }
    }

    server.post('/login', function (req, res) {
        'use strict';
        console.log('login...');
        var fcUsers = require('./fc_users');
        var post = req.body;
        console.log(post);
        fcUsers.validateUser(post.user, post.password, function(result) {
            if (result) {
                req.session.user_id = post.user;
                res.redirect('/');
            }
            else {
                res.redirect('/login');
            }
        });
    });

    server.get('/login', function (req,res) {
        'use strict';
        res.render('login.jade', {
                title: 'RenderFarmControl Login',
                description: 'login',
                author: 'Pavel Vojacek'

        });
    });

    server.get('/users', checkAuth, function (req,res) {
        'use strict';
        var username = req.session.user_id;
        res.render('users.jade', {
                title: 'RenderFarmControl Users',
                description: 'login',
                author: 'Pavel Vojacek',
                user: username
        });
    });

    server.post('/newuser', checkAuth, function(req,res){
        'use strict';
        var post = req.body;
        var fcUsers = require('./fc_users');
        if (post.user && post.password) {
            fcUsers.addUser(post.user, post.password, function(){
                console.log('new user '+post.user);
                res.end();
            });
        }
        else {res.end();}
    });

    server.post('/deleteUser', checkAuth, function(req,res){
        'use strict';
        var post = req.body;
        var fcUsers = require('./fc_users');
        if (post.user) {
            fcUsers.removeUser(post.user, function(){
                console.log('deleted user '+post.user);
                res.end();
            });
        }
        else {res.end();}
    });

    server.get('/getUsers', checkAuth, function (req,res) {
        'use strict';
        var fcUsers = require('./fc_users');
        fcUsers.getUsers(function (users) {
            console.log('sending users');
            console.log(users);
            res.json(users);
        });
    });

    server.get('/logout', function (req, res) {
        'use strict';
        delete req.session.user_id;
        res.redirect('/login');
    });

    server.get('/restart', function(req,res) {
        'use strict';
        fcserver = undefined;
        fcserver = require('./fc_server');
        fcserver.init();
        global.gc();
        res.end('server restarted...');
    });

}
else
{
// work as slave

    slave.init();
    slave.start();

    server.get('/slave/fullinfo', function (req, res) {
        'use strict';
        console.log(req.query);
        slave.fullInfo(function(info){ res.send(info); });
    });

    server.get('/slave/realtimeinfo', function slaveGetRealTimeInfo (req, res) {
        'use strict';
        var info = slave.realtimeInfo();
        res.send(info);
    });

    server.post('/slave/run', function slaveRun (req, res) {
        'use strict';
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
}

//A Route for Creating a 500 Error (Useful to keep around)
server.get('/500', function (req, res) {
    'use strict';
    throw new Error('This is a 500 Error');
});

//The 404 Route (ALWAYS Keep this as the last route)

server.get('/*', function (req, res) {
    'use strict';
    console.log('not found ' + req.url);
    res.end();
    //throw new NotFound();
});

function NotFound(msg) {
    'use strict';
    var self = this;
    this.name = 'NotFound';
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
}

console.log('Listening on http://0.0.0.0:' + port);