define(["md5", "lodash"], function(md5, _) {
    return function($rootScope, $scope, $location, db, $q, sessionHelper, $hustle, userPreferenceRepository) {
        var loadUserData = function(loginUsername) {
            var getUser = function(username) {
                var userStore = db.objectStore("users");
                return userStore.find(username);
            };

            var getUserCredentials = function(username) {
                var userCredentialsStore = db.objectStore("localUserCredentials");

                if (username === "superadmin" || username === "projectadmin")
                    return userCredentialsStore.find(username);
                else
                    return userCredentialsStore.find("project_user");
            };

            var getExistingUserProjects = function() {
                return userPreferenceRepository.getCurrentProjects();
            };

            return $q.all([getUser(loginUsername), getUserCredentials(loginUsername), getExistingUserProjects()]);
        };

        var authenticate = function(data) {
            var user = data[0];
            var userCredentials = data[1];

            $scope.invalidCredentials = false;
            $scope.disabledCredentials = false;

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

            userPreferenceRepository.getCurrentProjects().then(function(currentUserProjects) {
                if (previousUserProjects !== currentUserProjects) {
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
                .then(authenticate)
                .then(login)
                .then(startProjectDataSync)
                .then(redirect);
        };
    };
});
