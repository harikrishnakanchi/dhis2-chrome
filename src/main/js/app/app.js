define(["angular", "Q", "services", "directives", "dbutils", "controllers", "repositories", "factories", "migrator", "migrations", "properties", "queuePostProcessInterceptor", "monitors", "helpers", "indexedDBLogger", "authenticationUtils", "transformers",
        "angular-route", "ng-i18n", "angular-indexedDB", "hustleModule", "angular-ui-tabs", "angular-ui-accordion", "angular-ui-collapse", "angular-ui-transition", "angular-ui-weekselector",
        "angular-treeview", "angular-ui-modal", "angular-multiselect", "angular-ui-notin", "angular-ui-equals", "angular-ui-dropdown", "angular-filter", "angucomplete-alt", "angular-nvd3", "angular-ui-tooltip",
        "angular-ui-bindHtml", "angular-ui-position", "angular-sanitize", "ng-csv"

    ],
    function(angular, Q, services, directives, dbutils, controllers, repositories, factories, migrator, migrations, properties, queuePostProcessInterceptor, monitors, helpers, indexedDBLogger, authenticationUtils, transformers) {
        var init = function() {
            var app = angular.module('DHIS2', ["ngI18n", "ngRoute", "xc.indexedDB", "ui.bootstrap.tabs", "ui.bootstrap.transition", "ui.bootstrap.collapse",
                "ui.bootstrap.accordion", "ui.weekselector", "angularTreeview", "ui.bootstrap.modal", "ui.bootstrap.dropdown",
                "ui.multiselect", "ui.notIn", "ui.equals", "hustle", "angular.filter", "angucomplete-alt", "nvd3", "ui.bootstrap.tooltip", "ui.bootstrap.position", "ui.bootstrap.bindHtml",
                "ngSanitize", "ngCsv"
            ]);

            services.init(app);
            repositories.init(app);
            factories.init(app);
            monitors.init(app);
            helpers.init(app);
            dbutils.init(app);
            controllers.init(app);
            directives.init(app);
            transformers.init(app);

            app.factory('queuePostProcessInterceptor', ['$log', 'ngI18nResourceBundle', queuePostProcessInterceptor]);

            app.config(['$routeProvider', '$indexedDBProvider', '$httpProvider', '$hustleProvider', '$compileProvider', '$provide', '$tooltipProvider',
                function($routeProvider, $indexedDBProvider, $httpProvider, $hustleProvider, $compileProvider, $provide, $tooltipProvider) {
                    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
                    $routeProvider.
                    when('/', {
                        templateUrl: 'templates/init.html'
                    }).
                    when('/dashboard', {
                        templateUrl: 'templates/dashboard.html'
                    }).
                    when('/selectProjectPreference', {
                        templateUrl: 'templates/selectProjectPreference.html',
                        controller: 'selectProjectPreferenceController'
                    }).
                    when('/reports/:orgUnit?', {
                        templateUrl: 'templates/reports.html',
                        controller: 'reportsController'
                    }).
                    when('/projectReport/', {
                        templateUrl: 'templates/project-report.html',
                        controller: 'projectReportController'
                    }).
                    when('/login', {
                        templateUrl: 'templates/login.html',
                        controller: 'loginController'
                    }).
                    when('/orgUnits', {
                        templateUrl: 'templates/orgunits.html',
                        controller: 'orgUnitContoller'
                    }).
                    when('/notifications', {
                        templateUrl: 'templates/notifications.html',
                        controller: 'notificationsController'
                    }).
                    when('/productKeyPage', {
                        templateUrl: 'templates/product-key.html',
                        controller: 'productKeyController'
                    }).
                    when('/aggregate-data-entry/:module?/:week?', {
                        templateUrl: 'templates/aggregate-data-entry.html',
                        controller: 'aggregateDataEntryController'
                    }).
                    when('/line-list-summary/:module/:filterBy?', {
                        templateUrl: 'templates/line-list-summary.html',
                        controller: 'lineListSummaryController'
                    }).
                    when('/line-list-data-entry/:module/new', {
                        templateUrl: 'templates/line-list-data-entry.html',
                        controller: 'lineListDataEntryController'
                    }).
                    when('/line-list-data-entry/:module/:eventId?', {
                        templateUrl: 'templates/line-list-data-entry.html',
                        controller: 'lineListDataEntryController'
                    }).
                    when('/data-approval/:module?/:week?', {
                        templateUrl: 'templates/data-approval.html',
                        controller: 'dataApprovalController'
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

                    $provide.decorator('$window', function($delegate) {
                        Object.defineProperty($delegate, 'history', {
                            get: function() {
                                return null;
                            }
                        });
                        return $delegate;
                    });

                    $indexedDBProvider.connection('msf')
                        .upgradeDatabase(migrations.length, function(event, db, tx) {
                            migrator.run(event.oldVersion, db, tx, migrations);
                        });

                    $hustleProvider.init("hustle", 1, ["dataValues"]);

                    $tooltipProvider.setTriggers({
                        "click": "mouseleave"
                    });
                }
            ]);
            app.value('ngI18nConfig', {
                supportedLocales: ['en', 'fr', 'ar'],
                basePath: "/js/app/i18n"
            });

            app.run(['dhisMonitor', 'hustleMonitor', 'queuePostProcessInterceptor', '$rootScope', '$location', '$hustle', '$document', 'systemSettingRepository', 'translationsService',
                function(dhisMonitor, hustleMonitor, queuePostProcessInterceptor, $rootScope, $location, $hustle, $document, systemSettingRepository, translationsService) {

                    $document.on('keydown', function(e) {
                        disableBackspaceKey(e);
                    });

                    $hustle.registerInterceptor(queuePostProcessInterceptor);

                    $rootScope.$on('$locationChangeStart', function(e, newUrl, oldUrl) {
                        if (authenticationUtils.shouldRedirectToLogin($rootScope, $location)) {
                            $location.path("/login");
                        }
                    });

                    $rootScope.isDhisOnline = false;
                    $rootScope.msgInQueue = false;

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

                    hustleMonitor.msgInSyncQueue(function() {
                        $rootScope.$apply(function() {
                            $rootScope.msgInQueue = true;
                        });
                    });

                    hustleMonitor.noMsgInSyncQueue(function() {
                        $rootScope.$apply(function() {
                            $rootScope.msgInQueue = false;
                        });
                    });

                    systemSettingRepository.loadProductKey();

                    $rootScope.setLocale = function(locale) {
                        translationsService.setLocale(locale);
                        $rootScope.locale = locale;

                        $rootScope.layoutDirection = locale == 'ar' ? { 'direction': 'rtl' } : {};
                    };

                    systemSettingRepository.getLocale().then($rootScope.setLocale);

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
