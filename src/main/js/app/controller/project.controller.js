define(["moment", "orgUnitMapper", "properties"], function(moment, orgUnitMapper, properties) {

    return function($scope, $rootScope, $hustle, orgUnitRepository, $q, $location, $timeout, $anchorScroll, userRepository, $modal, orgUnitGroupHelper, approvalDataRepository) {

        $scope.allContexts = ['Internal instability', 'Stable', 'Post-conflict', 'Cross-border instability'].sort();
        $scope.allPopTypes = ['Internally Displaced People', 'General Population', 'Most-at-risk Population', 'Refugee'].sort();
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

        $scope.closeForm = function(parentOrgUnit) {
            $scope.$parent.closeNewForm(parentOrgUnit);
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

        var getPeriodsAndOrgUnitsForAutoApprove = function(orgUnits) {
            var periods = _.times(properties.weeksForAutoApprove, function(n) {
                return moment().subtract(n + 1, 'week').format("GGGG[W]WW");
            });
            var orgUnitIds = _.pluck(orgUnits, 'id');

            var periodAndOrgUnits = _.map(orgUnitIds, function(orgUnitId) {
                return _.map(periods, function(period) {
                    return {
                        "period": period,
                        "orgUnit": orgUnitId
                    };
                });
            });

            return _.flatten(periodAndOrgUnits);
        };

        $scope.update = function(newOrgUnit, orgUnit) {

            var publishApprovalsToDhis = function(periodAndOrgUnits) {

                var uploadCompletionPromise = $hustle.publish({
                    "data": periodAndOrgUnits,
                    "type": "uploadCompletionData"
                }, "dataValues");

                var uploadApprovalPromise = $hustle.publish({
                    "data": periodAndOrgUnits,
                    "type": "uploadApprovalData"
                }, "dataValues");

                return $q.all([uploadCompletionPromise, uploadApprovalPromise]);
            };

            var createOrgUnitGroups = function() {
                _.forEach(dhisProject.children, function(opunit) {
                    orgUnitRepository.getAllModulesInOrgUnits([opunit.id]).then(function(modules) {
                        var orgUnitsToAssociate = orgUnitGroupHelper.getOrgUnitsToAssociateForUpdate(modules);
                        $q.when(orgUnitsToAssociate).then(function(orgUnitsToAssociate) {
                            orgUnitGroupHelper.createOrgUnitGroups(orgUnitsToAssociate, true);
                        });
                    });
                });
            };

            var dhisProject = orgUnitMapper.mapToExistingProject(newOrgUnit, orgUnit);            
            saveToDbAndPublishMessage(dhisProject).then(function(data) {
                createOrgUnitGroups();
                orgUnitRepository.getAllModulesInOrgUnits([dhisProject.id]).then(function(modules) {
                    if (newOrgUnit.autoApprove === "true") {
                        var periodAndOrgUnits = getPeriodsAndOrgUnitsForAutoApprove(modules);
                        return approvalDataRepository.markAsApproved(periodAndOrgUnits, "admin")
                            .then(_.partial(publishApprovalsToDhis, periodAndOrgUnits));
                    } else {
                        return data;
                    }
                });
            });
        };

        $scope.save = function(newOrgUnit, parentOrgUnit) {
            var dhisProject = orgUnitMapper.mapToProjectForDhis(newOrgUnit, parentOrgUnit);
            saveToDbAndPublishMessage(dhisProject);
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
            return orgUnitRepository.getChildOrgUnitNames($scope.orgUnit.id).then(function(allOrgUnits) {
                $scope.peerProjects = allOrgUnits;
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
            orgUnitRepository.getAllProjects().then(function(allProjects) {
                $scope.peerProjects = _.without(orgUnitRepository.getChildOrgUnitNames($scope.orgUnit.parent.id), $scope.orgUnit.name);
                userRepository.getAllProjectUsers($scope.orgUnit).then(setProjectUsersForEdit);
            });
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