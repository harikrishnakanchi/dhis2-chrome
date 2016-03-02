define(["md5", "lodash"], function(md5, _) {
    return function($rootScope, $scope, $location, $q, sessionHelper, $hustle, userPreferenceRepository, orgUnitRepository, systemSettingRepository, userRepository) {
        var loadUserData = function(loginUsername) {
            var getExistingUserProjects = function() {
                return userPreferenceRepository.getCurrentUsersProjectIds();
            };
            var user = userRepository.getUser(loginUsername);
            var userCredentials = userRepository.getUserCredentials(loginUsername);
            return $q.all([user, userCredentials, getExistingUserProjects()]);
        };

        var isRole = function(user, role) {
            return _.find(user.userCredentials.userRoles, {
                "name": role
            });
        };

        var resetFlags = function() {
            $scope.invalidAccess = false;
            $scope.invalidCredentials = false;
            $scope.disabledCredentials = false;
        };

        var verifyProductKeyInstance = function(data) {
            var user = data[0];
            resetFlags();

            if (user === undefined) {
                $scope.invalidCredentials = true;
                return $q.reject("Invalid user");
            }

            var productKeyLevel = systemSettingRepository.getProductKeyLevel();

            if (isRole(user, "Superuser"))
                return data;

            var userOrgUnitIds = _.pluck(user.organisationUnits, "id");
            var allowedOrgUnitIds = _.pluck(systemSettingRepository.getAllowedOrgUnits(), "id");

            if (productKeyLevel === 'project' && _.isEmpty(_.intersection(allowedOrgUnitIds, userOrgUnitIds))) {
                $scope.invalidAccess = true;
                return $q.reject("User doesn’t have access to this Praxis instance.");
            }

            if (productKeyLevel === 'country' && isRole(user, "Coordination Level Approver") && _.isEmpty(_.intersection(allowedOrgUnitIds, userOrgUnitIds))) {
                $scope.invalidAccess = true;
                return $q.reject("User doesn’t have access to this Praxis instance.");
            }

            if (productKeyLevel === 'country' && !isRole(user, "Coordination Level Approver")) {
                if(!_.isEmpty(userOrgUnitIds))
                    return orgUnitRepository.get(userOrgUnitIds[0]).then(function(project) {
                        if (project.parent.id !== allowedOrgUnitIds[0]) {
                            $scope.invalidAccess = true;
                            return $q.reject("User doesn’t have access to this Praxis instance.");
                        } else {
                            $scope.invalidAccess = false;
                            return data;
                        }
                    });
            }
            return data;
        };

        var authenticateUser = function(data) {
            var user = data[0];
            var userCredentials = data[1];

            resetFlags();

            if (user === undefined) {
                $scope.invalidCredentials = true;
                return $q.reject("Invalid user");
            }

            if (user.userCredentials.disabled) {
                $scope.disabledCredentials = true;
                return $q.reject("Disabled user");
            }

            if (md5($scope.password) !== userCredentials.password) {
                $scope.invalidCredentials = true;
                return $q.reject("Invalid credentials");
            }
            return data;
        };

        var login = function(data) {
            var user = data[0];
            return sessionHelper.login(user).then(function() {
                return data;
            });
        };

        var startProjectDataSync = function(data) {
            var previousUserProjects = data[2];

            userPreferenceRepository.getCurrentUsersProjectIds().then(function(currentUserProjects) {
                if (!_.isEqual(previousUserProjects,currentUserProjects)){
                    $hustle.publish({
                        "type": "downloadProjectData",
                        "data": []
                    }, "dataValues");
                }
            });

            return data;
        };

        var redirect = function() {
            if ($rootScope.hasRoles(['Superadmin', 'Superuser']))
                $location.path("/orgUnits");
            else
                $location.path("/dashboard");
        };

        $scope.login = function() {
            var loginUsername = $scope.username.toLowerCase();
            loadUserData(loginUsername)
                .then(verifyProductKeyInstance)
                .then(authenticateUser)
                .then(login)
                .then(startProjectDataSync)
                .then(redirect);
        };
    };
});
