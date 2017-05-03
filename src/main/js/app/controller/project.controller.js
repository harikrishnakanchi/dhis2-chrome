define(["moment", "orgUnitMapper", "properties", "lodash", "interpolate", "customAttributes"], function(moment, orgUnitMapper, properties, _, interpolate, customAttributes) {

    return function($scope, $rootScope, $hustle, orgUnitRepository, $q, orgUnitGroupHelper, orgUnitGroupSetRepository, translationsService) {
        var ORG_UNIT_LEVEL_FOR_PROJECT = 4;

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
                'autoApprove': 'false',
                'orgUnitGroupSets': {}
            };
        };

        $scope.closeForm = function(parentOrgUnit) {
            $scope.$parent.closeNewForm(parentOrgUnit);
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
                    return publishMessage(data, "upsertOrgUnit", interpolate($scope.resourceBundle.upsertOrgUnitDesc, { orgUnit: data[0].name }));
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

        var getProjectOrgUnitGroupIds = function (newOrgUnit) {
            return _.compact(_.map(newOrgUnit.orgUnitGroupSets, 'id'));
        };

        $scope.update = function(newOrgUnit, orgUnit) {

            var syncedOrgUnitGroupIds = _.pluck(orgUnit.organisationUnitGroups, 'id'),
                localOrgUnitGroupIds = getProjectOrgUnitGroupIds(newOrgUnit);

            var dhisProject = orgUnitMapper.mapToExistingProject(newOrgUnit, orgUnit);

            var getModulesInProject = function() {
                return orgUnitRepository.getAllModulesInOrgUnits([dhisProject.id]);
            };

            var createOrgUnitGroups = function(modules) {
                if (_.isEmpty(modules))
                    return orgUnitGroupHelper.associateOrgunitsToGroups([dhisProject], syncedOrgUnitGroupIds, localOrgUnitGroupIds).then(function() {
                        return modules;
                    });

                var partitionedModules = _.partition(modules, function(module) {
                    return customAttributes.getBooleanAttributeValue(module.attributeValues, customAttributes.LINE_LIST_ATTRIBUTE_CODE);
                });

                var aggregateModules = partitionedModules[1];
                var lineListModules = partitionedModules[0];


                var getOrgUnitsToAssociate = function () {
                    var orgUnitsToBeAssociated = aggregateModules.concat(dhisProject);
                    if (_.isEmpty(lineListModules)) {
                        return $q.when(orgUnitsToBeAssociated);
                    } else {
                        return orgUnitRepository.findAllByParent(_.pluck(lineListModules, "id")).then(function (origins) {
                            return orgUnitsToBeAssociated.concat(origins);
                        });
                    }
                };

                return getOrgUnitsToAssociate().then(function (orgUnitsToBeAssociated) {
                    return orgUnitGroupHelper.associateOrgunitsToGroups(orgUnitsToBeAssociated, syncedOrgUnitGroupIds, localOrgUnitGroupIds).then(function() {
                        return modules;
                    });
                });
            };

            $scope.startLoading();
            return saveToDbAndPublishMessage(dhisProject)
                .then(getModulesInProject)
                .then(createOrgUnitGroups)
                .finally($scope.stopLoading);
        };

        $scope.save = function(newOrgUnit, parentOrgUnit) {
            var associateProjectToOrgUnitGroups = function (dhisProject) {
                orgUnitGroupHelper.associateOrgunitsToGroups([dhisProject], [], getProjectOrgUnitGroupIds(newOrgUnit));
            };

            $scope.startLoading();
            var dhisProject = orgUnitMapper.mapToProjectForDhis(newOrgUnit, parentOrgUnit);
            return saveToDbAndPublishMessage(dhisProject)
                .then(associateProjectToOrgUnitGroups)
                .finally($scope.stopLoading);
        };

        var prepareNewForm = function() {
            $scope.reset();
            orgUnitRepository.getAllProjects().then(function(allProjects) {
                $scope.existingProjectCodes = _.transform(allProjects, function(acc, project) {
                    var projCode = customAttributes.getAttributeValue(project.attributeValues, customAttributes.PROJECT_CODE);
                    if (projCode) {
                        acc.push(projCode);
                    }
                }, []);
            });

            return orgUnitRepository.findAllByParent($scope.orgUnit.id).then(function(allOrgUnits) {
                $scope.peerProjects = _.pluck(allOrgUnits, "name");
            });
        };

        var prepareEditForm = function() {
            $scope.reset();
            $scope.newOrgUnit = orgUnitMapper.mapOrgUnitToProject($scope.orgUnit, $scope.orgUnitGroupSets);
            orgUnitRepository.getAllProjects().then(function(allProjects) {
                $scope.peerProjects = _.without(orgUnitRepository.getChildOrgUnitNames($scope.orgUnit.parent.id), $scope.orgUnit.name);
            });
        };

        $scope.assignValue = function (value) {
            if(value) {
                $scope.newOrgUnit.orgUnitGroupSets[value.description.organisationUnitGroupSet.id] = {
                    id: value.description.id,
                    name: value.description.name
                };
            }
        };

        var init = function() {

            orgUnitGroupSetRepository.getAll().then(function(orgUnitGroupSets) {
                $scope.orgUnitGroupSets = _.filter(orgUnitGroupSets, function (orgUnitGroupSet) {
                    var orgUnitGroupSetLevel = customAttributes.getAttributeValue(orgUnitGroupSet.attributeValues, customAttributes.ORG_UNIT_GROUP_SET_LEVEL);
                    return orgUnitGroupSetLevel == ORG_UNIT_LEVEL_FOR_PROJECT;
                });
                $scope.orgUnitGroupSets = translationsService.translate($scope.orgUnitGroupSets);
                $scope.orgUnitGroupSetsById = _.indexBy($scope.orgUnitGroupSets, 'id');

                if ($scope.isNewMode)
                    prepareNewForm();
                else
                    prepareEditForm();
            });
        };

        init();
    };
});
