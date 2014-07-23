define(["md5", "lodash"], function(md5, _) {
    return function($scope, $rootScope, $location, db, $q, $hustle, userPreferenceRepository) {
        var getUser = function() {
            var userStore = db.objectStore("users");
            return userStore.find($scope.username.toLowerCase());
        };

        var getUserCredentials = function() {
            var userCredentialsStore = db.objectStore("localUserCredentials");
            var username = $scope.username.toLowerCase() === "msfadmin" ? "msfadmin" : "project_user";
            return userCredentialsStore.find(username);
        };

        var setLocale = function() {
            return userPreferenceRepository.get($rootScope.currentUser.userCredentials.username).then(function(data) {
                $rootScope.currentUser.locale = data ? data.locale : "en";
            });
        };

        var saveUserPreferences = function() {
            var userPreferences = {
                'username': $rootScope.currentUser.userCredentials.username,
                'locale': $rootScope.currentUser.locale,
                'orgUnits': $rootScope.currentUser.organisationUnits || []
            };
            return userPreferenceRepository.save(userPreferences);
        };

        var downloadDataValues = function() {
            return $hustle.publish({
                "type": "downloadData"
            }, "dataValues");
        };

        var authenticateOrPromptUserForPassword = function(data) {
            var user = data[0];
            var userCredentials = data[1];

            $scope.invalidCredentials = true;
            $scope.disabledCredentials = false;

            if (user && user.userCredentials.disabled) {
                $scope.disabledCredentials = true;
                $scope.invalidCredentials = false;
            } else if (user && md5($scope.password) === userCredentials.password) {
                $scope.invalidCredentials = false;
                $rootScope.isLoggedIn = true;
                $rootScope.currentUser = user;
                setLocale().
                then(saveUserPreferences).
                then(downloadDataValues).
                then(function() {
                    if (_.isEmpty($rootScope.currentUser.organisationUnits)) {
                        $location.path("/selectproject");
                    } else {
                        $location.path("/dashboard");
                    }
                });
            }
        };

        $scope.login = function() {
            $q.all([getUser(), getUserCredentials()]).then(authenticateOrPromptUserForPassword);
        };
    };
});