define(["lodash", "moment", "dhisId", "orgUnitMapper"], function(_, moment, dhisId, orgUnitMapper) {
    return function($scope, $hustle, $q, patientOriginRepository, orgUnitRepository, datasetRepository, programRepository, originOrgunitCreator, orgUnitGroupHelper) {
        var patientOrigins = [];
        var oldName = "";

        var publishMessage = function(data, action, desc) {
            return $hustle.publish({
                "data": data,
                "type": action,
                "locale": $scope.currentUser.locale,
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
                var allOriginOrgUnits = [];
                var associatedDatasetIdsAndOrgUnitIdsList = [];
                var associatedPrograms = [];
                var orgUnitsForGroups = [];

                var doAssociations = function(originOrgUnits, siblingOriginOrgUnit) {
                    var associate = function(datasets, program) {
                        var datasetIds = _.pluck(datasets, "id");
                        var originOrgUnitIds = _.pluck(originOrgUnits, "id");
                        var orgunitIdsAndDatasetIds = {
                            "orgUnitIds": originOrgUnitIds,
                            "dataSetIds": datasetIds
                        };
                        associatedDatasetIdsAndOrgUnitIdsList.push(orgunitIdsAndDatasetIds);
                        return datasetRepository.associateOrgUnits(datasetIds, originOrgUnits).then(function() {
                            if (program) {
                                associatedPrograms.push(program);
                                programRepository.associateOrgUnits(program, originOrgUnits);
                            }
                        });
                    };

                    var getDatasetsAndProgram = function(orgUnitId) {
                        return $q.all([datasetRepository.findAllForOrgUnits([orgUnitId]), programRepository.getProgramForOrgUnit(orgUnitId)]);
                    };

                    return getDatasetsAndProgram(siblingOriginOrgUnit.id).then(function(data) {
                        return associate(data[0], data[1]);
                    });
                };

                var publishMessages = function() {
                    publishMessage(allOriginOrgUnits, "upsertOrgUnit", $scope.resourceBundle.upsertOrgUnitDesc + _.uniq(_.pluck(allOriginOrgUnits, "name")));

                    _.each(associatedDatasetIdsAndOrgUnitIdsList, function(associatedDatasetIdsAndOrgUnitIds){
                        publishMessage(associatedDatasetIdsAndOrgUnitIds, "associateOrgUnitToDataset",
                            $scope.resourceBundle.associateOrgUnitToDatasetDesc + $scope.orgUnit.name);
                    });

                    if (!_.isEmpty(associatedPrograms))
                        publishMessage(associatedPrograms, "uploadProgram",
                            $scope.resourceBundle.uploadProgramDesc + _.pluck(allOriginOrgUnits, "name"));
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

                var createOrgUnits = function(module) {
                    return orgUnitRepository.findAllByParent(module.id).then(function(siblingOriginOrgUnits) {
                        return originOrgunitCreator.create(module, $scope.patientOrigin).then(function(originOrgUnits) {
                            allOriginOrgUnits = allOriginOrgUnits.concat(originOrgUnits);
                            orgUnitsForGroups = isLinelistService(module) ? orgUnitsForGroups.concat(originOrgUnits) : orgUnitsForGroups.concat(module);
                            return doAssociations(originOrgUnits, siblingOriginOrgUnits[0]);
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
                    .then(publishMessages)
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

            $scope.loading = true;
            return patientOriginRepository.upsert(payload)
                .then(_.partial(publishMessage, payload.orgUnit, "uploadPatientOriginDetails", $scope.resourceBundle.uploadPatientOriginDetailsDesc + _.pluck(payload.origins, "name")))
                .then(createOrgUnitsAndGroups)
                .then(onSuccess, onFailure)
                .finally(function() {
                    $scope.loading = false;
                });
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
                    publishMessage(updatedPatientOrigin.orgUnit, "uploadPatientOriginDetails", $scope.resourceBundle.uploadPatientOriginDetailsDesc + _.pluck(updatedPatientOrigin.origins, "name"));
                });
                orgUnitRepository.upsert(originsToUpsert).then(function() {
                    publishMessage(originsToUpsert, "upsertOrgUnit", $scope.resourceBundle.upsertOrgUnitDesc + _.uniq(_.pluck(originsToUpsert, "name")));
                });
            };

            getOriginsToUpsert()
                .then(getSystemSetting)
                .then(publishUpdateMessages)
                .then(onSuccess, onFailure);
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
