define(["moment"], function(moment) {
    return function($rootScope, $q ,userPreferenceRepository, orgUnitRepository, $location, storageService) {
        var saveSessionState = function() {
            var userPreferences = {
                "username": $rootScope.currentUser.userCredentials.username,
                "organisationUnits": $rootScope.currentUser.organisationUnits,
                "selectedProject": $rootScope.currentUser.selectedProject,
                "lastUpdated": moment().toISOString(),
                "userRoles": $rootScope.currentUser.userCredentials.userRoles
            };
            return userPreferenceRepository.save(userPreferences);
        };

        var logout = function() {
            storageService.clear();

            return saveSessionState().then(function() {
                $rootScope.isLoggedIn = false;
                $rootScope.currentUser = undefined;
                $location.path('/login');
            });
        };

        var login = function(user) {
            var loadUserPreferences = function() {
                return userPreferenceRepository.get(user.userCredentials.username);
            };

            var setUserPreferences = function(userPreferences) {
                $rootScope.currentUser.selectedProject = userPreferences.selectedProject;
            };

            var setDefaultPreferences = function() {
                $rootScope.currentUser.selectedProject = _.isEmpty($rootScope.currentUser.organisationUnits) ? undefined : $rootScope.currentUser.organisationUnits[0];
            };

            var setUserOrgUnits = function(userPreferences) {
                var getUserOrgUnits = function() {
                    if ($rootScope.hasRoles(["Coordination Level Approver"])) {
                        return orgUnitRepository.findAllByParent(user.organisationUnits[0].id);
                    } else if($rootScope.hasRoles(["Projectadmin"])) {
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
