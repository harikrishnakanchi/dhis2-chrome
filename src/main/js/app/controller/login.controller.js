define(["md5", "lodash"], function(md5, _) {
    return function($scope, $location, db, $q, $hustle, sessionHelper) {
        var getUser = function() {
            var userStore = db.objectStore("users");
            return userStore.find($scope.username.toLowerCase());
        };

        var getUserCredentials = function() {
            var userCredentialsStore = db.objectStore("localUserCredentials");
            var username = $scope.username.toLowerCase() === "msfadmin" ? "msfadmin" : "project_user";
            return userCredentialsStore.find(username);
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
                return sessionHelper.login(user)
                    .then(downloadDataValues)
                    .then(function() {
                        $location.path("/dashboard");
                    });
            }
        };

        $scope.login = function() {
            $q.all([getUser(), getUserCredentials()]).then(authenticateOrPromptUserForPassword);
        };
    };
});
