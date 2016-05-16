define(["md5", "properties", "lodash", "chromeUtils"], function(md5, properties, _, chromeUtils) {
    return function($rootScope, $scope, $location, $q, sessionHelper, $hustle, userPreferenceRepository, orgUnitRepository, systemSettingRepository, userRepository) {
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
            var isAdminUser = function(user) {
                return !!(isRole(user, 'Superuser') || isRole(user, 'Superadmin'));
            };

            userPreferenceRepository.getCurrentUsersProjectIds().then(function(currentUserProjects) {
                var currentUser = data[0],
                    previousUser = data[3];

                var roleChanged = isAdminUser(currentUser) ^ isAdminUser(previousUser);
                var projectChanged = !_.isEqual(previousUserProjects, currentUserProjects);

                if (projectChanged || roleChanged) {
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

        var checkPraxisCompatibility = function () {

            var versionStringComparator = function (v1, v2) {
                v1 = v1.split(".");
                v2 = v2.split(".");
                var l = Math.min(v1.length, v2.length);
                for (var i = 0; i < l; i++) {
                    var a = parseInt(v1[i]);
                    var b = parseInt(v2[i]);
                    if (a < b) {
                        return -1;
                    } else if (a > b) {
                        return 1;
                    }
                }
                return 0;
            };

            var checkCompatibility = function(compatiblePraxisVersions) {
                var praxisVersion = chromeUtils.getPraxisVersion();

                $scope.incompatibleVersion = !_.contains(compatiblePraxisVersions, praxisVersion);

                if($scope.incompatibleVersion) {
                    var alreadyOnLatestVersion = _.last(compatiblePraxisVersions.concat(praxisVersion).sort(versionStringComparator)) == praxisVersion;
                    if(alreadyOnLatestVersion) {
                        $scope.incompatibleVersion = false;
                        $scope.newerVersionAvailable = false;
                    }
                } else {
                    var latestVersion = _.max(compatiblePraxisVersions, function (version) {
                        return parseFloat(version);
                    });
                    if (praxisVersion != latestVersion) {
                        $scope.newerVersionAvailable = true;
                        $scope.newerVersionNumber = latestVersion;
                    }
                }
            };

            var objectStoreNotFound = function() {
                $scope.incompatibleVersion = false;
                $scope.newerVersionAvailable = false;
            };

            return systemSettingRepository.get("compatiblePraxisVersions")
                .then(checkCompatibility, objectStoreNotFound);
        };

        $scope.extension_id = properties.extension_id;
        checkPraxisCompatibility();


    };
});
