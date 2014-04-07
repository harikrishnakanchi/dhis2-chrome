define(["angular", "Q", "services", "directives", "controllers", "migrator", "migrations",
        "angular-route", "ng-i18n", "angular-indexedDB", "angular-ui-tabs", "angular-ui-accordion", "angular-ui-collapse", "angular-ui-transition", "angular-ui-weekselector"
    ],
    function(angular, Q, services, directives, controllers, migrator, migrations) {
        var init = function() {
            var app = angular.module('DHIS2', ["ngI18n", "ngRoute", "xc.indexedDB", "ui.bootstrap.tabs", "ui.bootstrap.transition", "ui.bootstrap.collapse", "ui.bootstrap.accordion", "ui.weekselector"]);
            services.init(app);
            directives.init(app);
            controllers.init(app);
            app.config(['$routeProvider', '$indexedDBProvider',
                function($routeProvider, $indexedDBProvider) {
                    $routeProvider.
                    when('/dashboard', {
                        templateUrl: '/templates/dashboard.html',
                        controller: 'dashboardController'
                    }).
                    when('/data-entry', {
                        templateUrl: '/templates/data-entry.html',
                        controller: 'dataEntryController'
                    }).
                    otherwise({
                        redirectTo: '/dashboard'
                    });

                    $indexedDBProvider.connection('msf')
                        .upgradeDatabase(migrations.length, function(event, db, tx) {
                            migrator.run(event.oldVersion, db, tx, migrations);
                        });
                }
            ]);
            app.value('ngI18nConfig', {
                defaultLocale: 'en',
                supportedLocales: ['en', 'es'],
                basePath: "/js/app/i18n"
            });
            app.run(['metadataService',
                function(metadataService) {
                    metadataService.loadMetadata();
                }
            ]);
            return app;
        };

        var bootstrap = function(app) {
            var deferred = Q.defer();
            var injector = angular.bootstrap(angular.element(document.querySelector('#dhis2')), ['DHIS2']);
            deferred.resolve([injector, app]);
            return deferred.promise;
        };

        return {
            init: init,
            bootstrap: bootstrap
        };
    });