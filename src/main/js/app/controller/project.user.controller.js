define([], function() {
    return function($scope, $hustle, userRepository) {

        var allRoles = [{
            "id": "8d32f0f1336",
            "name": "Data entry user"
        }, {
            "id": "a276eebf9df",
            "name": "Approver - Level 1"
        }];

        var init = function() {
            $scope.userNamePrefix = _.find($scope.orgUnit.attributeValues, {
                'attribute': {
                    'code': 'projCode'
                }
            }).value.toLowerCase() + "_";
            $scope.userNameMatchExpr = new RegExp($scope.userNamePrefix + "(.)+", "i");

            $scope.userRoles = allRoles;
            userRepository.getAllUsernames().then(function(data) {
                $scope.existingUsers = data;
            });
        };

        $scope.reset = function() {
            $scope.projectUser = {};
        };

        $scope.save = function(projectUser) {
            var userPayload = {
                "username": projectUser.username.toLowerCase(),
                "surname": "LNU",
                "firstName": "FNU",
                "userCredentials": {
                    "username": projectUser.username.toLowerCase(),
                    "userAuthorityGroups": [{
                        "name": projectUser.userRole.name,
                        "id": projectUser.userRole.id
                    }],
                    "password": "msfuser",
                },
                "organisationUnits": [{
                    "id": $scope.orgUnit.id,
                    "name": $scope.orgUnit.name
                }]
            };

            var publishMessage = function(data, action) {
                return $hustle.publish({
                    "data": data,
                    "type": action
                }, "dataValues");
            };

            var onSuccess = function(data) {
                $scope.saveFailure = false;
                if ($scope.$parent.closeEditForm)
                    $scope.$parent.closeEditForm($scope.orgUnit.id, "savedUser");
                return data;
            };

            var onFailure = function(error) {
                $scope.saveSuccess = false;
                $scope.saveFailure = true;
                return error;
            };
            userRepository.upsert(userPayload).then(function() {
                return publishMessage(userPayload, "createUser");
            }).then(onSuccess, onFailure);
        };

        init();
    };
});