define(["lodash"], function(_) {
    return function($scope, $location, $rootScope, ngI18nResourceBundle, db, userPreferenceRepository, orgUnitRepository, userRepository, metadataService, sessionHelper) {
        var oldUserProject;
        $scope.projects = [];

        var saveUserPreferences = function() {
            var userPreferences = {
                'username': $rootScope.currentUser.userCredentials.username,
                'locale': $rootScope.currentUser.locale,
                'orgUnits': $rootScope.currentUser.organisationUnits || []
            };
            return userPreferenceRepository.save(userPreferences);
        };

        $scope.canChangeProject = function(hasUserLoggedIn, isAdmin) {
            return hasUserLoggedIn && isAdmin && $location.path() !== "/selectproject";
        };

        $scope.getFormattedOption = function(project) {
            return project.parent.name + ' - ' + project.name + ' (' + project.code + ')';
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

        $scope.saveUser = function() {
            if (!_.isEmpty($scope.oldUserProject)) {
                $rootScope.currentUser.organisationUnits = _.reject($rootScope.currentUser.organisationUnits, {
                    "id": $scope.oldUserProject.id
                });
            }

            $rootScope.currentUser.organisationUnits.push({
                "id": $scope.currentUserProject.id,
                "name": $scope.currentUserProject.name
            });

            return userRepository.upsert($rootScope.currentUser).then(saveUserPreferences);
        };

        var resetProjects = function() {
            var assignCurrentProject = function() {
                if (!_.isEmpty($rootScope.currentUser)) {
                    userPreferenceRepository.get($rootScope.currentUser.userCredentials.username).then(function(data) {
                        if ( !_.isEmpty(data) && !_.isEmpty(data.orgUnits)) {
                            $scope.currentUserProject = _.find($scope.projects, {
                                "id": data.orgUnits[0].id
                            });
                            $scope.oldUserProject = $scope.currentUserProject;
                        }
                    });
                }
            };

            orgUnitRepository.getAllProjects().then(function(orgUnits) {
                $scope.projects = orgUnits;
            }).then(assignCurrentProject);
        };

        $rootScope.$watch("currentUser.organisationUnits", function() {
            resetProjects();
        }, true);

        $rootScope.$watch("currentUser", function() {
            resetProjects();
        }, true);

        $scope.logout = function() {
            sessionHelper.logout();
        };

        $rootScope.$on('resetProjects', resetProjects);

        var init = function() {
            metadataService.loadMetadataFromFile().then(resetProjects);
        };

        init();
    };
});