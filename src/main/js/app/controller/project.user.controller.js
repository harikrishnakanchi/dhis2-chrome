define([], function() {
    return function($scope, userService) {

        var allRoles = [{
            "id": "hxNB8lleCsl",
            "name": "Data entry user"
        }, {
            "id": "cb4uEzD2fMS",
            "name": "Approver - Level 1"
        }, {
            "id": "fV7TIrX8HGO",
            "name": "Approver - Level 2"
        }];

        var init = function() {
            $scope.userNamePrefix = $scope.orgUnit.name.toLowerCase().replace(/ /g, "_").concat("_");
            $scope.userNameMatchExpr = new RegExp($scope.userNamePrefix, "i");

            $scope.userRoles = allRoles;
            userService.getAllUsernames().then(function(data) {
                $scope.existingUsers = data;
            });
        };

        $scope.save = function(projectUser) {
            var userPayload = {
                "username": projectUser.username.toLowerCase(),
                "surname": "LNU",
                "firstName": "FNU",
                "userCredentials": {
                    "username": projectUser.username,
                    "userAuthorityGroups": [{
                        "name": projectUser.userRole.name,
                        "id": projectUser.userRole.id
                    }],
                    "password": projectUser.password,
                }
            };

            var onSuccess = function(data) {
                $scope.saveSuccess = true;
                $scope.saveFailure = false;
                return data;
            };

            var onFailure = function(error) {
                $scope.saveSuccess = false;
                $scope.saveFailure = true;
                return error;
            };

            userService.create(userPayload).then(onSuccess, onFailure);
        };

        init();
    };
});