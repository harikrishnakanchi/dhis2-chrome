define(["angular", "Q", "services", "consumers", "hustleModule", "httpInterceptor", "properties", "angular-indexedDB"],
    function(angular, Q, services, consumers, hustleModule, httpInterceptor, properties) {
        var init = function() {
            var app = angular.module('DHIS2', ["xc.indexedDB", "hustle"]);
            services.init(app);
            consumers.init(app);

            app.factory('httpInterceptor', ['$rootScope', '$q', httpInterceptor]);
            app.config(['$indexedDBProvider', '$httpProvider', '$hustleProvider',
                function($indexedDBProvider, $httpProvider, $hustleProvider) {
                    $indexedDBProvider.connection('msf');
                    $httpProvider.interceptors.push('httpInterceptor');
                    $hustleProvider.init("hustle", 1, ["dataValues"]);
                }
            ]);

            var scheduleSync = function() {
                console.log("scheduling sync");
                chrome.alarms.create('metadataSyncAlarm', {
                    periodInMinutes: properties.metadata.sync.intervalInMinutes
                });
            };

            app.run(['dataService', 'metadataService', 'registerConsumers',
                function(dataService, metadataService, registerConsumers) {
                    console.log("dB migration complete. Starting sync");
                    if (navigator.onLine) {
                        metadataService.sync().
                        finally(scheduleSync);
                    }
                    // dataService.downloadAllData("c484c99b86d");
                    var registerCallback = function(alarmName, callback) {
                        return function(alarm) {
                            if (alarm.name === alarmName)
                                callback();
                        };
                    };
                    if (chrome.alarms) {
                        chrome.alarms.onAlarm.addListener(registerCallback("metadataSyncAlarm", metadataService.sync));
                    }
                    registerConsumers.run();
                }
            ]);

            return app;
        };

        var bootstrap = function(app) {
            var deferred = Q.defer();
            var injector = angular.bootstrap(angular.element(document.querySelector('#dhis2')), ['DHIS2']);
            deferred.resolve([injector, app]);
            console.debug("bootstrapping background app");
            return deferred.promise;
        };

        return {
            init: init,
            bootstrap: bootstrap
        };
    });