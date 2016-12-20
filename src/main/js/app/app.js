define(["angular", "Q", "services", "directives", "dbutils", "controllers", "repositories", "factories", "migrator", "migrations", "properties", "queueInterceptor", "monitors", "helpers", "indexedDBLogger", "transformers", "platformUtils",
        "angular-route", "ng-i18n", "angular-indexedDB", "hustleModule", "angular-ui-tabs", "angular-ui-accordion", "angular-ui-collapse", "angular-ui-transition", "angular-ui-weekselector",
        "angular-treeview", "angular-ui-modal", "angular-multiselect", "angular-ui-notin", "angular-ui-equals", "angular-ui-dropdown", "angular-filter", "angucomplete-alt", "angular-nvd3", "angular-ui-tooltip",
        "angular-ui-bindHtml", "angular-ui-position", "angular-sanitize"

    ],
    function(angular, Q, services, directives, dbutils, controllers, repositories, factories, migrator, migrations, properties, queueInterceptor, monitors, helpers, indexedDBLogger, transformers, platformUtils) {
        var init = function() {
            var app = angular.module('PRAXIS', ["ngI18n", "ngRoute", "xc.indexedDB", "ui.bootstrap.tabs", "ui.bootstrap.transition", "ui.bootstrap.collapse",
                "ui.bootstrap.accordion", "ui.weekselector", "angularTreeview", "ui.bootstrap.modal", "ui.bootstrap.dropdown",
                "ui.multiselect", "ui.notIn", "ui.equals", "hustle", "angular.filter", "angucomplete-alt", "nvd3", "ui.bootstrap.tooltip", "ui.bootstrap.position", "ui.bootstrap.bindHtml",
                "ngSanitize"
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

            app.factory('queueInterceptor', ['$log', 'ngI18nResourceBundle', 'dataRepository','dataSyncFailureRepository', 'hustleMonitor', queueInterceptor]);

            app.constant('USER_ROLES', {
                'DATA_ENTRY': 'Data entry user',
                'OBSERVER': 'Observer',
                'PROJECT_LEVEL_APPROVER': 'Project Level Approver',
                'COORDINATION_LEVEL_APPROVER': 'Coordination Level Approver',
                'PROJECT_ADMIN': 'Projectadmin',
                'SUPER_ADMIN': 'Superadmin'
            });

            app.config(['$routeProvider', '$indexedDBProvider', '$httpProvider', '$hustleProvider', '$compileProvider', '$provide', '$tooltipProvider', 'USER_ROLES',
                function($routeProvider, $indexedDBProvider, $httpProvider, $hustleProvider, $compileProvider, $provide, $tooltipProvider, USER_ROLES) {
                    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
                    $routeProvider.
                    when('/', {
                        templateUrl: 'templates/init.html',
                        data: {
                            allowedRoles: [USER_ROLES.DATA_ENTRY, USER_ROLES.OBSERVER, USER_ROLES.PROJECT_LEVEL_APPROVER,
                                USER_ROLES.COORDINATION_LEVEL_APPROVER,USER_ROLES.PROJECT_ADMIN, USER_ROLES.SUPER_ADMIN]
                        }
                    }).
                    when('/dashboard', {
                        templateUrl: 'templates/dashboard.html',
                        controller: 'dashboardController',
                        data: {
                            allowedRoles: [USER_ROLES.DATA_ENTRY, USER_ROLES.OBSERVER, USER_ROLES.PROJECT_LEVEL_APPROVER, USER_ROLES.COORDINATION_LEVEL_APPROVER]
                        }
                    }).
                    when('/selectProjectPreference', {
                        templateUrl: 'templates/selectProjectPreference.html',
                        controller: 'selectProjectPreferenceController',
                        data: {
                            allowedRoles: [USER_ROLES.PROJECT_ADMIN]
                        }
                    }).
                    when('/reports/:orgUnit?', {
                        templateUrl: 'templates/reports.html',
                        controller: 'reportsController',
                        data: {
                            allowedRoles: [USER_ROLES.DATA_ENTRY, USER_ROLES.OBSERVER, USER_ROLES.PROJECT_LEVEL_APPROVER, USER_ROLES.COORDINATION_LEVEL_APPROVER]
                        }
                    }).
                    when('/projectReport', {
                        templateUrl: 'templates/project-report.html',
                        controller: 'projectReportController',
                        data: {
                            allowedRoles: [USER_ROLES.DATA_ENTRY, USER_ROLES.OBSERVER, USER_ROLES.PROJECT_LEVEL_APPROVER, USER_ROLES.COORDINATION_LEVEL_APPROVER]
                        }
                    }).
                    when('/opUnitReport/:opUnit?', {
                        templateUrl: 'templates/opunit-report.html',
                        controller: 'opUnitReportController',
                        data: {
                            allowedRoles: [USER_ROLES.DATA_ENTRY, USER_ROLES.OBSERVER, USER_ROLES.PROJECT_LEVEL_APPROVER, USER_ROLES.COORDINATION_LEVEL_APPROVER]
                        }
                    }).
                    when('/login', {
                        templateUrl: 'templates/login.html',
                        controller: 'loginController',
                        data: {
                            allowedRoles: [USER_ROLES.DATA_ENTRY, USER_ROLES.OBSERVER, USER_ROLES.PROJECT_LEVEL_APPROVER,
                                USER_ROLES.COORDINATION_LEVEL_APPROVER,USER_ROLES.PROJECT_ADMIN, USER_ROLES.SUPER_ADMIN]
                        }
                    }).
                    when('/orgUnits', {
                        templateUrl: 'templates/orgunits.html',
                        controller: 'orgUnitContoller',
                        data: {
                            allowedRoles: [USER_ROLES.PROJECT_ADMIN, USER_ROLES.SUPER_ADMIN]
                        }
                    }).
                    when('/notifications', {
                        templateUrl: 'templates/notifications.html',
                        controller: 'notificationsController',
                        data: {
                            allowedRoles: [USER_ROLES.DATA_ENTRY, USER_ROLES.OBSERVER, USER_ROLES.PROJECT_LEVEL_APPROVER, USER_ROLES.COORDINATION_LEVEL_APPROVER]
                        }
                    }).
                    when('/productKeyPage', {
                        templateUrl: 'templates/product-key.html',
                        controller: 'productKeyController',
                        data: {
                            allowedRoles: [USER_ROLES.DATA_ENTRY, USER_ROLES.OBSERVER, USER_ROLES.PROJECT_LEVEL_APPROVER,
                                USER_ROLES.COORDINATION_LEVEL_APPROVER,USER_ROLES.PROJECT_ADMIN, USER_ROLES.SUPER_ADMIN]
                        }
                    }).
                    when('/aggregate-data-entry/:module?/:week?', {
                        templateUrl: 'templates/aggregate-data-entry.html',
                        controller: 'aggregateDataEntryController',
                        data: {
                            allowedRoles: [USER_ROLES.DATA_ENTRY]
                        }
                    }).
                    when('/line-list-summary/:module/:filterBy?', {
                        templateUrl: 'templates/line-list-summary.html',
                        controller: 'lineListSummaryController',
                        data: {
                            allowedRoles: [USER_ROLES.DATA_ENTRY, USER_ROLES.OBSERVER, USER_ROLES.PROJECT_LEVEL_APPROVER, USER_ROLES.COORDINATION_LEVEL_APPROVER]
                        }
                    }).
                    when('/line-list-data-entry/:module/new', {
                        templateUrl: 'templates/line-list-data-entry.html',
                        controller: 'lineListDataEntryController',
                        data: {
                            allowedRoles: [USER_ROLES.DATA_ENTRY]
                        }
                    }).
                    when('/line-list-data-entry/:module/:eventId?', {
                        templateUrl: 'templates/line-list-data-entry.html',
                        controller: 'lineListDataEntryController',
                        data: {
                            allowedRoles: [USER_ROLES.DATA_ENTRY]
                        }
                    }).
                    when('/data-approval/:module?/:week?', {
                        templateUrl: 'templates/data-approval.html',
                        controller: 'dataApprovalController',
                        data: {
                            allowedRoles: [USER_ROLES.PROJECT_LEVEL_APPROVER, USER_ROLES.COORDINATION_LEVEL_APPROVER, USER_ROLES.OBSERVER]
                        }
                    }).
                    otherwise({
                        redirectTo: '/login'
                    });

                    $provide.decorator('$log', ['$delegate',
                        function(loggerDelegate) {
                            indexedDBLogger.configure(properties.praxis.dbForLogs, loggerDelegate);
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

                    $indexedDBProvider.connection(properties.praxis.dbName)
                        .upgradeDatabase(migrations.length, function(event, db, tx) {
                            migrator.run(event.oldVersion, db, tx, migrations);
                        });

                    var jobComparator = function (itemToBeCompared, itemComparedWith) {
                        var typeEquals = _.isEqual(itemComparedWith.type, itemToBeCompared.type);
                        var dataEquals = _.isEqual(itemComparedWith.data, itemToBeCompared.data);
                        return typeEquals && dataEquals;
                    };

                    $hustleProvider.init("hustle", 1, ["dataValues"], jobComparator);

                    $tooltipProvider.setTriggers({
                        "click": "mouseleave"
                    });
                }
            ]);
            app.value('ngI18nConfig', {
                supportedLocales: ['en', 'fr', 'ar'],
                basePath: self.basePath + "js/app/i18n"
            });

            app.run(['dhisMonitor', 'hustleMonitor', 'queueInterceptor', '$rootScope', '$location', '$hustle', '$document', '$timeout', 'storageService', 'initializationRoutine',
                function(dhisMonitor, hustleMonitor, queueInterceptor, $rootScope, $location, $hustle, $document, $timeout, storageService, InitializationRoutine) {

                    $document.on('keydown', function(e) {
                        disableBackspaceKey(e);
                    });

                    $hustle.registerInterceptor(queueInterceptor);

                    $rootScope.$on('$routeChangeSuccess', function () {
                        if($location.path() != '/login') {
                            // Persist last route which has to be retained on page reload.
                            storageService.setItem('lastRoute', $location.path());
                        }
                    });

                    $rootScope.$on('$routeChangeStart', function (event, newRoute) {

                        var accessingSecurePagesWhileNotLoggedIn = !$rootScope.isLoggedIn &&
                            !_.includes(['/', '/login', '/productKeyPage'], newRoute.originalPath);


                        var accessingLoginPageWhileLoggedIn = $rootScope.isLoggedIn && newRoute.originalPath == '/login';


                        var loggedInUserRoles = $rootScope.currentUser ? $rootScope.currentUser.userCredentials.userRoles : [],
                            authorizedRoles = newRoute.data && newRoute.data.allowedRoles,
                            userIsAllowedToViewRoute = _.any(loggedInUserRoles, function (userRole) {
                                return _.contains(authorizedRoles, userRole.name);
                            });
                        var userIsNotAuthorised = $rootScope.isLoggedIn && !userIsAllowedToViewRoute;


                        if (userIsNotAuthorised ||
                            accessingSecurePagesWhileNotLoggedIn ||
                            accessingLoginPageWhileLoggedIn) {
                            event.preventDefault();
                        }
                    });

                    var onlineListener = function() {
                        $rootScope.$apply(function() {
                            $rootScope.isDhisOnline = true;
                        });
                    };

                    var offlineListener = function() {
                        $rootScope.$apply(function() {
                            $rootScope.isDhisOnline = false;
                        });
                    };

                    dhisMonitor.online(onlineListener);
                    dhisMonitor.offline(offlineListener);

                    platformUtils.addListener("timeoutOccurred", dhisMonitor.onTimeoutOccurred);

                    hustleMonitor.onSyncQueueChange(function(data) {
                        $timeout(function() {
                            $rootScope.remainingJobs = data.count + data.reservedCount;
                            $rootScope.msgInQueue = $rootScope.remainingJobs > 0;
                            $rootScope.isQueueProcessing = data.reservedCount > 0;
                        });
                    });

                    InitializationRoutine.run();
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
            var injector = angular.bootstrap(angular.element(document.querySelector('#praxis')), ['PRAXIS']);
            deferred.resolve([injector, app]);
            return deferred.promise;
        };

        return {
            init: init,
            bootstrap: bootstrap
        };
    });
