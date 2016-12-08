define(["angular", "Q", "services", "repositories", "consumers", "hustleModule", "configureRequestInterceptor", "cleanupPayloadInterceptor", "handleTimeoutInterceptor", "properties", "queueInterceptor", "monitors", "logRequestReponseInterceptor", "indexedDBLogger", "platformUtils", "factories", "angular-indexedDB", "ng-i18n"],
    function(angular, Q, services, repositories, consumers, hustleModule, configureRequestInterceptor, cleanupPayloadInterceptor, handleTimeoutInterceptor, properties, queueInterceptor, monitors, logRequestReponseInterceptor, indexedDBLogger, platformUtils, factories) {
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
            app.factory('queueInterceptor', ['$log', 'ngI18nResourceBundle', 'dataRepository','dataSyncFailureRepository', 'hustleMonitor', queueInterceptor]);

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

            app.run(['consumerRegistry', 'dhisMonitor', 'hustleMonitor', 'queueInterceptor', '$hustle', '$log', '$rootScope', 'systemSettingRepository',

                function(consumerRegistry, dhisMonitor, hustleMonitor, queueInterceptor, $hustle, $log, $rootScope, systemSettingRepository) {

                    $hustle.registerInterceptor(queueInterceptor);

                    var metadataSync = function() {
                        if (!dhisMonitor.isOnline())
                            return;

                        $hustle.publishOnce({
                            "type": "downloadMetadata",
                            "data": [],
                            "locale": "en"
                        }, "dataValues");

                    };

                    var projectDataSync = function() {
                        if (!dhisMonitor.isOnline())
                            return;

                        $hustle.publishOnce({
                            "type": "downloadProjectData",
                            "data": [],
                            "locale": "en"
                        }, "dataValues");
                    };

                    var startConsumers = function() {
                        $log.info("Starting all hustle consumers");
                        consumerRegistry.startAllConsumers();
                    };

                    var stopConsumers = function() {
                        $log.info("Stopping all hustle consumers");
                        consumerRegistry.stopAllConsumers();
                    };

                    var checkOnlineStatusAndSync = function() {
                        dhisMonitor.online(startConsumers);
                        dhisMonitor.offline(stopConsumers);

                        dhisMonitor.start()
                            .then(metadataSync)
                            .then(projectDataSync);
                    };

                    var setupAlarms = function() {
                        platformUtils.createAlarm('metadataSyncAlarm', {
                            periodInMinutes: properties.metadata.sync.intervalInMinutes
                        });

                        platformUtils.createAlarm('projectDataSyncAlarm', {
                            periodInMinutes: properties.projectDataSync.intervalInMinutes
                        });
                    };

                    platformUtils.addListener("productKeyDecrypted", function() {
                        systemSettingRepository.loadProductKey().then(function() {
                            setupAlarms();
                            consumerRegistry.register()
                                .then(checkOnlineStatusAndSync);
                        });
                    });

                    platformUtils.addListener("productKeyExpired", function() {
                        dhisMonitor.stop();
                    });

                    platformUtils.addListener('online', dhisMonitor.start);
                    platformUtils.addListener('offline', dhisMonitor.stop);

                    platformUtils.addAlarmListener("metadataSyncAlarm", metadataSync);
                    platformUtils.addAlarmListener("projectDataSyncAlarm", projectDataSync);
                    platformUtils.addAlarmListener("dhisConnectivityCheckAlarm", dhisMonitor.checkNow);

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