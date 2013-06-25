/*global angular */
angular.module('farmControl', []);
var mm = angular.module('farmControl', ['ui.bootstrap']);

angular.module('mm', ['ui.bootstrap']);

mm.controller("MainPanelCtrl", function($scope, $http, $timeout) {
    'use strict';
    $scope.loaded = false;
    $scope.commands = [];
    $scope.showCheckboxes = false;

    $scope.onCheckboxes = function(){$scope.showCheckboxes=true;};
    $scope.offCheckboxes = function(){$scope.showCheckboxes=false;};
    $scope.selectAll = function() {
        angular.forEach($scope.info.data, function(value,key) {
            $scope.info.data[key].selected = true;
        });
    };

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
        angular.forEach($scope.info.data, function(value,key) {
            $scope.info.data[key].selected = false;
        });
    };

    $scope.getCommands = function () {
        $http({method:'GET', url:'/server/commands'}).
            success(function (data, status, headers, config) {
                $scope.commands = data;
                $scope.loaded = true;
            }).
            error(function (data, status, headers, config) {

            });
    };

    $scope.lineOpened = function(slave) {
      return false;
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
            angular.forEach(data.data, function(value,key) {
                update($scope.info.data[key], value);
            });
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
    'use strict';
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

mm.directive('indbutton', function() {
    'use strict';
    var directiveDefinitionObject = {
        restrict: 'E',
        scope:true,
        replace:true,
        transclude: true,
        template: '<button class="btn" ng-transclude ng:click="changeColor(state)">',
        link:function (scope, element, attrs) {

        }
    };
    return directiveDefinitionObject;
});


mm.directive('cpubar', function factory() {
    'use strict';
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
            '</div>',
        link:function (scope, element, attrs) {
            scope.cpus = [];
            attrs.$observe('values', function(val){
                if ( val ) {
                    var arr = JSON.parse(val);
                    scope.cpus =  arr;
                }
            });
        }
    };
    return directiveDefinitionObject;
});

/*global SmoothieChart, TimeSeries */
mm.directive('smoothie', function() {
    'use strict';
    var directiveDefinitionObject = {
        restrict: 'A',
        scope: true,
        replace: false,
        link:function (scope, element, attrs) {
            scope.timeSeries = [];
            var options = {
                labels:{disabled:true,precision:0},
                grid: {
                    strokeStyle: 'rgba(119,119,119,0.28)',
                    sharpLines: true,
                    millisPerLine: 3000,
                    verticalSections: 10},
                millisPerPixel: 800,
                maxValue: 100,
                minValue: 0};

            var mainLineStyle = { strokeStyle:'rgb(0, 255, 0)', fillStyle:'rgba(0, 255, 0, 0.5)', lineWidth:2 };
            var lineStyle = { strokeStyle:'rgb(0, 255, 0)', lineWidth:1 };

            if (attrs.smoothietype === "temp") {
                console.log('temp');
                options.labels.disabled=false;
                options.labels.precision=5;
                options.labels.fontSize=10;
                options.millisPerPixel = 800;
                options.maxValue = undefined;
                options.minValue = undefined;
                mainLineStyle.fillStyle = 'rgba(255,0,0,0.5)';
                mainLineStyle.strokeStyle = 'rgb(255, 0, 0)';
                lineStyle.strokeStyle='rgb(255, 180, 0)';
            }

            scope.smoothie = new SmoothieChart(options);
            scope.smoothie.streamTo(element[0], 500);

            scope.totalTimeSeries = new TimeSeries();
            scope.smoothie.addTimeSeries(scope.totalTimeSeries, mainLineStyle);

            attrs.$observe('smoothie', function(val) {
                var values, i;
                if (scope.timeSeries.length===0) {
                    if (attrs.smoothie!=='') {
                        values = JSON.parse(attrs.smoothie);
                        if (values.length) {
                            for (i=0; i < values.length; i++) {
                                var ts = new TimeSeries();
                                scope.timeSeries.push(ts);
                                scope.smoothie.addTimeSeries(ts,lineStyle);
                            }
                        }
                    }
                }
                else
                {
                var time = new Date().getTime();
                if (attrs.smoothie!=='') {
                    values = JSON.parse(attrs.smoothie);
                    var total = 0;
                    if (values) {
                        for (i = 0; i < values.length; i++) {
                            total += values[i]/values.length;
                            scope.timeSeries[i].append(time, values[i]);
                        }
                        scope.totalTimeSeries.append(time, total);
                    }

                }
                else
                {
                    scope.totalTimeSeries.append(time, 0);
                }
                }
            });
        }
    };
    return directiveDefinitionObject;
});

mm.filter('memoryMB', function(){
    'use strict';
    return function(val) {
        return (parseInt(val/1048576,10).toString()+" MB");
    };
});

mm.filter('memoryGB', function(){
    'use strict';
    return function(val) {
        return (parseInt(val/1073741824,10).toString()+" GB");
    };
});

mm.filter('int', function(){
    'use strict';
    return function(val) {
        return (parseInt(val,10).toString());
    };
});

mm.filter('cpucores', function(){
    'use strict';
    return function(val) {
        var s = '';
        if (Array.isArray(val)) {
            for (var i=0;i<val.length;i++) {
                s = s + parseInt(val[i],0)+ "MHz ";
            }
        }
        return s;
    };
});

mm.filter('cputemps', function(){
    'use strict';
    return function(val) {
        var s = '';
        if (Array.isArray(val)) {
            for (var i=0;i<val.length;i++) {
                s = s + parseInt(val[i],0)+ "°C ";
            }
        }
        return s;
    };
});



mm.directive('ngX', function() {
    'use strict';
    return function(scope, elem, attrs) {
            attrs.$observe('ngX', function(x) {
                elem.attr('x', x);
            });
        };
    })
    .directive('ngY', function() {
        'use strict';
        return function(scope, elem, attrs) {
            attrs.$observe('ngY', function(y) {
                elem.attr('y', y);
            });
        };
    })
    .directive('ngWidth', function() {
        'use strict';
        return function(scope, elem, attrs) {
            attrs.$observe('ngWidth', function(width) {
                elem.attr('width', width);
            });
        };
    })
    .directive('ngHeight', function() {
        'use strict';
        return function(scope, elem, attrs) {
            attrs.$observe('ngHeight', function(height) {
                elem.attr('height', height);
            });
        };
    });
