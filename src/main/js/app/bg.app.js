define(["angular", "Q", "services", "repositories", "consumers", "hustleModule", "httpInterceptor", "properties", "failureStrategyFactory", "monitors", "angular-indexedDB"],
    function(angular, Q, services, repositories, consumers, hustleModule, httpInterceptor, properties, failureStrategyFactory, monitors) {
        var init = function() {
            var app = angular.module('DHIS2', ["xc.indexedDB", "hustle"]);
            services.init(app);
            consumers.init(app);
            repositories.init(app);
            monitors.init(app);


            app.factory('httpInterceptor', ['$rootScope', '$q', httpInterceptor]);
            app.config(['$indexedDBProvider', '$httpProvider', '$hustleProvider',
                function($indexedDBProvider, $httpProvider, $hustleProvider) {
                    $indexedDBProvider.connection('msf');
                    $httpProvider.interceptors.push('httpInterceptor');
                    $hustleProvider.init("hustle", 1, ["dataValues"], failureStrategyFactory);
                }
            ]);

            app.run(['metadataService', 'consumerRegistry', 'dhisMonitor', '$hustle',
                function(metadataService, consumerRegistry, dhisMonitor, $hustle) {

                    var registerCallback = function(alarmName, callback) {
                        return function(alarm) {
                            if (alarm.name === alarmName)
                                callback();
                        };
                    };

                    var metadataSync = function() {
                        if (!dhisMonitor.isOnline())
                            return;

                        console.log("Starting metadata sync");

                        metadataService.sync();
                    };

                    var projectDataSync = function() {
                        if (!dhisMonitor.isOnline())
                            return;

                        console.log("Starting project data sync");

                        $hustle.publish({
                            "type": "downloadDataValues"
                        }, "dataValues");

                        $hustle.publish({
                            "type": "downloadApprovalData"
                        }, "dataValues");
                    };

                    chrome.alarms.create('metadataSyncAlarm', {
                        periodInMinutes: properties.metadata.sync.intervalInMinutes
                    });
                    chrome.alarms.onAlarm.addListener(registerCallback("metadataSyncAlarm", metadataSync));

                    chrome.alarms.create('projectDataSyncAlarm', {
                        periodInMinutes: properties.projectDataSync.intervalInMinutes
                    });
                    chrome.alarms.onAlarm.addListener(registerCallback("projectDataSyncAlarm", projectDataSync));

                    dhisMonitor.online(function() {
                        consumerRegistry.register();
                    });

                    dhisMonitor.offline(function() {
                        consumerRegistry.deregister();
                    });

                    dhisMonitor.start()
                        .then(metadataSync)
                        .then(projectDataSync);
                }
            ]);

            return app;
        };

        var bootstrap = function(appInit) {
            var deferred = Q.defer();
            var injector = angular.bootstrap(angular.element(document.querySelector('#dhis2')), ['DHIS2']);
            deferred.resolve([injector, appInit]);
            console.debug("bootstrapping background app");
            return deferred.promise;
        };

        return {
            init: init,
            bootstrap: bootstrap
        };
    });