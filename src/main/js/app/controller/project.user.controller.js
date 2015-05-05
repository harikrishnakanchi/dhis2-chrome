define(["dhisId", "properties"], function(dhisId, properties) {
    return function($scope, $hustle, $timeout, $modal, userRepository) {

        var allRoles = {
            "Project": [{
                "name": "Data entry user"
            }, {
                "name": "Project Level Approver"
            }],
            "Country": [{
                "name": "Coordination Level Approver"
            }]
        };

        var init = function() {
            var projCode = getAttributeValue($scope.orgUnit.attributeValues, 'projCode').toLowerCase();
            $scope.userNamePrefix = _.isEmpty(projCode) ? projCode : projCode + "_";
            $scope.userNameMatchExpr = new RegExp($scope.userNamePrefix + "(.)+", "i");
            $scope.userNamePlaceHolder = _.isEmpty($scope.userNamePrefix) ? "" : "Username should begin with " + $scope.userNamePrefix;

            var orgUnitType = getAttributeValue($scope.orgUnit.attributeValues, 'Type');
            $scope.userRoles = allRoles[orgUnitType];
            userRepository.getAllUsernames()
                .then(setExistingUserNames)
                .then(loadOrgUnitUsers);
        };

        var getAttributeValue = function(attributeValues, attributeCode) {
            var attr = _.find(attributeValues, {
                'attribute': {
                    'code': attributeCode
                }
            });

            return attr ? attr.value : "";
        };

        var setExistingUserNames = function(data) {
            $scope.existingUsers = data;
        };

        var loadOrgUnitUsers = function() {
            return userRepository.getAllProjectUsers($scope.orgUnit).then(function(orgUnitUsers) {
                var roleNamesToDisplay = _.pluck($scope.userRoles, "name");

                var shouldDisplayUser = function(userRoleNames) {
                    return _.intersection(_.pluck(userRoleNames, "name"), roleNamesToDisplay).length === 1;
                };

                $scope.orgUnitUsers = [];
                _.each(orgUnitUsers, function(user) {
                    if (shouldDisplayUser(user.userCredentials.userRoles)) {
                        var roles = user.userCredentials.userRoles.map(function(role) {
                            return role.name;
                        });
                        user.roles = roles.join(", ");
                        $scope.orgUnitUsers.push(user);
                    }
                });
            });
        };

        var publishMessage = function(data, action, desc) {
            return $hustle.publish({
                "data": data,
                "type": action,
                "locale": $scope.currentUser.locale,
                "desc": desc
            }, "dataValues").then(function() {
                return data;
            });
        };

        $scope.toggleUserDisabledState = function(user) {
            $scope.toggleStateUsername = user.userCredentials.username;
            $scope.isUserToBeDisabled = !user.userCredentials.disabled;
            $scope.userStateSuccessfullyToggled = false;

            var confirmationMessage = $scope.isUserToBeDisabled === true ? $scope.resourceBundle.userDisableConfMessage : $scope.resourceBundle.userEnableConfMessage;

            $scope.modalMessages = {
                "confirmationMessage": confirmationMessage
            };

            var modalInstance = $modal.open({
                templateUrl: 'templates/toggle-disable-state-confirmation.html',
                controller: 'confirmDialogController',
                scope: $scope
            });

            var onTimeOut = function() {
                $scope.userStateSuccessfullyToggled = false;
            };

            var okConfirmation = function() {
                user.userCredentials.disabled = $scope.isUserToBeDisabled;
                return userRepository.upsert(user).then(function(data) {
                    return publishMessage(data, "updateUser", $scope.resourceBundle.updateUserDesc + user.userCredentials.username);
                });
            };

            modalInstance.result.then(okConfirmation).then(function() {
                $scope.userStateSuccessfullyToggled = true;
                $timeout(onTimeOut, properties.messageTimeout);
            }, function() {
                $scope.userStateSuccessfullyToggled = false;
                $timeout(onTimeOut, properties.messageTimeout);
            });
        };

        $scope.closeForm = function() {
            $scope.$parent.closeNewForm($scope.orgUnit);
        };

        $scope.reset = function() {
            $scope.projectUser = {};
            $scope.createForm.$setPristine();
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
                return publishMessage(userPayload, "createUser", $scope.resourceBundle.createUserDesc + userPayload.username);
            }).then(onSuccess, onFailure);
        };

        init();
    };
});
