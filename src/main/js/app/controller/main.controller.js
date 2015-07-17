define(["chromeUtils", "lodash"], function(chromeUtils, _) {
    return function($q, $scope, $location, $rootScope, $hustle, ngI18nResourceBundle, db, metadataImporter, sessionHelper, orgUnitRepository) {
        $scope.projects = [];

        $scope.canChangeProject = function(hasUserLoggedIn, isCoordinationApprover) {
            return hasUserLoggedIn && isCoordinationApprover;
        };

        $scope.isActive = function(viewLocationRegex) {
            var re = new RegExp(viewLocationRegex);
            return re.test($location.path());
        };

        var deregisterCurrentUserLocaleWatcher = $rootScope.$watch("currentUser.locale", function() {
            var getResourceBundle = function(locale, shouldFetchTranslations) {
                var fetchResourceBundleFromDb = function() {
                    var store = db.objectStore('translations');
                    var query = db.queryBuilder().$index('by_locale').$eq($rootScope.currentUser.locale).compile();
                    return store.each(query).then(function(translations) {
                        _.transform(translations, function(acc, translation) {
                            acc[translation.objectUid] = translation.value;
                        }, $rootScope.resourceBundle);
                    });
                };

                var getTranslationsForCurrentLocale = function() {
                    if (!$rootScope.currentUser.locale) $rootScope.currentUser.locale = "en";
                    fetchResourceBundleFromDb();
                };

                ngI18nResourceBundle.get({
                    "locale": locale
                }).then(function(data) {
                    $rootScope.resourceBundle = data.data;
                    if (shouldFetchTranslations) getTranslationsForCurrentLocale();
                });
            };

            return $rootScope.currentUser ? getResourceBundle($rootScope.currentUser.locale, true) : getResourceBundle("en", false);
        });

        var loadProjects = function() {
            if ($rootScope.currentUser && $rootScope.currentUser.organisationUnits) {
                $scope.projects = _.sortBy($rootScope.currentUser.organisationUnits, "name");
                if (!_.isEmpty($scope.projects) && $rootScope.currentUser.selectedProject) {
                    $scope.selectedProject = _.find($scope.projects, "id", $rootScope.currentUser.selectedProject.id);
                }
            }
        };

        var loadUserLineListModules = function() {
            if ($rootScope.currentUser && $rootScope.currentUser.selectedProject) {
                return orgUnitRepository.getAllModulesInOrgUnits($rootScope.currentUser.selectedProject.id).then(function(modules) {
                    $scope.allUserModules = _.map(modules, function(module) {
                        return {
                            "id": module.id,
                            "displayName": module.parent.name + ' - ' + module.name,
                            "isLineListService": _.any(module.attributeValues, {
                                "attribute": {
                                    "code": "isLineListService"
                                },
                                "value": "true"
                            })
                        };
                    });
                });
            }
        };

        var getAuthHeader = function() {
            var deferred = $q.defer();
            chromeUtils.getAuthHeader(function(result) {
                deferred.resolve(result.auth_header);
            });
            return deferred.promise;
        };

        $scope.logout = function() {
            sessionHelper.logout();
        };

        $scope.setSelectedProject = function(selectedProject) {
            $rootScope.currentUser.selectedProject = selectedProject;
            $rootScope.$emit('selectedProjectUpdated');
            sessionHelper.saveSessionState();
            $location.path("/dashboard");
        };

        var showProductKeyPage = function() {
            $location.path("/productKeyPage");
        };

        var setAuthHeaderOnRootscope = function(result) {
            $rootScope.auth_header = result;
            $location.path("/login");
            metadataImporter.run();
        };

        var loadCharts = function(){
            return $hustle.publish({
                "type": "downloadCharts",
                "data": []
            }, "dataValues");
        };

        var deregisterUserPreferencesListener = $rootScope.$on('userPreferencesUpdated', function() {
            loadProjects();
            loadUserLineListModules();
            loadCharts();
        });

        $scope.$on('$destroy', function() {
            deregisterUserPreferencesListener();
            deregisterCurrentUserLocaleWatcher();
        });

        var init = function() {
            $scope.allUserLineListModules = [];
            getAuthHeader().then(function(result) {
                if (_.isEmpty(result)) {
                    return showProductKeyPage();
                }

                setAuthHeaderOnRootscope(result);
            });
        };

        init();
    };
});
