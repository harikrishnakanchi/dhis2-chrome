define(["moment"], function(moment) {
    return function($rootScope, $q ,userPreferenceRepository, orgUnitRepository, $hustle) {
        var saveSessionState = function() {
            var userPreferences = {
                "username": $rootScope.currentUser.userCredentials.username,
                "locale": $rootScope.locale,
                "organisationUnits": $rootScope.currentUser.organisationUnits,
                "selectedProject": $rootScope.currentUser.selectedProject,
                "lastUpdated": moment().toISOString()
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
                $rootScope.locale = userPreferences.locale;
                $rootScope.currentUser.selectedProject = userPreferences.selectedProject;
            };

            var setDefaultPreferences = function() {
                $rootScope.locale = "en";
                $rootScope.currentUser.selectedProject = _.isEmpty($rootScope.currentUser.organisationUnits) ? undefined : $rootScope.currentUser.organisationUnits[0];
            };

            var setUserOrgUnits = function(userPreferences) {
                var getUserOrgUnits = function() {
                    if ($rootScope.hasRoles(["Coordination Level Approver"])) {
                        return orgUnitRepository.findAllByParent(user.organisationUnits[0].id);
                    } else if($rootScope.hasRoles(["Superuser"])) {
                        return userPreferences ? $q.when(userPreferences.organisationUnits) : $q.when(undefined);
                    } else {
                        return $q.when(user.organisationUnits);
                    }
                };

                return getUserOrgUnits().then(function(data) {
                    $rootScope.currentUser.organisationUnits = data;
                    return userPreferences;
                });
            };
            var loadSession = function(userPreferences) {
                if (userPreferences) {
                    setUserPreferences(userPreferences);
                } else {
                    setDefaultPreferences();
                }
                return saveSessionState();
            };

            $rootScope.isLoggedIn = true;
            $rootScope.currentUser = {
                "userCredentials": user.userCredentials
            };

            var broadcast = function() {
                return $rootScope.$broadcast('userPreferencesUpdated');
            };

            return loadUserPreferences().then(setUserOrgUnits).then(loadSession).then(broadcast);
        };

        return {
            "saveSessionState": saveSessionState,
            "logout": logout,
            "login": login
        };
    };
});
