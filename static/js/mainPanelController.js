angular.module('farmControl', ['ui.bootstrap','ui.bootstrap.tooltip','ui.bootstrap.progressbar']);
var mm = angular.module('farmControl', []);

mm.controller("MainPanelCtrl", function($scope, $http, $timeout) {
    $scope.commands = [];
    $scope.showCheckboxes = false;

    $scope.onCheckboxes = function(){$scope.showCheckboxes=true};
    $scope.offCheckboxes = function(){$scope.showCheckboxes=false};
    $scope.selectAll = function() {
          for (var slave in $scope.info.data) {
              $scope.info.data[slave].selected = true;
    }};

    $scope.wolSelected = function() {
        for (var slave in $scope.info.data) {
            if($scope.info.data[slave].selected) {
                $scope.wol($scope.info.data[slave].fullInfo.mac);
            }
        }
    };

    $scope.cmdSelected =  function(cmd) {
        for (var slave in $scope.info.data) {
            if($scope.info.data[slave].selected) {
                $scope.runCommand($scope.info.data[slave].fullInfo.hostname,cmd);
            }
        }
    };

    $scope.selectNone = function() {
        for (var slave in $scope.info.data) {
            $scope.info.data[slave].selected = false;
        }
    };

    $scope.getCommands = function () {
        $http({method:'GET', url:'/server/commands'}).
            success(function (data, status, headers, config) {
                $scope.commands = data;
            }).
            error(function (data, status, headers, config) {

            });
    };

    $scope.lineOpened = function(slave) {
      return false;
    };

    $scope.showDetails = function(host) {

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
        var toSend = {hostname:host, cmd:cmd};
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
                $timeout($scope.refresh, $scope.refreshSpeed);
            }).
            error(function (data, status, headers, config) {
                $timeout($scope.refresh, $scope.refreshSpeed);
            });
    };
    $timeout($scope.refresh, $scope.refreshSpeed);
});

mm.directive('waitbutton', function factory() {
    var directiveDefinitionObject = {
        restrict: 'A',
        scope:true,
        replace:false,
        link:function (scope, element, attrs) {
            element.bind('click', toggle);
            function toggle(){
                element.addClass('loading');
                setTimeout(function(){
                    element.removeClass('loading');
                }, 3000);
            }
        }
    };

    return directiveDefinitionObject;
});


mm.directive('cpubar', function factory() {
    var directiveDefinitionObject = {
        restrict: 'E',
        scope:true,
        replace:true,
        template: '<div class="cpubar progress" style="width: 100px; height:40px;margin:0px">' +
            '<svg class="graph" height="40" xmlns="http://www.w3.org/2000/svg">'+
            '<defs> ' +
            '<linearGradient id="myLinearGradient1"'+
           ' x1="0%" y1="0%"'+
           ' x2="0%" y2="100%"'+
           ' spreadMethod="pad">'+
           '     <stop offset="0%"   stop-color="#62C462" stop-opacity="1"/>'+
           '     <stop offset="100%" stop-color="#51A351" stop-opacity="1"/>'+
            '</linearGradient>'+
            '</defs>' +
            '<line x1="0" y1="10" x2="100" y2="10" style="stroke-width: 1;stroke: #444444;"/>'+
            '<line x1="0" y1="20" x2="100" y2="20" style="stroke-width: 1;stroke: #444444;"/>'+
            '<line x1="0" y1="30" x2="100" y2="30" style="stroke-width: 1;stroke: #444444;"/>'+
            '<rect />'+
            '<rect style="fill:url(#myLinearGradient1);" ng-repeat="cpu in cpus track by $index" ng-x="{{$index*12+3}}" ng-y="{{40-cpu/2.5}}" width="10" ng-height="{{cpu/2.55}}">'+
            '</rect>'+
            '</svg>'+
            '</div>'
        ,
        link:function (scope, element, attrs) {
            scope.cpus = [];
            attrs.$observe('values', function(val){
                if ( val ) {
                    var arr = JSON.parse(val);
                    scope.cpus =  arr;
                }
                else {  }
            });
        }
    };
    return directiveDefinitionObject;
});


mm.directive('ngX', function() {
        return function(scope, elem, attrs) {
            attrs.$observe('ngX', function(x) {
                elem.attr('x', x);
            });
        };
    })
    .directive('ngY', function() {
        return function(scope, elem, attrs) {
            attrs.$observe('ngY', function(y) {
                elem.attr('y', y);
            });
        };
    })
    .directive('ngWidth', function() {
        return function(scope, elem, attrs) {
            attrs.$observe('ngWidth', function(width) {
                elem.attr('width', width);
            });
        };
    })
    .directive('ngHeight', function() {
        return function(scope, elem, attrs) {
            attrs.$observe('ngHeight', function(height) {
                elem.attr('height', height);
            });
        };
    });


