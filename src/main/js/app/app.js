define(["angular", "Q", "services", "dbutils", "controllers", "repositories", "migrator", "migrations", "properties", "queuePostProcessInterceptor", "monitors", "helpers", "indexedDBLogger",
        "angular-route", "ng-i18n", "angular-indexedDB", "hustleModule", "angular-ui-tabs", "angular-ui-accordion", "angular-ui-collapse", "angular-ui-transition", "angular-ui-weekselector",
        "angular-treeview", "angular-ui-modal", "angular-multiselect", "angular-ui-notin", "angular-ui-equals", "angular-ui-dropdown", "angular-autocomplete"
    ],
    function(angular, Q, services, dbutils, controllers, repositories, migrator, migrations, properties, queuePostProcessInterceptor, monitors, helpers, indexedDBLogger) {
        var init = function() {
            var app = angular.module('DHIS2', ["ngI18n", "ngRoute", "xc.indexedDB", "ui.bootstrap.tabs", "ui.bootstrap.transition", "ui.bootstrap.collapse",
                "ui.bootstrap.accordion", "ui.weekselector", "angularTreeview", "ui.bootstrap.modal", "ui.bootstrap.dropdown",
                "ui.multiselect", "ui.notIn", "ui.equals", "hustle", "autocomplete"
            ]);
            services.init(app);
            repositories.init(app);
            monitors.init(app);
            helpers.init(app);
            dbutils.init(app);
            controllers.init(app);

            app.factory('queuePostProcessInterceptor', ['$log', 'ngI18nResourceBundle', queuePostProcessInterceptor]);

            app.config(['$routeProvider', '$indexedDBProvider', '$httpProvider', '$hustleProvider', '$compileProvider', '$provide',
                function($routeProvider, $indexedDBProvider, $httpProvider, $hustleProvider, $compileProvider, $provide) {
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
                    when('/productKeyPage', {
                        templateUrl: 'templates/product-key.html',
                        controller: 'productKeyController'
                    }).
                    otherwise({
                        redirectTo: '/dashboard'
                    });

                    $provide.decorator('$log', ['$delegate',
                        function(loggerDelegate) {
                            indexedDBLogger.configure("msfLogs", loggerDelegate);
                            return loggerDelegate;
                        }
                    ]);

                    $indexedDBProvider.connection('msf')
                        .upgradeDatabase(migrations.length, function(event, db, tx) {
                            migrator.run(event.oldVersion, db, tx, migrations);
                        }).dbReady(function(data) {
                            if (chrome.runtime)
                                chrome.runtime.sendMessage("migrationComplete");
                        });

                    $hustleProvider.init("hustle", 1, ["dataValues"]);
                }
            ]);
            app.value('ngI18nConfig', {
                defaultLocale: 'en',
                supportedLocales: ['en', 'fr', 'ar'],
                basePath: "/js/app/i18n"
            });

            app.run(['dhisMonitor', 'queuePostProcessInterceptor', '$rootScope', '$location', '$hustle', '$document',
                function(dhisMonitor, queuePostProcessInterceptor, $rootScope, $location, $hustle, $document) {

                    $document.on('keydown', function(e) {
                        disableBackspaceKey(e);
                    });

                    $hustle.registerInterceptor(queuePostProcessInterceptor);

                    $rootScope.$on('$locationChangeStart', function(e, newUrl, oldUrl) {
                        if (!$rootScope.isLoggedIn && $rootScope.auth_header) {
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

        var disableBackspaceKey = function(event) {
            var shouldPrevent = false;

            if (event.keyCode === 8) {
                var srcElement = event.srcElement || event.target;
                if (srcElement.tagName.toUpperCase() === "INPUT" || srcElement.tagName.toUpperCase() === "TEXTAREA") {
                    shouldPrevent = srcElement.readOnly || srcElement.disabled;
                } else {
                    shouldPrevent = true;
                }
            }

            if (shouldPrevent) {
                event.preventDefault();
            }
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
