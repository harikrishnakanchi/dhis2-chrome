define(["properties", "lodash", "interpolate", "cipherUtils"], function(properties, _, interpolate, cipherUtils) {
    return function($rootScope, $scope, $location, $q, sessionHelper, $hustle, userPreferenceRepository, orgUnitRepository, systemSettingRepository, userRepository, checkVersionCompatibility, storageService) {
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
                    return orgUnitRepository.get(_.first(userOrgUnitIds)).then(function(project) {
                        if (_.get(project, 'parent.id') !== _.first(allowedOrgUnitIds)) {
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

            if (cipherUtils.generateSHA256($scope.password) !== userCredentials.password) {
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

        var persistUserSession = function (data) {
            // Store the user data in sessionStorage to retain session in subsequent reloads.
            storageService.setItem('sessionInfo', data);
            return data;
        };

        $scope.login = function() {
            var loginUsername = $scope.username.toLowerCase();
            loadUserData(loginUsername)
                .then(verifyProductKeyInstance)
                .then(authenticateUser)
                .then(persistUserSession)
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

        var redirectIfSessionExists = function () {
            var lastRoute = storageService.getItem('lastRoute'),
                userSessionData = storageService.getItem('sessionInfo');

            if (lastRoute && userSessionData) {
                login(userSessionData).then(function () {
                    // Set the productKeyLevel on $rootScope.
                    systemSettingRepository.getProductKeyLevel();

                    // Redirect to the last route on page reload.
                    $location.path(lastRoute);
                });
            } else {
                $scope.showLoginForm = true;
                storageService.clear();
            }
        };

        var init = function() {
            $scope.compatibilityInfo = {};
            checkVersionCompatibility($scope.compatibilityInfo);

            redirectIfSessionExists();
        };

        init();

    };
});
