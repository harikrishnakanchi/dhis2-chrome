define(["angular", "Q", "services", "directives", "controllers", "angular-route", "ng-i18n"],
    function(angular, Q, services, directives, controllers) {
        var init = function(db) {
            var app = angular.module('DHIS2', ["ngI18n", "ngRoute"]);
            services.init(app);
            directives.init(app);
            controllers.init(app);
            app.value('db', db);
            app.config(['$routeProvider',
                function($routeProvider) {
                    $routeProvider.
                    when('/dashboard', {
                        templateUrl: '/templates/dashboard.html',
                        controller: 'dashboardController'
                    }).
                    otherwise({
                        redirectTo: '/dashboard'
                    });
                }
            ]);
            app.value('ngI18nConfig', {
                defaultLocale: 'en',
                supportedLocales: ['en', 'es'],
                basePath: "/js/app/i18n"
            });
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