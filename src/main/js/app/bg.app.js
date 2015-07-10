define(["angular", "Q", "services", "repositories", "consumers", "hustleModule", "configureRequestInterceptor", "cleanupPayloadInterceptor", "handleTimeoutInterceptor", "properties", "queuePostProcessInterceptor", "monitors", "logRequestReponseInterceptor", "indexedDBLogger", "chromeUtils", "angular-indexedDB", "ng-i18n"],
    function(angular, Q, services, repositories, consumers, hustleModule, configureRequestInterceptor, cleanupPayloadInterceptor, handleTimeoutInterceptor, properties, queuePostProcessInterceptor, monitors, logRequestReponseInterceptor, indexedDBLogger, chromeUtils) {
        var init = function() {
            var app = angular.module('DHIS2', ["xc.indexedDB", "hustle", "ngI18n"]);
            services.init(app);
            consumers.init(app);
            repositories.init(app);
            monitors.init(app);

            app.factory('configureRequestInterceptor', ['$rootScope', configureRequestInterceptor]);
            app.factory('cleanupPayloadInterceptor', [cleanupPayloadInterceptor]);
            app.factory('handleTimeoutInterceptor', ['$q', handleTimeoutInterceptor]);
            app.factory('logRequestReponseInterceptor', ['$log', '$q', logRequestReponseInterceptor]);
            app.factory('queuePostProcessInterceptor', ['$log', 'ngI18nResourceBundle', queuePostProcessInterceptor]);

            app.config(['$indexedDBProvider', '$httpProvider', '$hustleProvider', '$provide',
                function($indexedDBProvider, $httpProvider, $hustleProvider, $provide) {
                    $provide.decorator('$log', ['$delegate',
                        function(loggerDelegate) {
                            indexedDBLogger.configure("msfLogs", loggerDelegate);
                            return loggerDelegate;
                        }
                    ]);

                    $provide.decorator('$window', function($delegate) {
                        $delegate.history = null;
                        return $delegate;
                    });

                    $indexedDBProvider.connection('msf');
                    $httpProvider.interceptors.push('configureRequestInterceptor');
                    $httpProvider.interceptors.push('cleanupPayloadInterceptor');
                    $httpProvider.interceptors.push('handleTimeoutInterceptor');
                    $httpProvider.interceptors.push('logRequestReponseInterceptor');
                    $hustleProvider.init("hustle", 1, ["dataValues"]);
                }
            ]);

            app.value('ngI18nConfig', {
                defaultLocale: 'en',
                supportedLocales: ['en', 'fr', 'ar'],
                basePath: "/js/app/i18n"
            });

            app.run(['consumerRegistry', 'dhisMonitor', 'hustleMonitor', 'queuePostProcessInterceptor', '$hustle', '$log', '$rootScope',
                function(consumerRegistry, dhisMonitor, hustleMonitor, queuePostProcessInterceptor, $hustle, $log, $rootScope) {

                    $hustle.registerInterceptor(queuePostProcessInterceptor);

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
                            "type": "downloadPatientOriginDetails"
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

                    var checkOnlineStatusAndSync = function() {
                        dhisMonitor.online(function() {
                            $log.info("Starting all hustle consumers");
                            consumerRegistry.startAllConsumers();
                        });

                        dhisMonitor.offline(function() {
                            $log.info("Stopping all hustle consumers");
                            consumerRegistry.stopAllConsumers();
                        });

                        dhisMonitor.start()
                            .then(metadataSync)
                            .then(projectDataSync);
                    };

                    var setAuthHeader = function(result) {
                        if (!result || !result.auth_header) return;
                        $rootScope.auth_header = result.auth_header;
                        checkOnlineStatusAndSync();
                    };

                    hustleMonitor.start();

                    chrome.alarms.create('metadataSyncAlarm', {
                        periodInMinutes: properties.metadata.sync.intervalInMinutes
                    });
                    chrome.alarms.onAlarm.addListener(registerCallback("metadataSyncAlarm", metadataSync));

                    chrome.alarms.create('projectDataSyncAlarm', {
                        periodInMinutes: properties.projectDataSync.intervalInMinutes
                    });
                    chrome.alarms.onAlarm.addListener(registerCallback("projectDataSyncAlarm", projectDataSync));

                    chromeUtils.addListener("productKeyDecrypted", function() {
                        chromeUtils.getAuthHeader(setAuthHeader);
                    });

                    chromeUtils.addListener("productKeyExpired", function() {
                        dhisMonitor.stop();
                    });

                    consumerRegistry.register().then(function() {
                        chromeUtils.getAuthHeader(setAuthHeader);
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
