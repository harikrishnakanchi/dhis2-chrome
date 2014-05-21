define(["md5"], function(md5) {
    return function($scope, $rootScope, $location, db, $q) {
        var getUser = function() {
            var userStore = db.objectStore("users");
            return userStore.find($scope.username.toLowerCase());
        };

        var getUserCredentials = function() {
            var userCredentialsStore = db.objectStore("localUserCredentials");
            if ($scope.username.toLowerCase() === "admin")
                return userCredentialsStore.find("admin");
            return userCredentialsStore.find("project_user");
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
                $location.path("/dashboard");
            }
        };


        $scope.login = function() {
            $q.all([getUser(), getUserCredentials()]).then(authenticateOrPromptUserForPassword);
        };
    };
});