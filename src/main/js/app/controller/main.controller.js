define(["chromeUtils", "lodash"], function(chromeUtils, _) {
    return function($q, $scope, $location, $rootScope, ngI18nResourceBundle, db, userPreferenceRepository, orgUnitRepository, userRepository, metadataImporter, sessionHelper) {
        var oldUserProject;
        $scope.projects = [];

        var saveUserPreferences = function() {
            var userPreferences = {
                'username': $rootScope.currentUser.userCredentials.username,
                'locale': $rootScope.currentUser.locale,
                'orgUnits': $rootScope.currentUser.organisationUnits || [],
                'selectedProject': $rootScope.currentUser.selectedProject
            };
            return userPreferenceRepository.save(userPreferences);
        };

        $scope.canChangeProject = function(hasUserLoggedIn, isCoordinationApprover) {
            return hasUserLoggedIn && isCoordinationApprover;
        };

        $scope.getFormattedOption = function(project) {
            return project.parent.name + ' - ' + project.name;
        };

        $rootScope.$watch("currentUser.locale", function() {
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

                    saveUserPreferences();
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

        $rootScope.$watch("currentUser.selectedProject", function() {
            if ($rootScope.currentUser && $rootScope.currentUser.selectedProject)
                saveUserPreferences();
        });

        var resetProjects = function() {
            if ($rootScope.currentUser && $rootScope.currentUser.organisationUnits) {
                var orgUnitIds = _.pluck($rootScope.currentUser.organisationUnits, "id");
                return orgUnitRepository.findAllByParent(orgUnitIds).then(function(orgUnits) {
                    $scope.projects = orgUnits;
                    if ($rootScope.currentUser.selectedProject) {
                        $scope.selectedProject = _.find($scope.projects, "id", $rootScope.currentUser.selectedProject.id);
                    } else {
                        $scope.selectedProject = $scope.projects[0];
                        $rootScope.currentUser.selectedProject = $scope.projects[0];
                    }
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

        $rootScope.$watch("currentUser.organisationUnits", function() {
            resetProjects();
        }, true);

        $scope.logout = function() {
            sessionHelper.logout();
        };

        $scope.setSelectedProject = function() {
            $rootScope.currentUser.selectedProject = $scope.selectedProject;
        };

        var showProductKeyPage = function() {
            $location.path("/productKeyPage");
        };

        var setAuthHeaderOnRootscope = function(result) {
            $rootScope.auth_header = result;
            $location.path("/login");
            metadataImporter.run();
        };

        var init = function() {
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
