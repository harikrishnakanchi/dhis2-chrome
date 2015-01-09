define(["angular", "Q", "services", "repositories", "consumers", "hustleModule", "httpInterceptor", "properties", "failureStrategyFactory", "monitors", "migrator", "migrations", "angular-indexedDB"],
    function(angular, Q, services, repositories, consumers, hustleModule, httpInterceptor, properties, failureStrategyFactory, monitors, migrator, migrations) {
        var init = function() {
            var app = angular.module('DHIS2_TEST', ["xc.indexedDB", "hustle"]);
            services.init(app);
            consumers.init(app);
            repositories.init(app);
            monitors.init(app);

            app.factory('httpInterceptor', ['$rootScope', '$q', httpInterceptor]);
            app.config(['$indexedDBProvider', '$httpProvider', '$hustleProvider',
                function($indexedDBProvider, $httpProvider, $hustleProvider) {
                    $indexedDBProvider.connection('msf')
                        .upgradeDatabase(migrations.length, function(event, db, tx) {
                            migrator.run(event.oldVersion, db, tx, migrations);
                        }).dbReady(function(data) {
                            if (chrome.runtime) {
                                chrome.runtime.sendMessage("migrationComplete");
                            }
                        });
                    $hustleProvider.init("hustle", 1, ["dataValues"], failureStrategyFactory);

                    $httpProvider.defaults.useXDomain = true;
                    $httpProvider.defaults.headers.common = {
                        Accept: "application/json, text/plain, */*"
                    };
                    $httpProvider.defaults.headers.post = {
                        "Content-Type": "application/json;charset=utf-8"
                    };
                    $httpProvider.interceptors.push('httpInterceptor');
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

                        $hustle.publish({
                            "type": "downloadMetadata"
                        }, "dataValues");

                        $hustle.publish({
                            "type": "downloadOrgUnit",
                            "data": []
                        }, "dataValues");

                        $hustle.publish({
                            "type": "downloadOrgUnitGroups",
                            "data": []
                        }, "dataValues");
                    };

                    var projectDataSync = function() {
                        if (!dhisMonitor.isOnline())
                            return;

                        console.log("Starting project data sync");

                        $hustle.publish({
                            "type": "downloadData"
                        }, "dataValues");

                        $hustle.publish({
                            "type": "downloadEventData"
                        }, "dataValues");
                    };

                    console.log("Registering hustle consumers");
                    consumerRegistry.register().then(function() {
                        consumerRegistry.startAllConsumers();
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
            var injector = angular.bootstrap(document, ['DHIS2_TEST']);
            deferred.resolve([injector, appInit]);
            console.debug("bootstrapping background app");
            return deferred.promise;
        };

        return {
            init: init,
            bootstrap: bootstrap
        };
    });
