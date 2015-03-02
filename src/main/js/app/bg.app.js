define(["angular", "Q", "services", "repositories", "consumers", "hustleModule", "configureRequestInterceptor", "cleanupPayloadInterceptor", "handleTimeoutInterceptor", "properties", "failureStrategyFactory", "monitors", "angular-indexedDB"],
    function(angular, Q, services, repositories, consumers, hustleModule, configureRequestInterceptor, cleanupPayloadInterceptor, handleTimeoutInterceptor, properties, failureStrategyFactory, monitors) {
        var init = function() {
            var app = angular.module('DHIS2', ["xc.indexedDB", "hustle"]);
            services.init(app);
            consumers.init(app);
            repositories.init(app);
            monitors.init(app);


            app.factory('configureRequestInterceptor', [configureRequestInterceptor]);
            app.factory('cleanupPayloadInterceptor', [cleanupPayloadInterceptor]);
            app.factory('handleTimeoutInterceptor', ['$q', handleTimeoutInterceptor]);

            app.config(['$indexedDBProvider', '$httpProvider', '$hustleProvider',
                function($indexedDBProvider, $httpProvider, $hustleProvider) {
                    $indexedDBProvider.connection('msf');
                    $httpProvider.interceptors.push('configureRequestInterceptor');
                    $httpProvider.interceptors.push('cleanupPayloadInterceptor');
                    $httpProvider.interceptors.push('handleTimeoutInterceptor');

                    $hustleProvider.init("hustle", 1, ["dataValues"], failureStrategyFactory);
                }
            ]);

            app.run(['consumerRegistry', 'dhisMonitor', '$hustle',
                function(consumerRegistry, dhisMonitor, $hustle) {

                    var registerCallback = function(alarmName, callback) {
                        return function(alarm) {
                            if (alarm.name === alarmName)
                                callback();
                        };
                    };

                    var metadataSync = function() {
                        if (!dhisMonitor.isOnline())
                            return;

                        $hustle.publish({
                            "type": "downloadMetadata"
                        }, "dataValues");

                        $hustle.publish({
                            "type": "downloadSystemSetting"
                        }, "dataValues");

                        $hustle.publish({
                            "type": "downloadOrgUnit",
                            "data": []
                        }, "dataValues");

                        $hustle.publish({
                            "type": "downloadOrgUnitGroups",
                            "data": []
                        }, "dataValues");

                        $hustle.publish({
                            "type": "downloadProgram",
                            "data": []
                        }, "dataValues");

                        $hustle.publish({
                            "type": "downloadDatasets",
                            "data": []
                        }, "dataValues");
                    };

                    var projectDataSync = function() {
                        if (!dhisMonitor.isOnline())
                            return;

                        $hustle.publish({
                            "type": "downloadData"
                        }, "dataValues");

                        $hustle.publish({
                            "type": "downloadEventData"
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

                    console.log("Registering hustle consumers");
                    consumerRegistry.register().then(function() {

                        dhisMonitor.online(function() {
                            console.log("Starting all hustle consumers");
                            consumerRegistry.startAllConsumers();
                        });

                        dhisMonitor.offline(function() {
                            console.log("Stopping all hustle consumers");
                            consumerRegistry.stopAllConsumers();
                        });

                        dhisMonitor.start()
                            .then(metadataSync)
                            .then(projectDataSync);
                    });
                }
            ]);

            return app;
        };

        var bootstrap = function(appInit) {
            var deferred = Q.defer();
            var injector = angular.bootstrap(angular.element(document.querySelector('#dhis2')), ['DHIS2']);
            deferred.resolve([injector, appInit]);
            return deferred.promise;
        };

        return {
            init: init,
            bootstrap: bootstrap
        };
    });
