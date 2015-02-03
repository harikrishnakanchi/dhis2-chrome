define(["moment", "orgUnitMapper", "toTree", "properties"], function(moment, orgUnitMapper, toTree, properties) {

    return function($scope, $rootScope, $hustle, orgUnitRepository, $q, $location, $timeout, $anchorScroll, userRepository, $modal, approvalHelper, orgUnitGroupHelper) {

        $scope.allContexts = ['Internal instability', 'Stable', 'Post-conflict', 'Cross-border instability'].sort();
        $scope.allPopTypes = ['Internally Displaced People', 'General Population', 'Most-at-risk Population', 'Refugee'].sort();
        $scope.thisDate = moment().toDate();
        $scope.reasonForIntervention = ['Armed Conflict', 'Access to health care', 'Natural Disaster', 'Epidemic'].sort();
        $scope.modeOfOperation = ['Direct operation', 'Remote operation'].sort();
        $scope.modelOfManagement = ['Collaboration', 'MSF management'].sort();

        $scope.openOpeningDate = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.openingDate = true;
            $scope.endDate = false;
        };

        $scope.openEndDate = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.openingDate = false;
            $scope.endDate = true;
        };

        $scope.reset = function() {
            $scope.saveFailure = false;
            $scope.newOrgUnit = {
                'openingDate': moment().toDate(),
                'autoApprove': 'false'
            };
        };

        var publishMessage = function(data, action) {
            return $hustle.publish({
                "data": data,
                "type": action
            }, "dataValues").then(function() {
                return data;
            });
        };

        var saveToDbAndPublishMessage = function(dhisProject) {
            var onSuccess = function(data) {
                $rootScope.$broadcast('resetProjects');
                if ($scope.$parent.closeNewForm)
                    $scope.$parent.closeNewForm(data[0], "savedProject");
                return dhisProject;
            };

            var onError = function() {
                $scope.saveFailure = true;
            };

            return orgUnitRepository.upsert(dhisProject)
                .then(function(data) {
                    return publishMessage(data, "upsertOrgUnit");
                })
                .then(onSuccess, onError);
        };

        $scope.update = function(newOrgUnit, orgUnit) {
            var dhisProject = orgUnitMapper.mapToExistingProject(newOrgUnit, orgUnit);
            saveToDbAndPublishMessage(dhisProject).then(function(data) {
                orgUnitRepository.getAllModulesInOrgUnits([dhisProject.id], true).then(function(modules) {
                    orgUnitGroupHelper.createOrgUnitGroups(modules, true);
                    if (newOrgUnit.autoApprove) {
                        return approvalHelper.autoApproveExistingData(data);
                    } else {
                        return data;
                    }
                });
            });
        };

        $scope.save = function(newOrgUnit, parentOrgUnit) {
            var dhisProject = orgUnitMapper.mapToProjectForDhis(newOrgUnit, parentOrgUnit);

            parentOrgUnit.children.push(dhisProject);

            orgUnitRepository.upsert(parentOrgUnit).then(function() {
                saveToDbAndPublishMessage(dhisProject);
            });
        };

        $scope.toggleUserDisabledState = function(user) {
            $scope.toggleStateUsername = user.userCredentials.username;
            $scope.isUserToBeDisabled = !user.userCredentials.disabled;
            $scope.userStateSuccessfullyToggled = false;

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
                return userRepository.upsert(user)
                    .then(function(data) {
                        return publishMessage(data, "updateUser");
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

        $scope.isAfterMaxDate = function() {
            return moment($scope.newOrgUnit.openingDate).isAfter(moment($scope.thisDate));
        };

        $scope.setUserProject = function() {
            $scope.currentUser.organisationUnits = [$scope.orgUnit];
        };

        var scrollToTop = function() {
            $location.hash();
            $anchorScroll();
        };

        var setProjectUsersForEdit = function(projectUsers) {
            var roleNamesToDisplay = ["Data entry user", "Project Level Approver", "Coordination Level Approver"];

            var shouldDisplayUser = function(userRoleNames) {
                return _.intersection(_.pluck(userRoleNames, "name"), roleNamesToDisplay).length === 1;
            };

            $scope.projectUsers = [];
            _.each(projectUsers, function(user) {
                if (shouldDisplayUser(user.userCredentials.userRoles)) {
                    var roles = user.userCredentials.userRoles.map(function(role) {
                        return role.name;
                    });
                    user.roles = roles.join(", ");
                    $scope.projectUsers.push(user);
                }
            });
        };

        var prepareNewForm = function() {
            $scope.reset();
            orgUnitRepository.getAll().then(function(allOrgUnits) {
                $scope.peerProjects = orgUnitMapper.getChildOrgUnitNames(allOrgUnits, $scope.orgUnit.id);
                $scope.existingProjectCodes = _.transform(allOrgUnits, function(acc, orgUnit) {
                    var projCodeAttribute = _.find(orgUnit.attributeValues, {
                        'attribute': {
                            'code': "projCode"
                        }
                    });
                    if (!_.isEmpty(projCodeAttribute) && !_.isEmpty(projCodeAttribute.value)) {
                        acc.push(projCodeAttribute.value);
                    }
                }, []);
            });
        };

        var prepareEditForm = function() {
            $scope.reset();
            $scope.newOrgUnit = orgUnitMapper.mapToProject($scope.orgUnit);
            userRepository.getAllProjectUsers($scope.orgUnit).then(setProjectUsersForEdit);
        };

        var init = function() {
            if ($scope.isNewMode)
                prepareNewForm();
            else
                prepareEditForm();
        };

        init();
    };
});
