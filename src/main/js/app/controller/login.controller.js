define(["md5"], function(md5) {
    return function($scope, $rootScope, $location, db) {
        var getUser = function(username) {
            var userStore = db.objectStore("users");
            return userStore.find($scope.username);
        };

        var authenticate = function(user) {
            if (user && md5($scope.password) === user.password) {
                $rootScope.isLoggedIn = true;
                $rootScope.username = $scope.username;
                $location.path("/dashboard");
            } else {
                $scope.invalidCredentials = true;
            }
        };


        $scope.login = function() {
            getUser($scope.username).then(authenticate);
        };
    };
});