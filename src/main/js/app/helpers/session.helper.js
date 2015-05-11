define([], function() {
    return function($rootScope, $q, userPreferenceRepository, orgUnitRepository) {
        var saveSessionState = function() {
            var userPreferences = {
                "username": $rootScope.currentUser.userCredentials.username,
                "locale": $rootScope.currentUser.locale,
                "organisationUnits": $rootScope.currentUser.organisationUnits,
                "selectedProject": $rootScope.currentUser.selectedProject
            };
            return userPreferenceRepository.save(userPreferences);
        };

        var logout = function() {
            return saveSessionState().then(function() {
                $rootScope.isLoggedIn = false;
                $rootScope.currentUser = undefined;
            });
        };

        var login = function(user) {
            var loadUserPreferences = function() {
                return userPreferenceRepository.get(user.userCredentials.username);
            };

            var setUserPreferences = function(userPreferences) {
                $rootScope.currentUser.locale = userPreferences.locale;
                $rootScope.currentUser.organisationUnits = userPreferences.organisationUnits;
                $rootScope.currentUser.selectedProject = userPreferences.selectedProject;
            };

            var setDefaultPreferences = function() {
                var getUserOrgUnits = function() {
                    if ($rootScope.hasRoles(["Coordination Level Approver"])) {
                        return orgUnitRepository.findAllByParent(user.organisationUnits[0].id);
                    } else {
                        return $q.when(user.organisationUnits);
                    }
                };

                $rootScope.currentUser.locale = "en";
                return getUserOrgUnits().then(function(data) {
                    $rootScope.currentUser.organisationUnits = data;
                    $rootScope.currentUser.selectedProject = _.isEmpty(data) ? undefined : data[0];
                });
            };

            var loadSession = function(userPreferences) {
                if (userPreferences) {
                    return setUserPreferences(userPreferences);
                } else {
                    return setDefaultPreferences().then(saveSessionState);
                }
            };

            $rootScope.isLoggedIn = true;
            $rootScope.currentUser = {
                "userCredentials": user.userCredentials
            };

            var broadcast = function() {
                $rootScope.$broadcast('userPreferencesUpdated');
            };

            return loadUserPreferences().then(loadSession).then(broadcast);
        };

        return {
            "saveSessionState": saveSessionState,
            "logout": logout,
            "login": login
        };
    };
});
