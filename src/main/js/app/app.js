define(["angular", "Q", "services", "directives", "controllers", "migrator", "migrations", "properties",
        "angular-route", "ng-i18n", "angular-indexedDB", "angular-ui-tabs", "angular-ui-accordion", "angular-ui-collapse", "angular-ui-transition", "angular-ui-weekselector",
        "angular-treeview", "angular-ui-modal", "angular-ui-position", "angular-ui-datepicker"
    ],
    function(angular, Q, services, directives, controllers, migrator, migrations, properties) {
        var init = function() {
            var app = angular.module('DHIS2', ["ngI18n", "ngRoute", "xc.indexedDB", "ui.bootstrap.tabs", "ui.bootstrap.transition", "ui.bootstrap.collapse",
                "ui.bootstrap.accordion", "ui.weekselector", "angularTreeview", "ui.bootstrap.modal", "ui.bootstrap.position", "ui.bootstrap.datepicker"
            ]);
            services.init(app);
            directives.init(app);
            controllers.init(app);
            app.config(['$routeProvider', '$indexedDBProvider', '$httpProvider',
                function($routeProvider, $indexedDBProvider, $httpProvider) {
                    $routeProvider.
                    when('/dashboard', {
                        templateUrl: 'templates/dashboard.html',
                        controller: 'dashboardController'
                    }).
                    when('/data-entry', {
                        templateUrl: 'templates/data-entry.html',
                        controller: 'dataEntryController'
                    }).
                    when('/projects', {
                        templateUrl: 'templates/projects.html',
                        controller: 'projectsController'
                    }).
                    otherwise({
                        redirectTo: '/dashboard'
                    });

                    $indexedDBProvider.connection('msf')
                        .upgradeDatabase(migrations.length, function(event, db, tx) {
                            migrator.run(event.oldVersion, db, tx, migrations);
                        });

                    $httpProvider.interceptors.push(function() {
                        return {
                            'request': function(config) {
                                if (config.url.indexOf(properties.dhis.url) === 0) {
                                    config.headers.Authorization = properties.dhis.auth_header;
                                }
                                return config;
                            }
                        };
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