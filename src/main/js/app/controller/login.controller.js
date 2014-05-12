define(["md5"], function(md5) {
    return function($scope, $rootScope, $location, db, $q) {
        var getUser = function() {
            var userStore = db.objectStore("users");
            return userStore.find($scope.username);
        };

        var getUserCredentials = function() {
            var userCredentialsStore = db.objectStore("localUserCredentials");
            return userCredentialsStore.find($scope.username);
        };

        var authenticateOrPromptUserForPassword = function(data) {
            var user = data[0];
            var userCredentials = data[1];

            $scope.invalidCredentials = true;
            $scope.promptForPassword = false;

            if (user && !userCredentials) {
                $scope.invalidCredentials = false;
                $scope.promptForPassword = true;
                return;
            }

            if (user && userCredentials && md5($scope.password) === userCredentials.password) {
                $scope.invalidCredentials = false;
                $scope.promptForPassword = false;
                $rootScope.isLoggedIn = true;
                $rootScope.username = $scope.username;
                $location.path("/dashboard");
            }
        };


        $scope.login = function() {
            $q.all([getUser(), getUserCredentials()]).then(authenticateOrPromptUserForPassword);
        };
    };
});