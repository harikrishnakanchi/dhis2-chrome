define(["angular", "Q", "services", "hustleInit", "angular-indexedDB"],
    function(angular, Q, services, hustleInit) {
        var init = function() {
            var app = angular.module('DHIS2', ["xc.indexedDB"]);
            services.init(app);
            // hustleInit.init();

            app.config(['$indexedDBProvider',
                function($indexedDBProvider) {
                    $indexedDBProvider.connection('msf');
                }
            ]);

            var scheduleSync = function() {
                console.log("scheduling sync");
                chrome.alarms.create('metadataSyncAlarm', {
                    periodInMinutes: properties.metadata.sync.intervalInMinutes
                });
            };

            app.run(['dataService', 'metadataService',
                function(dataService, metadataService) {
                    console.log("dB migration complete. Starting sync");
                    if (navigator.onLine) {
                        metadataService.sync().
                        finally(scheduleSync);
                    }
                    dataService.downloadAllData("c484c99b86d");
                    var registerCallback = function(alarmName, callback) {
                        return function(alarm) {
                            if (alarm.name === alarmName)
                                callback();
                        };
                    };

                    if (chrome.alarms) {
                        chrome.alarms.onAlarm.addListener(registerCallback("metadataSyncAlarm", metadataService.sync));
                    }
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