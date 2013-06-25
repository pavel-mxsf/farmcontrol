var fs = require('fs');
var crypto = require('crypto');
var salt = "klfjsd";
var pwdFile = './pwds.json';

function validateUser(user, password, done) {
    'use strict';
    fs.readFile(pwdFile, function (err, data) {
        if (err) {
            console.log(err);
            done(false);
        }
        else {
            var userTable = JSON.parse(data);
            var pwdHash = crypto.createHash('md5').update(password+salt).digest("hex");
            console.log(pwdHash);
            if (userTable[user]===pwdHash) {
                done(true);
            }
            else {
                done(false);
            }
        }
    });
}

function addUser(user, password, done) {
    'use strict';
    fs.readFile(pwdFile, function (err, data) {
        if (err) {
            console.log(err);
            done(false);
        }
        else {
            var userTable = JSON.parse(data);
            var pwdHash = crypto.createHash('md5').update(password+salt).digest("hex");
            userTable[user] = pwdHash;
            fs.writeFile(pwdFile, JSON.stringify(userTable), done);
        }
    });
}

function removeUser(user, done) {
    'use strict';
    fs.readFile('./pwds.json', function (err, data) {
        if (err) {
            console.log(err);
            done(err);
        }
        else {
            if (user === 'admin') {
                console.log('cannot delete admin account');
                done('cannot delete admin account');
            }
            else
            {
            var userTable = JSON.parse(data);
            delete userTable[user];
            fs.writeFile(pwdFile, JSON.stringify(userTable), done);
            }
        }
    });
}

function getUsers (done) {
    'use strict';
    fs.readFile('./pwds.json', function (err, data) {
        if (err) {
            err(err);
        }
        else {
            var userList = [];
            var usersTable = JSON.parse(data);
            for (var key in usersTable) {
                userList.push(key);
            }
            done(userList);
        }
    });
}

function changePwd (user, password,done) {
    'use strict';
    addUser(user,password,done);
}

module.exports = {
    validateUser: validateUser,
    addUser: addUser,
    removeUser: removeUser,
    changePwd: changePwd,
    getUsers: getUsers
};