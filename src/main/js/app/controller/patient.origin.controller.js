define(["lodash", "moment", "dhisId","interpolate", "orgUnitMapper"], function(_, moment, dhisId, interpolate, orgUnitMapper) {
    return function($scope, $hustle, $q, patientOriginRepository, orgUnitRepository, datasetRepository, programRepository, originOrgunitCreator, orgUnitGroupHelper) {
        var patientOrigins = [];
        var oldName = "";

        var publishMessage = function(data, action, desc) {
            return $hustle.publish({
                "data": data,
                "type": action,
                "locale": $scope.locale,
                "desc": desc
            }, "dataValues");
        };

        $scope.save = function() {

            var onSuccess = function(data) {
                $scope.saveFailure = false;
                if ($scope.$parent.closeNewForm)
                    $scope.$parent.closeNewForm($scope.orgUnit, "savedOriginDetails");
                return data;
            };

            var onFailure = function(error) {
                $scope.saveSuccess = false;
                $scope.saveFailure = true;
                return error;
            };

            var createOrgUnitsAndGroups = function() {
                var orgUnitsForGroups = [];
                
                var associateOrgunitsToPrograms = function (program, orgUnits) {
                    if (program) {
                        var orgUnitAndProgramAssociations = {
                            "orgUnitIds": _.map(orgUnits, 'id'),
                            "programIds": [program.id]
                        };
                        return programRepository.associateOrgUnits(program, orgUnits).then(function () {
                            return publishMessage(orgUnitAndProgramAssociations, 'associateOrgunitToProgram', interpolate($scope.resourceBundle.uploadProgramDesc, { orgunit_name: _.pluck(orgUnits, "name").toString() }));
                        });
                    }
                    else {
                        return $q.when();
                    }
                };

                var associateDataSetsToOrgUnits = function (datasets, orgUnits) {
                    var dataSetIds = _.map(datasets, "id");
                    var orgUnitAndDatasetAssociations = {
                        "orgUnitIds": _.map(orgUnits, 'id'),
                        "dataSetIds": dataSetIds
                    };
                    return orgUnitRepository.associateDataSetsToOrgUnits(dataSetIds, orgUnits).then(function () {
                        return publishMessage(orgUnitAndDatasetAssociations, 'associateOrgUnitToDataset', $scope.resourceBundle.associateOrgUnitToDatasetDesc + $scope.orgUnit.name);
                    });
                };

                var doAssociations = function(originOrgUnits, siblingOriginOrgUnit) {
                    var associate = function(datasets, program) {
                        return associateDataSetsToOrgUnits(datasets, originOrgUnits).then(function() {
                            return associateOrgunitsToPrograms(program, originOrgUnits);
                        });
                    };

                    var getDatasetsAndProgram = function(orgUnit) {
                        return $q.all([datasetRepository.findAllForOrgUnits([orgUnit]), programRepository.getProgramForOrgUnit(orgUnit.id)]);
                    };

                    return getDatasetsAndProgram(siblingOriginOrgUnit).then(function(data) {
                        return associate(data[0], data[1]);
                    });
                };

                var getBooleanAttributeValue = function(attributeValues, attributeCode) {
                    var attr = _.find(attributeValues, {
                        "attribute": {
                            "code": attributeCode
                        }
                    });

                    return attr && attr.value === 'true';
                };

                var isLinelistService = function(orgUnit) {
                    return getBooleanAttributeValue(orgUnit.attributeValues, "isLineListService");
                };

                var createOrgUnitGroups = function() {
                    if (!_.isEmpty(orgUnitsForGroups))
                        return orgUnitGroupHelper.createOrgUnitGroups(orgUnitsForGroups, false);
                };

                var createOrgUnits = function (module) {
                    return orgUnitRepository.findAllByParent(module.id).then(function (siblingOriginOrgUnits) {
                        return originOrgunitCreator.create(module, $scope.patientOrigin).then(function (originOrgUnits) {
                            orgUnitsForGroups = isLinelistService(module) ? orgUnitsForGroups.concat(originOrgUnits) : orgUnitsForGroups.concat(module);
                            if (isLinelistService(module)) {
                                return publishMessage(originOrgUnits, "upsertOrgUnit", interpolate($scope.resourceBundle.upsertOrgUnitDesc, {orgUnit: _.uniq(_.pluck(originOrgUnits, "name"))})).then(function () {
                                    return doAssociations(originOrgUnits, siblingOriginOrgUnits[0]);
                                });
                            } else {
                                _.map(originOrgUnits, function (originOrgUnit) {
                                    return publishMessage({orgUnitId: originOrgUnit.id}, "syncOrgUnit", interpolate($scope.resourceBundle.upsertOrgUnitDesc, {orgUnit: _.uniq(_.pluck(originOrgUnits, "name"))}));
                                });
                            }
                        });
                    });
                };

                return orgUnitRepository.getAllModulesInOrgUnits($scope.orgUnit.id).then(function(modules) {
                        return _.reduce(modules, function(prevPromise, module) {
                            return prevPromise.then(function() {
                                return createOrgUnits(module);
                            });
                        }, $q.when({}));
                    })
                    .then(createOrgUnitGroups);
            };

            $scope.patientOrigin.id = dhisId.get($scope.patientOrigin.name);
            $scope.patientOrigin.clientLastUpdated = moment().toISOString();
            $scope.patientOrigin.isDisabled = false;
            patientOrigins.push($scope.patientOrigin);

            var payload = {
                "orgUnit": $scope.orgUnit.id,
                "origins": patientOrigins
            };

            $scope.startLoading();
            return patientOriginRepository.upsert(payload)
                .then(_.partial(publishMessage, payload.orgUnit, "uploadPatientOriginDetails", interpolate($scope.resourceBundle.uploadPatientOriginDetailsDesc, { origin_name: _.map(payload.origins, 'name').toString() })))
                .then(createOrgUnitsAndGroups)
                .then(onSuccess, onFailure)
                .finally($scope.stopLoading);
        };

        $scope.closeForm = function() {
            $scope.$parent.closeNewForm($scope.orgUnit);
        };

        $scope.update = function() {
            var originsToUpsert = [];
            var updatedPatientOrigin = {};

            var onSuccess = function(data) {
                $scope.updateFailure = false;
                if ($scope.$parent.closeNewForm)
                    $scope.$parent.closeNewForm($scope.orgUnit, "updatedOriginDetails");
                return data;
            };

            var onFailure = function(error) {
                $scope.updateSuccess = false;
                $scope.updateFailure = true;
                return error;
            };

            var getOriginsToUpsert = function() {

                return orgUnitRepository.getAllOriginsByName($scope.orgUnit, oldName, true).then(function(origins) {
                    return _.map(origins, function(originToEdit) {
                        originToEdit.name = originToEdit.displayName = originToEdit.shortName = originToEdit.displayShortName = $scope.patientOrigin.name;
                        originToEdit.coordinates = "[" + $scope.patientOrigin.longitude + "," + $scope.patientOrigin.latitude + "]";
                        originsToUpsert.push(originToEdit);
                    });
                });
            };

            var getSystemSetting = function() {
                return patientOriginRepository.get($scope.orgUnit.id).then(function(patientOrigin) {
                    var originToUpdate = _.remove(patientOrigin.origins, function(origin) {
                        return origin.id == $scope.patientOrigin.id;
                    })[0];

                    originToUpdate.name = $scope.patientOrigin.name;
                    originToUpdate.latitude = $scope.patientOrigin.latitude;
                    originToUpdate.longitude = $scope.patientOrigin.longitude;
                    originToUpdate.clientLastUpdated = moment().toISOString();

                    patientOrigin.origins.push(originToUpdate);
                    updatedPatientOrigin = patientOrigin;
                });
            };

            var publishUpdateMessages = function() {
                patientOriginRepository.upsert(updatedPatientOrigin).then(function() {
                    publishMessage(updatedPatientOrigin.orgUnit, "uploadPatientOriginDetails", interpolate($scope.resourceBundle.uploadPatientOriginDetailsDesc, { origin_name: _.map(updatedPatientOrigin.origins, 'name').toString() }));
                });
                orgUnitRepository.upsert(originsToUpsert).then(function() {
                    publishMessage(originsToUpsert, "upsertOrgUnit", interpolate($scope.resourceBundle.upsertOrgUnitDesc, { orgUnit: _.uniq(_.pluck(originsToUpsert, "name")) }));
                });
            };

            $scope.startLoading();
            getOriginsToUpsert()
                .then(getSystemSetting)
                .then(publishUpdateMessages)
                .then(onSuccess, onFailure)
                .finally($scope.stopLoading);
        };

        var init = function() {
            if (_.isEmpty($scope.patientOrigin)) {
                $scope.patientOrigin = {};
            } else {
                oldName = $scope.patientOrigin.name;
            }
            return patientOriginRepository.get($scope.orgUnit.id).then(function(patientOriginDetails) {
                if (!_.isEmpty(patientOriginDetails)) {
                    patientOrigins = patientOriginDetails.origins;
                    $scope.existingPatientOrigins = _.reject(_.pluck(patientOrigins, "name"), function (patientOriginName) {
                        return patientOriginName == oldName;
                    });
                } else {
                    $scope.existingPatientOrigins = [];
                }
            });

        };

        init();
    };
});
