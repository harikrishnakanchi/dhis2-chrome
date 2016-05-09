define(["angular", "Q", "services", "repositories", "consumers", "hustleModule", "configureRequestInterceptor", "cleanupPayloadInterceptor", "handleTimeoutInterceptor", "properties", "queuePostProcessInterceptor", "monitors", "logRequestReponseInterceptor", "indexedDBLogger", "chromeUtils", "angular-indexedDB", "ng-i18n"],
    function(angular, Q, services, repositories, consumers, hustleModule, configureRequestInterceptor, cleanupPayloadInterceptor, handleTimeoutInterceptor, properties, queuePostProcessInterceptor, monitors, logRequestReponseInterceptor, indexedDBLogger, chromeUtils) {
        var init = function() {
            var app = angular.module('DHIS2', ["xc.indexedDB", "hustle", "ngI18n"]);
            services.init(app);
            consumers.init(app);
            repositories.init(app);
            monitors.init(app);

            app.factory('configureRequestInterceptor', ['$rootScope', 'systemSettingRepository', configureRequestInterceptor]);
            app.factory('cleanupPayloadInterceptor', [cleanupPayloadInterceptor]);
            app.factory('handleTimeoutInterceptor', ['$q', '$injector', '$timeout', handleTimeoutInterceptor]);
            app.factory('logRequestReponseInterceptor', ['$log', '$q', logRequestReponseInterceptor]);
            app.factory('queuePostProcessInterceptor', ['$log', 'ngI18nResourceBundle', 'dataRepository', 'approvalDataRepository', queuePostProcessInterceptor]);

            app.config(['$indexedDBProvider', '$httpProvider', '$hustleProvider', '$provide',
                function($indexedDBProvider, $httpProvider, $hustleProvider, $provide) {
                    $provide.decorator('$log', ['$delegate',
                        function(loggerDelegate) {
                            indexedDBLogger.configure("msfLogs", loggerDelegate);
                            return loggerDelegate;
                        }
                    ]);

                    $provide.decorator('$window', function($delegate) {
                        Object.defineProperty($delegate, 'history', {
                            get: function() {
                                return null;
                            }
                        });
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

            app.run(['consumerRegistry', 'dhisMonitor', 'hustleMonitor', 'queuePostProcessInterceptor', '$hustle', '$log', '$rootScope', 'systemSettingRepository',

                function(consumerRegistry, dhisMonitor, hustleMonitor, queuePostProcessInterceptor, $hustle, $log, $rootScope, systemSettingRepository) {

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
                            "type": "downloadMetadata",
                            "data": []
                        }, "dataValues");

                    };

                    var projectDataSync = function() {
                        if (!dhisMonitor.isOnline())
                            return;

                        $hustle.publish({
                            "type": "downloadProjectData",
                            "data": []
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

                    var setupAlarms = function() {
                        chrome.alarms.create('metadataSyncAlarm', {
                            periodInMinutes: properties.metadata.sync.intervalInMinutes
                        });
                        chrome.alarms.onAlarm.addListener(registerCallback("metadataSyncAlarm", metadataSync));

                        chrome.alarms.create('projectDataSyncAlarm', {
                            periodInMinutes: properties.projectDataSync.intervalInMinutes
                        });
                        chrome.alarms.onAlarm.addListener(registerCallback("projectDataSyncAlarm", projectDataSync));
                    };

                    hustleMonitor.start();

                    chromeUtils.addListener("productKeyDecrypted", function() {
                        systemSettingRepository.loadProductKey().then(function() {
                            setupAlarms();
                            consumerRegistry.register()
                                .then(checkOnlineStatusAndSync);
                        });
                    });

                    chromeUtils.addListener("productKeyExpired", function() {
                        dhisMonitor.stop();
                    });

                    systemSettingRepository.isProductKeySet()
                        .then(systemSettingRepository.loadProductKey)
                        .then(function() {
                            setupAlarms();
                            $hustle.cleanupAbandonedItems()
                                .then(consumerRegistry.register)
                                .then(checkOnlineStatusAndSync);
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