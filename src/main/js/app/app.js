define(["angular", "Q", "services", "directives", "controllers", "repositories", "migrator", "migrations", "properties", "httpInterceptor", "failureStrategyFactory", "monitors", "helpers",
        "angular-route", "ng-i18n", "angular-indexedDB", "hustleModule", "angular-ui-tabs", "angular-ui-accordion", "angular-ui-collapse", "angular-ui-transition", "angular-ui-weekselector",
        "angular-treeview", "angular-ui-modal", "angular-multiselect", "angular-ui-notin", "angular-ui-equals"
    ],
    function(angular, Q, services, directives, controllers, repositories, migrator, migrations, properties, httpInterceptor, failureStrategyFactory, monitors, helpers) {
        var init = function() {
            var app = angular.module('DHIS2', ["ngI18n", "ngRoute", "xc.indexedDB", "ui.bootstrap.tabs", "ui.bootstrap.transition", "ui.bootstrap.collapse",
                "ui.bootstrap.accordion", "ui.weekselector", "angularTreeview", "ui.bootstrap.modal",
                "ui.multiselect", "ui.notIn", "ui.equals", "hustle"
            ]);
            services.init(app);
            directives.init(app);
            controllers.init(app);
            repositories.init(app);
            monitors.init(app);
            helpers.init(app);

            app.factory('httpInterceptor', ['$rootScope', '$q', httpInterceptor]);
            app.config(['$routeProvider', '$indexedDBProvider', '$httpProvider', '$hustleProvider', '$compileProvider',
                function($routeProvider, $indexedDBProvider, $httpProvider, $hustleProvider, $compileProvider) {
                    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
                    $routeProvider.
                    when('/dashboard', {
                        templateUrl: 'templates/dashboard.html',
                        controller: 'dashboardController'
                    }).
                    when('/login', {
                        templateUrl: 'templates/login.html',
                        controller: 'loginController'
                    }).
                    when('/data-entry/:module?/:week?', {
                        templateUrl: 'templates/data-entry.html',
                        controller: 'dataEntryController'
                    }).
                    when('/projects', {
                        templateUrl: 'templates/orgunits.html',
                        controller: 'orgUnitContoller'
                    }).
                    when('/selectproject', {
                        templateUrl: 'templates/select.project.html',
                        controller: 'selectProjectController'
                    }).
                    otherwise({
                        redirectTo: '/dashboard'
                    });

                    $indexedDBProvider.connection('msf')
                        .upgradeDatabase(migrations.length, function(event, db, tx) {
                            migrator.run(event.oldVersion, db, tx, migrations);
                        }).dbReady(function(data) {
                            if (chrome.runtime) {
                                chrome.runtime.sendMessage("migrationComplete");
                            }
                        });

                    $hustleProvider.init("hustle", 1, ["dataValues"], failureStrategyFactory);
                    $httpProvider.interceptors.push('httpInterceptor');
                }
            ]);
            app.value('ngI18nConfig', {
                defaultLocale: 'en',
                supportedLocales: ['en', 'fr', 'ar'],
                basePath: "/js/app/i18n"
            });

            app.run(['dhisMonitor', '$rootScope', '$location',
                function(dhisMonitor, $rootScope, $location) {
                    $rootScope.$on('$locationChangeStart', function(e, newUrl, oldUrl) {
                        if (!$rootScope.isLoggedIn) {
                            $location.path("/login");
                        }
                    });

                    $rootScope.isDhisOnline = false;

                    dhisMonitor.online(function() {
                        $rootScope.$apply(function() {
                            $rootScope.isDhisOnline = true;
                        });
                    });
                    dhisMonitor.offline(function() {
                        $rootScope.$apply(function() {
                            $rootScope.isDhisOnline = false;
                        });
                    });

                    $rootScope.hasRoles = function(allowedRoles) {
                        if ($rootScope.currentUser === undefined)
                            return false;

                        return _.any($rootScope.currentUser.userCredentials.userRoles, function(userAuth) {
                            return _.contains(allowedRoles, userAuth.name);
                        });
                    };
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