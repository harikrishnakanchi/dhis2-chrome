define(["dhisId"], function(dhisId) {
    return function($scope, $hustle, userRepository) {

        var allRoles = [{
            "name": "Data entry user"
        }, {
            "name": "Project Level Approver"
        }, {
            "name": "Coordination Level Approver"
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
                "id": dhisId.get(projectUser.username),
                "surname": "LNU",
                "firstName": "FNU",
                "userCredentials": {
                    "username": projectUser.username.toLowerCase(),
                    "userRoles": [{
                        "name": projectUser.userRole.name
                    }],
                    "password": "msfuser"
                },
                "organisationUnits": [{
                    "id": $scope.orgUnit.id,
                    "name": $scope.orgUnit.name
                }],
                "dataViewOrganisationUnits": [{
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
                if ($scope.$parent.closeNewForm)
                    $scope.$parent.closeNewForm($scope.orgUnit, "savedUser");
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
