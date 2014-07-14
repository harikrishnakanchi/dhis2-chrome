define(["lodash"], function(_) {
    return function($scope, $location, $rootScope, ngI18nResourceBundle, db, userPreferenceRepository, orgUnitRepository, userRepository) {
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
            var oldProject = $scope.oldUserProject || {};

            $rootScope.currentUser.organisationUnits = _.reject($rootScope.currentUser.organisationUnits, {
                "id": oldProject.id
            });

            $rootScope.currentUser.organisationUnits.push({
                "id": $scope.currentUserProject.id,
                "name": $scope.currentUserProject.name
            });

            return userRepository.upsert($rootScope.currentUser).then(saveUserPreferences);
        };

        $rootScope.$watch("currentUser.organisationUnits", function() {
            var filterOutMsfOrgUnit = function(orgUnits) {
                return _.reject(orgUnits, function(orgUnit) {
                    return orgUnit.name === "MSF";
                });
            };

            if ($rootScope.currentUser && !$scope.oldUserProject) {
                var orgUnits = filterOutMsfOrgUnit($rootScope.currentUser.organisationUnits);
                $scope.oldUserProject = orgUnits[0];
                var assignCurrentProject = function() {
                    if ($scope.oldUserProject) {
                        $scope.oldUserProject = _.find($scope.projects, {
                            "id": $scope.oldUserProject.id
                        });
                        $scope.currentUserProject = $scope.oldUserProject;
                    }
                };

                orgUnitRepository.getAllProjects().then(function(orgUnits) {
                    $scope.projects = orgUnits;
                }).then(assignCurrentProject);
            }
        }, true);

        $scope.logout = function() {
            $scope.oldUserProject = undefined;
            $rootScope.isLoggedIn = false;
            $rootScope.currentUser = undefined;
        };
    };
});