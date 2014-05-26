define(["angular", "Q", "services", "repositories", "consumers", "hustleModule", "httpInterceptor", "properties", "angular-indexedDB"],
    function(angular, Q, services, repositories, consumers, hustleModule, httpInterceptor, properties) {
        var init = function() {
            var app = angular.module('DHIS2', ["xc.indexedDB", "hustle"]);
            services.init(app);
            consumers.init(app);
            repositories.init(app);

            app.factory('httpInterceptor', ['$rootScope', '$q', httpInterceptor]);
            app.config(['$indexedDBProvider', '$httpProvider', '$hustleProvider',
                function($indexedDBProvider, $httpProvider, $hustleProvider) {
                    $indexedDBProvider.connection('msf');
                    $httpProvider.interceptors.push('httpInterceptor');
                    $hustleProvider.init("hustle", 1, ["dataValues"]);
                }
            ]);

            app.run(['metadataService', 'consumerRegistry', '$hustle',
                function(metadataService, consumerRegistry, $hustle) {
                    console.log("dB migration complete. Starting sync");

                    var scheduleSync = function() {
                        console.log("scheduling sync");
                        chrome.alarms.create('metadataSyncAlarm', {
                            periodInMinutes: properties.metadata.sync.intervalInMinutes
                        });

                        chrome.alarms.create('dataValuesSyncAlarm', {
                            periodInMinutes: properties.dataValues.sync.intervalInMinutes
                        });
                    };

                    var startSyncAndRegisterConsumers = function() {
                        metadataService.sync().then(downloadDataValues).
                        finally(scheduleSync);
                        consumerRegistry.register();
                    };
                    var registerCallback = function(alarmName, callback) {
                        return function(alarm) {
                            if (alarm.name === alarmName)
                                callback();
                        };
                    };

                    var downloadDataValues = function() {
                        $hustle.publish({
                            "type": "download"
                        }, "dataValues");
                    };

                    if (navigator.onLine) {
                        startSyncAndRegisterConsumers();
                    }

                    if (chrome.alarms) {
                        chrome.alarms.onAlarm.addListener(registerCallback("metadataSyncAlarm", metadataService.sync));
                        chrome.alarms.onAlarm.addListener(registerCallback("dataValuesSyncAlarm", downloadDataValues));
                    }

                    window.addEventListener('online', function(e) {
                        console.log("You are online.");
                        startSyncAndRegisterConsumers();
                    });

                    window.addEventListener('offline', function() {
                        console.log("You are offline. Stopping Sync.");
                        chrome.alarms.clear('metadataSyncAlarm');
                        chrome.alarms.clear('dataValuesSyncAlarm');
                        consumerRegistry.deregister();
                    });
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