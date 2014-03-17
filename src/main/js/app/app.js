define(["angular", "Q", "services", "directives", "controllers", "migrator", "migrations", "some", "angular-route", "ng-i18n", "angular-indexedDB"],
    function(angular, Q, services, directives, controllers, migrator, migrations, some) {
        var init = function() {
            var app = angular.module('DHIS2', ["ngI18n", "ngRoute", "xc.indexedDB"]);
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
            app.run(['metadataSyncService',
                function(metadataSyncService) {
                    metadataSyncService.sync(some.some);
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