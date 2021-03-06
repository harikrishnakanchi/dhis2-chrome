define(["angular", "Q", "services", "repositories", "consumers", "hustleModule", "configureRequestInterceptor", "cleanupPayloadInterceptor",
        "handleResponseErrorInterceptor", "properties", "queueInterceptor", "monitors", "logRequestReponseInterceptor", "indexedDBLogger",
        "platformUtils", "factories", "hustlePublishUtils", "angular-indexedDB", "ng-i18n"],
    function(angular, Q, services, repositories, consumers, hustleModule, configureRequestInterceptor, cleanupPayloadInterceptor,
             handleResponseErrorInterceptor, properties, queueInterceptor, monitors, logRequestReponseInterceptor, indexedDBLogger,
             platformUtils, factories, hustlePublishUtils) {
        var init = function() {
            var app = angular.module('PRAXIS', ["xc.indexedDB", "hustle", "ngI18n"]);
            services.init(app);
            factories.init(app);
            consumers.init(app);
            repositories.init(app);
            monitors.init(app);

            app.factory('configureRequestInterceptor', ['$rootScope', 'systemSettingRepository', configureRequestInterceptor]);
            app.factory('cleanupPayloadInterceptor', [cleanupPayloadInterceptor]);
            app.factory('handleResponseErrorInterceptor', ['$q', '$injector', '$timeout', handleResponseErrorInterceptor]);
            app.factory('logRequestReponseInterceptor', ['$log', '$q', logRequestReponseInterceptor]);
            app.factory('queueInterceptor', ['$log', 'ngI18nResourceBundle', 'dataRepository','dataSyncFailureRepository', 'hustleMonitor', queueInterceptor]);

            app.config(['$indexedDBProvider', '$httpProvider', '$hustleProvider', '$provide',
                function($indexedDBProvider, $httpProvider, $hustleProvider, $provide) {
                    $provide.decorator('$log', ['$delegate',
                        function(loggerDelegate) {
                            indexedDBLogger.configure(properties.praxis.dbForLogs, loggerDelegate);
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

                    $indexedDBProvider.connection(properties.praxis.dbName);
                    $httpProvider.interceptors.push('configureRequestInterceptor');
                    $httpProvider.interceptors.push('cleanupPayloadInterceptor');
                    $httpProvider.interceptors.push('handleResponseErrorInterceptor');
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
                basePath: self.basePath + "js/app/i18n"
            });

            app.run(['consumerRegistry', 'dhisMonitor', 'hustleMonitor', 'queueInterceptor', '$hustle', '$log', '$rootScope','$q', 'systemSettingRepository',

                function(consumerRegistry, dhisMonitor, hustleMonitor, queueInterceptor, $hustle, $log, $rootScope, $q, systemSettingRepository) {

                    $rootScope.isBackgroundRunning = false;

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

                        hustlePublishUtils.publishDownloadProjectData($hustle, "en");
                    };

                    var startConsumers = function() {
                        $log.info("Starting all hustle consumers");
                        consumerRegistry.startConsumer();
                    };

                    var stopConsumers = function() {
                        $log.info("Stopping all hustle consumers");
                        consumerRegistry.stopConsumer();
                    };

                    var checkOnlineStatusAndSync = function () {
                        dhisMonitor.online(startConsumers);
                        dhisMonitor.offline(stopConsumers);

                        return dhisMonitor.resume()
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

                    var clearAlarms = function () {
                        platformUtils.clearAlarm('metadataSyncAlarm');
                        platformUtils.clearAlarm('projectDataSyncAlarm');
                    };

                    var startBgApp = function () {
                        if (!$rootScope.isBackgroundRunning) {
                            systemSettingRepository.isSyncOff().then(function (isOffline) {
                                if (isOffline) return $q.reject();
                                else $rootScope.isBackgroundRunning = true;
                            }).then(systemSettingRepository.loadProductKey)
                                .then(setupAlarms)
                                .then(checkOnlineStatusAndSync)
                                .catch(function () {
                                    $rootScope.isBackgroundRunning = false;
                                });
                        }
                    };

                    var stopBgApp = function () {
                        clearAlarms();
                        dhisMonitor.halt();
                        $rootScope.isBackgroundRunning = false;
                    };

                    platformUtils.addListener("startBgApp", _.debounce(startBgApp, 1000, {leading: true}));

                    platformUtils.addListener("stopBgApp", stopBgApp);

                    platformUtils.addListener("productKeyExpired", function() {
                        stopBgApp();
                    });

                    platformUtils.addListener('online', dhisMonitor.start);
                    platformUtils.addListener('offline', dhisMonitor.stop);

                    platformUtils.addAlarmListener("metadataSyncAlarm", metadataSync);
                    platformUtils.addAlarmListener("projectDataSyncAlarm", projectDataSync);
                    platformUtils.addAlarmListener("dhisConnectivityCheckAlarm", dhisMonitor.checkNow);

                    $hustle.rescueReservedItems(properties.queue.maxNumberOfTimesItemCanBeRescued,
                        properties.queue.minTimeInSecToIncrementItemRescuedCount);

                    consumerRegistry.register();

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