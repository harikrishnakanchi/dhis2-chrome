define(["dhisId", "interpolate", "properties", "customAttributes"], function(dhisId, interpolate, properties, customAttributes) {
    return function($scope, $hustle, $timeout, $modal, userRepository) {

        $scope.projectUser = {};
        $scope.orgUnitUsers = [];

        var allRoles = {
            "Project": [{
                "name": "Data entry user",
                "displayName": $scope.resourceBundle.dataEntryUserLabel,
                "validationType": _.get(properties.organisationSettings.userNameValidations, 'Data entry user')
            }, {
                "name": "Project Level Approver",
                "displayName": $scope.resourceBundle.projectLevelUserLabel,
                "validationType": _.get(properties.organisationSettings.userNameValidations, 'Project Level Approver')
            }, {
                "name": "Observer",
                "displayName": $scope.resourceBundle.observerUserLabel,
                "validationType": _.get(properties.organisationSettings.userNameValidations, 'Observer')
            }],
            "Country": [{
                "name": "Coordination Level Approver",
                "displayName": $scope.resourceBundle.coordinationLevelUserLabel,
                "validationType": _.get(properties.organisationSettings.userNameValidations, 'Coordination Level Approver')
            }]
        };

        $scope.setNameValidations = function () {
            var projCode = customAttributes.getAttributeValue($scope.orgUnit.attributeValues, customAttributes.PROJECT_CODE, '').toLowerCase();
            var userNamePrefix = _.isEmpty(projCode) ? projCode : projCode + "_";

            var emailRegExp = /[-0-9a-zA-Z.+_]+@[-0-9a-zA-Z.+_]+\.[a-zA-Z]{2,4}$/i;
            var projectCodeRegExp = new RegExp(userNamePrefix + ".+", "i");
            var dhisDefaultRegExp = /^.{2,140}$/i;

            if(!$scope.projectUser.userRole) {
                $scope.userNameMatchExpr = new RegExp('', 'i');
                $scope.patternValidationMessage = '';
                $scope.userNamePlaceHolder = '';
                return;
            }

            var validationDetails = {
                'PROJECT_CODE_PREFIX': {
                    userNameMatchExpr: projectCodeRegExp,
                    patternValidationMessage: interpolate($scope.resourceBundle.usernamePrefixValidation, {username_prefix: userNamePrefix}),
                    userNamePlaceHolder: interpolate($scope.resourceBundle.usernamePrefixValidation, {username_prefix: userNamePrefix})
                },
                'EMAIL': {
                    userNameMatchExpr: emailRegExp,
                    patternValidationMessage: $scope.resourceBundle.emailValidation,
                    userNamePlaceHolder: $scope.resourceBundle.emailValidation
                },
                'NONE': {
                    userNameMatchExpr: dhisDefaultRegExp,
                    patternValidationMessage: $scope.resourceBundle.defaultValidation,
                    userNamePlaceHolder: $scope.resourceBundle.defaultValidation
                }
            };

            var validationType = $scope.projectUser.userRole.validationType;
            var isValidValidationType = _.contains(_.keys(validationDetails), validationType);
            validationType = isValidValidationType ? validationType : 'NONE';

            var validation = _.get(validationDetails, validationType);
            $scope.userNameMatchExpr = validation.userNameMatchExpr;
            $scope.patternValidationMessage = validation.patternValidationMessage;
            $scope.userNamePlaceHolder = validation.userNamePlaceHolder;
        };

        var init = function () {
            var orgUnitType = customAttributes.getAttributeValue($scope.orgUnit.attributeValues, customAttributes.TYPE, '');

            $scope.form = {};
            var userRoles = allRoles[orgUnitType];

            var getUserRolesWithId = userRepository.getUserRoles(_.map(userRoles, 'name'))
                .then(function (rolesFromDb) {
                    return _.map(userRoles, function (role) {
                        var roleWithId = _.find(rolesFromDb, {name: role.name});
                        role.id = roleWithId && roleWithId.id;
                        return role;
                    });
                });

            var setUserRoles = function (data) {
                $scope.userRoles = data;
            };

            return getUserRolesWithId
                .then(setUserRoles)
                .then(userRepository.getAllUsernames)
                .then(setExistingUserNames)
                .then(loadOrgUnitUsers);
        };

        var setExistingUserNames = function(data) {
            $scope.existingUsers = data;
        };

        var loadOrgUnitUsers = function() {
            return userRepository.getAllProjectUsers($scope.orgUnit).then(function(orgUnitUsers) {
                var roleNamesToDisplay = _.pluck($scope.userRoles, "name");

                var shouldDisplayUser = function(userRoleNames) {
                    return _.intersection(_.pluck(userRoleNames, "name"), roleNamesToDisplay).length >= 1;
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
                "locale": $scope.locale,
                "desc": desc
            }, "dataValues").then(function() {
                return data;
            });
        };

        $scope.toggleUserDisabledState = function(user) {
            $scope.isUserToBeDisabled = !user.userCredentials.disabled;
            $scope.userStateSuccessfullyToggled = false;

            var confirmationMessageTemplate = $scope.isUserToBeDisabled ? $scope.resourceBundle.userDisableConfMessage : $scope.resourceBundle.userEnableConfMessage;

            $scope.modalMessages = {
                title: $scope.isUserToBeDisabled ? $scope.resourceBundle.disableUserLabel : $scope.resourceBundle.enableUserLabel,
                confirmationMessage: interpolate(confirmationMessageTemplate, { username: user.userCredentials.username })
            };

            var modalInstance = $modal.open({
                templateUrl: 'templates/confirm-dialog.html',
                controller: 'confirmDialogController',
                scope: $scope
            });

            var onTimeOut = function() {
                $scope.userStateSuccessfullyToggled = false;
            };

            var okConfirmation = function() {
                user.userCredentials.disabled = $scope.isUserToBeDisabled;
                return userRepository.upsert(user).then(function(data) {
                    return publishMessage(data, "updateUser", interpolate($scope.resourceBundle.updateUserDesc, { username: user.userCredentials.username }));
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

        $scope.save = function(projectUser) {
            var userId = dhisId.get(projectUser.username);
            var userPayload = {
                "username": projectUser.username.toLowerCase(),
                "id": userId,
                "surname": "LNU",
                "firstName": "FNU",
                "userCredentials": {
                    "username": projectUser.username.toLowerCase(),
                    "userRoles": [{
                        "name": projectUser.userRole.name,
                        "id": projectUser.userRole.id
                    }],
                    "userInfo": {
                        "id": userId
                    },
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
                return publishMessage(userPayload, "createUser", interpolate($scope.resourceBundle.createUserDesc, { username : userPayload.username }));
            }).then(onSuccess, onFailure);
        };

        init();
    };
});
