define(["moment", "orgUnitMapper", "properties", "lodash"], function(moment, orgUnitMapper, properties, _) {

    return function($scope, $rootScope, $hustle, orgUnitRepository, $q, orgUnitGroupHelper, approvalDataRepository, orgUnitGroupSetRepository) {

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

        var saveToDbAndPublishMessage = function(dhisProject) {
            var onSuccess = function(data) {
                if ($scope.$parent.closeNewForm)
                    $scope.$parent.closeNewForm(data[0], "savedProject");
                return dhisProject;
            };

            var onError = function() {
                $scope.saveFailure = true;
            };

            return orgUnitRepository.upsert([dhisProject])
                .then(function(data) {
                    return publishMessage(data, "upsertOrgUnit", $scope.resourceBundle.upsertOrgUnitDesc + data[0].name);
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

            var dhisProject = orgUnitMapper.mapToExistingProject(newOrgUnit, orgUnit);

            var getModulesInProject = function() {
                return orgUnitRepository.getAllModulesInOrgUnits([dhisProject.id]);
            };

            var createOrgUnitGroups = function(modules) {
                var partitionedModules = _.partition(modules, function(module) {
                    return _.any(module.attributeValues, {
                        "attribute": {
                            "code": "isLineListService"
                        },
                        "value": "true"
                    });
                });

                var aggregateModules = partitionedModules[1];
                var lineListModules = partitionedModules[0];

                if (_.isEmpty(lineListModules)) {
                    return orgUnitGroupHelper.createOrgUnitGroups(aggregateModules, true).then(function() {
                        return modules;
                    });
                }

                return orgUnitRepository.findAllByParent(_.pluck(lineListModules, "id")).then(function(originGroups) {
                    return orgUnitGroupHelper.createOrgUnitGroups(aggregateModules.concat(originGroups), true).then(function() {
                        return modules;
                    });
                });
            };

            var autoApprove = function(modules) {
                if (newOrgUnit.autoApprove !== "true")
                    return modules;

                var publishApprovalsToDhis = function(periodAndOrgUnits) {

                    var uploadCompletionPromise = $hustle.publish({
                        "data": periodAndOrgUnits,
                        "type": "uploadCompletionData",
                        "locale": $scope.currentUser.locale,
                        "desc": $scope.resourceBundle.uploadCompletionDataDesc + _.uniq(_.pluck(periodAndOrgUnits, "period"))
                    }, "dataValues");

                    var uploadApprovalPromise = $hustle.publish({
                        "data": periodAndOrgUnits,
                        "type": "uploadApprovalData",
                        "locale": $scope.currentUser.locale,
                        "desc": $scope.resourceBundle.uploadApprovalDataDesc + _.uniq(_.pluck(periodAndOrgUnits, "period"))
                    }, "dataValues");

                    return $q.all([uploadCompletionPromise, uploadApprovalPromise]);
                };

                var periodAndOrgUnits = getPeriodsAndOrgUnitsForAutoApprove(modules);
                return approvalDataRepository.markAsApproved(periodAndOrgUnits, "admin")
                    .then(_.partial(publishApprovalsToDhis, periodAndOrgUnits))
                    .then(function() {
                        return modules;
                    });
            };

            return saveToDbAndPublishMessage(dhisProject)
                .then(getModulesInProject)
                .then(createOrgUnitGroups)
                .then(autoApprove);
        };

        $scope.save = function(newOrgUnit, parentOrgUnit) {
            $scope.loading = true;
            var dhisProject = orgUnitMapper.mapToProjectForDhis(newOrgUnit, parentOrgUnit);
            saveToDbAndPublishMessage(dhisProject).finally(function() {
                $scope.loading = false;
            });
        };

        var prepareNewForm = function() {
            $scope.reset();
            orgUnitRepository.getAllProjects().then(function(allProjects) {
                $scope.existingProjectCodes = _.transform(allProjects, function(acc, project) {
                    var projCodeAttribute = _.find(project.attributeValues, {
                        'attribute': {
                            'code': "projCode"
                        }
                    });
                    if (!_.isEmpty(projCodeAttribute) && !_.isEmpty(projCodeAttribute.value)) {
                        acc.push(projCodeAttribute.value);
                    }
                }, []);
            });

            return orgUnitRepository.findAllByParent($scope.orgUnit.id).then(function(allOrgUnits) {
                $scope.peerProjects = _.pluck(allOrgUnits, "name");
            });
        };

        var prepareEditForm = function() {
            $scope.reset();
            $scope.newOrgUnit = orgUnitMapper.mapToProject($scope.orgUnit, $scope.allContexts, $scope.allPopTypes, $scope.reasonForIntervention, $scope.modeOfOperation, $scope.modelOfManagement);
            orgUnitRepository.getAllProjects().then(function(allProjects) {
                $scope.peerProjects = _.without(orgUnitRepository.getChildOrgUnitNames($scope.orgUnit.parent.id), $scope.orgUnit.name);
            });
        };

        var init = function() {
            orgUnitGroupSetRepository.getAll().then(function(data) {
                $scope.allContexts = _.find(data, {
                    "code": "context"
                }).organisationUnitGroups;
                $scope.allPopTypes = _.find(data, {
                    "code": "type_of_population"
                }).organisationUnitGroups;
                $scope.reasonForIntervention = _.find(data, {
                    "code": "reason_for_intervention"
                }).organisationUnitGroups;
                $scope.modeOfOperation = _.find(data, {
                    "code": "mode_of_operation"
                }).organisationUnitGroups;
                $scope.modelOfManagement = _.find(data, {
                    "code": "model_of_management"
                }).organisationUnitGroups;

                if ($scope.isNewMode)
                    prepareNewForm();
                else
                    prepareEditForm();
            });


        };

        init();
    };
});
