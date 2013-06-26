/*global angular */
angular.module('farmControl', []);
var mm = angular.module('farmControl', []);

mm.controller("usersCtrl", function($scope, $http) {
    'use strict';
    $scope.users = [];
    $scope.mode = 'New User';
    $scope.updateMode = function () {
        if ($scope.users.indexOf($scope.newuser) !== -1) {
            $scope.mode = 'Change Password';
        }
        else {
            $scope.mode = 'New User';
        }
    };

    $scope.createUser = function() {
        console.log('creating user');
        console.log($scope.newuser);
        var data = {user:$scope.newuser,
            password:$scope.newpassword };

        $http({method: 'POST', url: '/newUser', data: data}).
            success(function(data, status, headers, config) {
                $scope.loadUsers();
                $scope.newpassword = "";
            }).
            error(function(data, status, headers, config) {
                console.log('error getting users');
            });
    };

    $scope.changePassword = function (user) {
        $scope.newuser = user;
        $scope.newpassword = "";
        $scope.updateMode();
    };

    $scope.deleteUser = function(user) {
        var data = {user:user};
        $http({method: 'POST', url: '/deleteUser', data: data}).
            success(function(data, status, headers, config) {
                $scope.loadUsers();
            }).
            error(function(data, status, headers, config) {
                console.log('error deleting user');
            });
    };

    $scope.loadUsers = function () {
        console.log('getting users...');
        $http({method: 'GET', url: '/getUsers'}).
            success(function(data, status, headers, config) {
                $scope.users = data;
                $scope.updateMode();
            }).
            error(function(data, status, headers, config) {
                console.log('error getting users');
            });
        };
});
