define(["angular", "Q", "services", "directives", "controllers", "migrator", "migrations", "properties", "httpInterceptor",
        "angular-route", "ng-i18n", "angular-indexedDB", "angular-ui-tabs", "angular-ui-accordion", "angular-ui-collapse", "angular-ui-transition", "angular-ui-weekselector",
        "angular-treeview", "angular-ui-modal", "angular-ui-position", "angular-ui-datepicker", "angular-multiselect", "angular-ui-notin", "angular-ui-equals"
    ],
    function(angular, Q, services, directives, controllers, migrator, migrations, properties, httpInterceptor) {
        var init = function() {
            var app = angular.module('DHIS2', ["ngI18n", "ngRoute", "xc.indexedDB", "ui.bootstrap.tabs", "ui.bootstrap.transition", "ui.bootstrap.collapse",
                "ui.bootstrap.accordion", "ui.weekselector", "angularTreeview", "ui.bootstrap.modal", "ui.bootstrap.position", "ui.bootstrap.datepicker",
                "ui.multiselect", "ui.notIn", "ui.equals"
            ]);
            services.init(app);
            directives.init(app);
            controllers.init(app);
            app.factory('httpInterceptor', ['$rootScope', '$q', httpInterceptor]);
            app.config(['$routeProvider', '$indexedDBProvider', '$httpProvider',
                function($routeProvider, $indexedDBProvider, $httpProvider) {
                    $routeProvider.
                    when('/dashboard', {
                        templateUrl: 'templates/dashboard.html',
                        controller: 'dashboardController'
                    }).
                    when('/login', {
                        templateUrl: 'templates/login.html',
                        controller: 'loginController'
                    }).
                    when('/data-entry', {
                        templateUrl: 'templates/data-entry.html',
                        controller: 'dataEntryController'
                    }).
                    when('/projects', {
                        templateUrl: 'templates/orgunits.html',
                        controller: 'orgUnitContoller'
                    }).
                    otherwise({
                        redirectTo: '/dashboard'
                    });

                    $indexedDBProvider.connection('msf')
                        .upgradeDatabase(migrations.length, function(event, db, tx) {
                            migrator.run(event.oldVersion, db, tx, migrations);
                        });

                    $httpProvider.interceptors.push('httpInterceptor');
                }
            ]);
            app.value('ngI18nConfig', {
                defaultLocale: 'en',
                supportedLocales: ['en', 'es'],
                basePath: "/js/app/i18n"
            });
            app.run(['metadataService', '$rootScope', '$location',
                function(metadataService, $rootScope, $location) {
                    metadataService.loadMetadata();
                    $rootScope.$on('$routeChangeStart', function(e, newUrl, oldUrl) {
                        if (!$rootScope.isLoggedIn) {
                            $location.path("/login");
                        }
                    });
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