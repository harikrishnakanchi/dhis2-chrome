define(["md5", "properties", "lodash", "interpolate"], function(md5, properties, _, interpolate) {
    return function($rootScope, $scope, $location, $q, sessionHelper, $hustle, userPreferenceRepository, orgUnitRepository, systemSettingRepository, userRepository, checkVersionCompatibility, translationsService) {
        var loadUserData = function(loginUsername) {
            var existingUserProjects = userPreferenceRepository.getCurrentUsersProjectIds();
            var previousUser = userPreferenceRepository.getCurrentUsersUsername().then(function (username) {
                return username ? userRepository.getUser(username) : username;
            });
            var user = userRepository.getUser(loginUsername);
            var userCredentials = userRepository.getUserCredentials(loginUsername);
            return $q.all([user, userCredentials, existingUserProjects, previousUser]);
        };

        var isRole = function(user, role) {
            return user && _.find(user.userCredentials.userRoles, {
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

            if (isRole(user, "Projectadmin"))
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
            var isAdminUser = function(user) {
                return !!(isRole(user, 'Projectadmin') || isRole(user, 'Superadmin'));
            };

            userPreferenceRepository.getCurrentUsersProjectIds().then(function(currentUserProjects) {
                var currentUser = data[0],
                    previousUser = data[3];

                var roleChanged = isAdminUser(currentUser) ^ isAdminUser(previousUser);
                var projectChanged = !_.isEqual(previousUserProjects, currentUserProjects);

                if (projectChanged || roleChanged) {
                    $hustle.publishOnce({
                        type: 'downloadProjectData',
                        data: [],
                        locale: $scope.locale
                    }, 'dataValues');
                }
            });

            return data;
        };

        var redirect = function() {
            if ($rootScope.hasRoles(['Superadmin', 'Projectadmin']))
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

        var stopWatch = $scope.$watch('resourceBundle.contactSupport', function (interpolationString) {
            if(interpolationString) {
                stopWatch();
                $scope.contactSupport = interpolate(interpolationString, {supportEmail: properties.support_email});
            }
        });

        var init = function() {
            $scope.compatibilityInfo = {};
            checkVersionCompatibility($scope.compatibilityInfo);
        };

        init();

    };
});
