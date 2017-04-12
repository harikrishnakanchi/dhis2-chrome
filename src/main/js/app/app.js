define(["angular", "Q", "services", "directives", "dbutils", "controllers", "repositories", "factories", "migrator", "migrations", "properties", "queueInterceptor", "configureRequestInterceptor", "monitors", "helpers", "indexedDBLogger", "transformers", "platformUtils", "customAttributes",
        "angular-route", "ng-i18n", "angular-indexedDB", "hustleModule", "angular-ui-tabs", "angular-ui-accordion", "angular-ui-collapse", "angular-ui-transition", "angular-ui-weekselector",
        "angular-treeview", "angular-ui-modal", "angular-multiselect", "angular-ui-notin", "angular-ui-equals", "angular-ui-dropdown", "angular-filter", "angucomplete-alt", "angular-nvd3", "angular-ui-tooltip",
        "angular-ui-bindHtml", "angular-ui-position", "angular-sanitize"

    ],
    function(angular, Q, services, directives, dbutils, controllers, repositories, factories, migrator, migrations, properties, queueInterceptor, configureRequestInterceptor, monitors, helpers, indexedDBLogger, transformers, platformUtils, customAttributes) {
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
            app.factory('configureRequestInterceptor', ['$rootScope', 'systemSettingRepository', configureRequestInterceptor]);

            app.constant('USER_ROLES', {
                'DATA_ENTRY': 'Data entry user',
                'OBSERVER': 'Observer',
                'PROJECT_LEVEL_APPROVER': 'Project Level Approver',
                'COORDINATION_LEVEL_APPROVER': 'Coordination Level Approver',
                'PROJECT_ADMIN': 'Projectadmin',
                'SUPER_ADMIN': 'Superadmin'
            });

            var routeResolver = ['$q', '$rootScope', '$location', 'systemSettingRepository','customAttributeRepository', 'metadataHelper',
                function ($q, $rootScope, $location, systemSettingRepository, customAttributeRepository, metadataHelper) {

                    var checkProductKey = function () {
                        return systemSettingRepository.isProductKeySet().then(function (productKeySet) {
                            return productKeySet ? $q.when() : $q.reject('noProductKey');
                        });
                    };

                    var checkMetadata = function () {
                        return metadataHelper.checkMetadata().then(function () {
                            platformUtils.sendMessage('startBgApp');
                            return customAttributeRepository.getAll().then(customAttributes.initializeData);
                        });
                    };

                    var checkSession = function () {
                        return $rootScope.isLoggedIn || (!$rootScope.isLoggedIn && $location.path() == '/login')? $q.when() : $q.reject('noSession');
                    };

                    var setTranslations = function () {
                        return systemSettingRepository.getLocale().then($rootScope.setLocale);
                    };

                    return checkProductKey()
                        .then(checkMetadata)
                        .then(checkSession)
                        .then(setTranslations);
                }];

            app.config(['$routeProvider', '$indexedDBProvider', '$httpProvider', '$hustleProvider', '$compileProvider', '$provide', '$tooltipProvider', 'USER_ROLES',
                function($routeProvider, $indexedDBProvider, $httpProvider, $hustleProvider, $compileProvider, $provide, $tooltipProvider, USER_ROLES) {
                    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);

                    $httpProvider.interceptors.push('configureRequestInterceptor');

                    $routeProvider.
                    when('/downloadingMetadata', {
                        templateUrl: 'templates/downloading-metadata.html',
                        controller: 'downloadMetadataController',
                        data: {
                            allowedRoles: [USER_ROLES.DATA_ENTRY, USER_ROLES.OBSERVER, USER_ROLES.PROJECT_LEVEL_APPROVER,
                                USER_ROLES.COORDINATION_LEVEL_APPROVER,USER_ROLES.PROJECT_ADMIN, USER_ROLES.SUPER_ADMIN]
                        },
                        resolve: {
                            routeResolver: ['$q', '$rootScope', 'systemSettingRepository', 'metadataHelper', function ($q, $rootScope, systemSettingRepository, metadataHelper) {
                                var checkMetadata = function () {
                                    return metadataHelper.checkMetadata().catch($q.when);
                                };
                                var checkProductKey = function () {
                                    return systemSettingRepository.isProductKeySet().then(function (productKeySet) {
                                        return productKeySet ? $q.when() : $q.reject('noProductKey');
                                    });
                                };

                                var setTranslations = function () {
                                    return systemSettingRepository.getLocale().then($rootScope.setLocale);
                                };

                                return setTranslations().then(checkProductKey).then(checkMetadata);
                            }]
                        }
                    }).
                    when('/dashboard', {
                        templateUrl: 'templates/dashboard.html',
                        controller: 'dashboardController',
                        data: {
                            allowedRoles: [USER_ROLES.DATA_ENTRY, USER_ROLES.OBSERVER, USER_ROLES.PROJECT_LEVEL_APPROVER, USER_ROLES.COORDINATION_LEVEL_APPROVER]
                        },
                        resolve: {routeResolver: routeResolver}
                    }).
                    when('/selectProjectPreference', {
                        templateUrl: 'templates/selectProjectPreference.html',
                        controller: 'selectProjectPreferenceController',
                        data: {
                            allowedRoles: [USER_ROLES.PROJECT_ADMIN]
                        },
                        resolve: {routeResolver: routeResolver}
                    }).
                    when('/reports/:orgUnit?', {
                        templateUrl: 'templates/reports.html',
                        controller: 'reportsController',
                        data: {
                            allowedRoles: [USER_ROLES.DATA_ENTRY, USER_ROLES.OBSERVER, USER_ROLES.PROJECT_LEVEL_APPROVER, USER_ROLES.COORDINATION_LEVEL_APPROVER]
                        },
                        resolve: {routeResolver: routeResolver}
                    }).
                    when('/projectReport', {
                        templateUrl: 'templates/project-report.html',
                        controller: 'projectReportController',
                        data: {
                            allowedRoles: [USER_ROLES.DATA_ENTRY, USER_ROLES.OBSERVER, USER_ROLES.PROJECT_LEVEL_APPROVER, USER_ROLES.COORDINATION_LEVEL_APPROVER]
                        },
                        resolve: {routeResolver: routeResolver}
                    }).
                    when('/opUnitReport/:opUnit?', {
                        templateUrl: 'templates/opunit-report.html',
                        controller: 'opUnitReportController',
                        data: {
                            allowedRoles: [USER_ROLES.DATA_ENTRY, USER_ROLES.OBSERVER, USER_ROLES.PROJECT_LEVEL_APPROVER, USER_ROLES.COORDINATION_LEVEL_APPROVER]
                        },
                        resolve: {routeResolver: routeResolver}
                    }).
                    when('/login', {
                        templateUrl: 'templates/login.html',
                        controller: 'loginController',
                        data: {
                            allowedRoles: [USER_ROLES.DATA_ENTRY, USER_ROLES.OBSERVER, USER_ROLES.PROJECT_LEVEL_APPROVER,
                                USER_ROLES.COORDINATION_LEVEL_APPROVER,USER_ROLES.PROJECT_ADMIN, USER_ROLES.SUPER_ADMIN]
                        },
                        resolve: { routeResolver: routeResolver }
                    }).
                    when('/orgUnits', {
                        templateUrl: 'templates/orgunits.html',
                        controller: 'orgUnitController',
                        data: {
                            allowedRoles: [USER_ROLES.PROJECT_ADMIN, USER_ROLES.SUPER_ADMIN]
                        },
                        resolve: {routeResolver: routeResolver}
                    }).
                    when('/notifications', {
                        templateUrl: 'templates/notifications.html',
                        controller: 'notificationsController',
                        data: {
                            allowedRoles: [USER_ROLES.DATA_ENTRY, USER_ROLES.OBSERVER, USER_ROLES.PROJECT_LEVEL_APPROVER, USER_ROLES.COORDINATION_LEVEL_APPROVER]
                        },
                        resolve: {routeResolver: routeResolver}
                    }).
                    when('/productKeyPage', {
                        templateUrl: 'templates/product-key.html',
                        controller: 'productKeyController',
                        data: {
                            allowedRoles: [USER_ROLES.DATA_ENTRY, USER_ROLES.OBSERVER, USER_ROLES.PROJECT_LEVEL_APPROVER,
                                USER_ROLES.COORDINATION_LEVEL_APPROVER,USER_ROLES.PROJECT_ADMIN, USER_ROLES.SUPER_ADMIN]
                        },
                        resolve: {
                            routeResolver: ['$rootScope', 'systemSettingRepository', function ($rootScope, systemSettingRepository) {

                                var setTranslations = function () {
                                    return systemSettingRepository.getLocale().then($rootScope.setLocale);
                                };

                                return setTranslations();
                            }]
                        }
                    }).
                    when('/aggregate-data-entry/:module?/:week?', {
                        templateUrl: 'templates/aggregate-data-entry.html',
                        controller: 'aggregateDataEntryController',
                        data: {
                            allowedRoles: [USER_ROLES.DATA_ENTRY]
                        },
                        resolve: {routeResolver: routeResolver}
                    }).
                    when('/line-list-summary/:module/:filterBy?', {
                        templateUrl: 'templates/line-list-summary.html',
                        controller: 'lineListSummaryController',
                        data: {
                            allowedRoles: [USER_ROLES.DATA_ENTRY, USER_ROLES.OBSERVER, USER_ROLES.PROJECT_LEVEL_APPROVER, USER_ROLES.COORDINATION_LEVEL_APPROVER]
                        },
                        resolve: {routeResolver: routeResolver}
                    }).
                    when('/line-list-data-entry/:module/new', {
                        templateUrl: 'templates/line-list-data-entry.html',
                        controller: 'lineListDataEntryController',
                        data: {
                            allowedRoles: [USER_ROLES.DATA_ENTRY]
                        },
                        resolve: {routeResolver: routeResolver}
                    }).
                    when('/line-list-data-entry/:module/:eventId?', {
                        templateUrl: 'templates/line-list-data-entry.html',
                        controller: 'lineListDataEntryController',
                        data: {
                            allowedRoles: [USER_ROLES.DATA_ENTRY]
                        },
                        resolve: {routeResolver: routeResolver}
                    }).
                    when('/data-approval/:module?/:week?', {
                        templateUrl: 'templates/data-approval.html',
                        controller: 'dataApprovalController',
                        data: {
                            allowedRoles: [USER_ROLES.PROJECT_LEVEL_APPROVER, USER_ROLES.COORDINATION_LEVEL_APPROVER, USER_ROLES.OBSERVER]
                        },
                        resolve: {routeResolver: routeResolver}
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
                        })
                        .dbReady(function () {
                            platformUtils.sendMessage("dbReady");
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

            app.run(['dhisMonitor', 'hustleMonitor', 'queueInterceptor', '$rootScope', '$location', '$hustle', '$document', '$timeout', 'storageService', 'initializationRoutine', '$modalStack',
                function(dhisMonitor, hustleMonitor, queueInterceptor, $rootScope, $location, $hustle, $document, $timeout, storageService, InitializationRoutine, $modalStack) {

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

                    $rootScope.$on('$routeChangeError', function (event, currentRoute, previousRoute, rejection) {
                        var routes = {
                            noProductKey: '/productKeyPage',
                            noMetadata: '/downloadingMetadata',
                            noSession: '/login'
                        };
                        var routeToRedirect = routes[rejection];
                        var routeToAccess = currentRoute.originalPath;
                        if(routeToAccess == routeToRedirect){
                            event.preventDefault();
                            $location.path(previousRoute.originalPath);
                            return;
                        }
                        $location.path(routeToRedirect);
                    });

                    $rootScope.$on('$routeChangeStart', function (event, newRoute) {

                        var loggedInUserRoles = $rootScope.currentUser ? $rootScope.currentUser.userCredentials.userRoles : [],
                            authorizedRoles = newRoute.data && newRoute.data.allowedRoles,
                            userIsAllowedToViewRoute = _.any(loggedInUserRoles, function (userRole) {
                                return _.contains(authorizedRoles, userRole.name);
                            });
                        var userIsNotAuthorised = $rootScope.isLoggedIn && !userIsAllowedToViewRoute;


                        if (userIsNotAuthorised) {
                            event.preventDefault();
                        }
                        else {
                            $modalStack.dismissAll();
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
