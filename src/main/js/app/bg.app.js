define(["angular", "Q", "services", "repositories", "consumers", "hustleModule", "configureRequestInterceptor", "cleanupPayloadInterceptor", "handleTimeoutInterceptor", "properties", "queuePostProcessInterceptor", "monitors", "logRequestReponseInterceptor", "indexedDBLogger", "chromeUtils", "factories", "angular-indexedDB", "ng-i18n"],
    function(angular, Q, services, repositories, consumers, hustleModule, configureRequestInterceptor, cleanupPayloadInterceptor, handleTimeoutInterceptor, properties, queuePostProcessInterceptor, monitors, logRequestReponseInterceptor, indexedDBLogger, chromeUtils, factories) {
        var init = function() {
            var app = angular.module('PRAXIS', ["xc.indexedDB", "hustle", "ngI18n"]);
            services.init(app);
            factories.init(app);
            consumers.init(app);
            repositories.init(app);
            monitors.init(app);

            app.factory('configureRequestInterceptor', ['$rootScope', 'systemSettingRepository', configureRequestInterceptor]);
            app.factory('cleanupPayloadInterceptor', [cleanupPayloadInterceptor]);
            app.factory('handleTimeoutInterceptor', ['$q', '$injector', '$timeout', handleTimeoutInterceptor]);
            app.factory('logRequestReponseInterceptor', ['$log', '$q', logRequestReponseInterceptor]);
            app.factory('queuePostProcessInterceptor', ['$log', 'ngI18nResourceBundle', 'dataRepository','dataSyncFailureRepository', queuePostProcessInterceptor]);

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

                    var jobComparator = function (itemToBeCompared, itemComparedWith) {
                        var typeEquals = _.isEqual(itemComparedWith.type, itemToBeCompared.type);
                        var dataEquals = _.isEqual(itemComparedWith.data, itemToBeCompared.data);
                        return typeEquals && dataEquals;
                    };

                    $hustleProvider.init("hustle", 1, ["dataValues"], jobComparator);
                }
            ]);

            app.value('ngI18nConfig', {
                supportedLocales: ['en', 'fr', 'ar'],
                basePath: "/js/app/i18n"
            });

            app.run(['consumerRegistry', 'dhisMonitor', 'hustleMonitor', 'queuePostProcessInterceptor', '$hustle', '$log', '$rootScope', 'systemSettingRepository',

                function(consumerRegistry, dhisMonitor, hustleMonitor, queuePostProcessInterceptor, $hustle, $log, $rootScope, systemSettingRepository) {

                    $hustle.registerInterceptor(queuePostProcessInterceptor);

                    var metadataSync = function() {
                        if (!dhisMonitor.isOnline())
                            return;

                        $hustle.publishOnce({
                            "type": "downloadMetadata",
                            "data": []
                        }, "dataValues");

                    };

                    var projectDataSync = function() {
                        if (!dhisMonitor.isOnline())
                            return;

                        $hustle.publishOnce({
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
                        chromeUtils.createAlarm('metadataSyncAlarm', {
                            periodInMinutes: properties.metadata.sync.intervalInMinutes
                        });
                        chromeUtils.addAlarmListener("metadataSyncAlarm", metadataSync);

                        chromeUtils.createAlarm('projectDataSyncAlarm', {
                            periodInMinutes: properties.projectDataSync.intervalInMinutes
                        });
                        chromeUtils.addAlarmListener("projectDataSyncAlarm", projectDataSync);
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

                    systemSettingRepository.getPraxisUid()
                        .then(function (uid) {
                            $rootScope.praxisUid = uid;
                        });
                }
            ]);

            return app;
        };

        var bootstrap = function(appInit) {
            var deferred = Q.defer();
            var injector = angular.bootstrap(angular.element(document.querySelector('#praxis')), ['PRAXIS']);
            deferred.resolve([injector, appInit]);
            return deferred.promise;
        };


        return {
            init: init,
            bootstrap: bootstrap
        };
    });