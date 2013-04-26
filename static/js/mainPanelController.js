var mm = angular.module('farmControl', []);

function MainPanelCtrl($scope, $http, $timeout) {
    $scope.name = 'paja';
    $scope.info = {};
    $scope.commands = [];

    $scope.getCommands = function () {
        $http({method:'GET', url:'/server/commands'}).
            success(function (data, status, headers, config) {
                $scope.commands = data;
            }).
            error(function (data, status, headers, config) {

            });
    };

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

    $scope.refresh = function () {
        $http({method:'GET', url:'/server/infos'}).
            success(function (data, status, headers, config) {
                $scope.info = data;
                $timeout($scope.refresh, 1000);
            }).
            error(function (data, status, headers, config) {
                $timeout($scope.refresh, 1000);
            });
    };
    $timeout($scope.refresh, 1000);
}
