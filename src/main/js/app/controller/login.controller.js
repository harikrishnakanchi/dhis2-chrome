define(["md5", "lodash"], function(md5, _) {
    return function($rootScope, $scope, $location, db, $q, sessionHelper, $hustle) {
        var getUser = function() {
            var userStore = db.objectStore("users");
            return userStore.find($scope.username.toLowerCase());
        };

        var getUserCredentials = function() {
            var userCredentialsStore = db.objectStore("localUserCredentials");

            var username = $scope.username.toLowerCase();
            if(username !== "superadmin" && username !== "msfadmin")
                username = "project_user";

            return userCredentialsStore.find(username);
        };

        var authenticate = function(data) {
            var user = data[0];
            var userCredentials = data[1];

            $scope.invalidCredentials = true;
            $scope.disabledCredentials = false;

            if (user && user.userCredentials.disabled) {
                $scope.disabledCredentials = true;
                $scope.invalidCredentials = false;
            } else if (user && md5($scope.password) === userCredentials.password) {
                $scope.invalidCredentials = false;
                return sessionHelper.login(user);
            }
        };

        var redirect = function(){
            if($scope.invalidCredentials || $scope.disabledCredentials)
                return;

            $hustle.publish({
                "type": "downloadProjectData",
                "data": []
            }, "dataValues");

            if ($rootScope.hasRoles(['Superadmin', 'Superuser']) )
                $location.path("/orgUnits");
            else
                $location.path("/dashboard");
        };

        $scope.login = function() {
            $q.all([getUser(), getUserCredentials()])
                .then(authenticate)
                .then(redirect);
        };
    };
});
