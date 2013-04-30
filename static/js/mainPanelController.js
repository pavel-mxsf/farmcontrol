var mm = angular.module('farmControl', []);

mm.controller("MainPanelCtrl", function($scope, $http, $timeout) {
    $scope.commands = [];

    $scope.getCommands = function () {
        $http({method:'GET', url:'/server/commands'}).
            success(function (data, status, headers, config) {
                $scope.commands = data;
            }).
            error(function (data, status, headers, config) {

            });
    };

    function update( destination, source ) {
        var angularJSKeyPattern = /^\$\$/i;
        for ( var name in source ) {
            if (
                source.hasOwnProperty( name ) && ! angularJSKeyPattern.test( name )
                ) {
                destination[ name ] = source[ name ];
            }
        }
    }

    function rebuild (data) {
        if (!$scope.info) {
            $scope.info = data;
            console.log('initial');
        }
        else
        {
            for (var slave in data.data) {
                update( $scope.info.data[slave], data.data[slave]);
            }
        }
    }

    $scope.runCommand = function (host, cmd) {
        console.log(host);
        console.log(cmd);
        var toSend = {hostname:host, cmd:cmd};
        console.log(JSON.stringify(toSend));

        $http({method:'POST', url:'/server/run', data:toSend}).
            success(function (data, status, headers, config) {
                console.log(data);
            }).
            error(function (data, status, headers, config) {
                console.log(data);
            });
    };

    $scope.refreshSpeed = 1000;

    $scope.computeCpuTotal = function () {


    };
    $scope.wol = function(mac) {
        $http({method:'POST', url:'/server/wol',data:{mac:mac}}).
            success(function (data, status, headers, config) {
                console.log('waking '+mac);
            }).
            error(function (data, status, headers, config) {
                console.log(data);
            });
    };

    $scope.refresh = function () {
        $http({method:'GET', url:'/server/infos'}).
            success(function (data, status, headers, config) {
                rebuild(data);
                console.log(data);
                $timeout($scope.refresh, $scope.refreshSpeed);
            }).
            error(function (data, status, headers, config) {
                $timeout($scope.refresh, $scope.refreshSpeed);
            });
    };
    $timeout($scope.refresh, $scope.refreshSpeed);
});