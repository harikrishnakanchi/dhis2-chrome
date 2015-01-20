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

            app.run(['metadataService', 'consumerRegistry', '$hustle',
                function(metadataService, consumerRegistry, $hustle) {
                    var syncWithDhis = function() {
                        var doPublish = function(messageType) {
                            $hustle.publish({
                                "type": messageType,
                                "data": [],
                                "requestId": 0
                            }, "dataValues");
                        };

                        console.log("Starting metadata sync");
                        doPublish("downloadMetadata");
                        doPublish("downloadOrgUnit");
                        doPublish("downloadOrgUnitGroups");

                        console.log("Starting project data sync");
                        doPublish("downloadData");
                        doPublish("downloadEventData");
                    };

                    console.log("Registering hustle consumers");
                    consumerRegistry.register().then(function() {
                        consumerRegistry.startAllConsumers();
                    });

                    syncWithDhis();
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
