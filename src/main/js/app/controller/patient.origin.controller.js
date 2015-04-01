define(["lodash", "moment", "dhisId", "orgUnitMapper"], function(_, moment, dhisId, orgUnitMapper) {
    return function($scope, $hustle, $q, patientOriginRepository, orgUnitRepository, datasetRepository, programRepository, originOrgunitCreator) {
        var patientOrigins = [];

        $scope.save = function() {
            var publishMessage = function(data, action) {
                return $hustle.publish({
                    "data": data,
                    "type": action
                }, "dataValues");
            };

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

            var createOrgUnits = function() {
                var allOriginOrgUnits = [];
                var associatedDatasetIds = [];
                var associatedPrograms = [];

                var doAssociations = function(originOrgUnits, siblingOriginOrgUnit) {
                    var associate = function(datasets, program) {
                        associatedDatasetIds = associatedDatasetIds.concat(_.pluck(datasets, "id"));
                        return datasetRepository.associateOrgUnits(datasets, originOrgUnits).then(function() {
                            if (program) {
                                associatedPrograms.push(program);
                                programRepository.associateOrgUnits(program, originOrgUnits);
                            }
                        });
                    };

                    var getDatasetsAndProgram = function(orgUnitId) {
                        return $q.all([datasetRepository.getAllForOrgUnit(orgUnitId), programRepository.getProgramForOrgUnit(orgUnitId)]);
                    };

                    return getDatasetsAndProgram(siblingOriginOrgUnit.id).then(function(data) {
                        return associate(data[0], data[1]);
                    });
                };

                var publishMessages = function() {
                    publishMessage(allOriginOrgUnits, "upsertOrgUnit");

                    associatedDatasetIds = _.flatten(associatedDatasetIds);
                    publishMessage(associatedDatasetIds, "associateOrgUnitToDataset");

                    if (!_.isEmpty(associatedPrograms))
                        publishMessage(associatedPrograms, "uploadProgram");
                };

                return orgUnitRepository.getAllModulesInOrgUnitsExceptCurrentModules($scope.orgUnit.id).then(function(modules) {
                    var promises = _.map(modules, function(module) {
                        return orgUnitRepository.findAllByParent(module.id).then(function(siblingOriginOrgUnits) {
                            return originOrgunitCreator.create(module, $scope.patientOrigin).then(function(originOrgUnits) {
                                allOriginOrgUnits = allOriginOrgUnits.concat(originOrgUnits);
                                return doAssociations(originOrgUnits, siblingOriginOrgUnits[0]);
                            });
                        });
                    });
                    return $q.all(promises);
                }).then(publishMessages);
            };

            $scope.patientOrigin.id = dhisId.get($scope.patientOrigin.name);
            $scope.patientOrigin.clientLastUpdated = moment().toISOString();
            patientOrigins.push($scope.patientOrigin);

            var payload = {
                "orgUnit": $scope.orgUnit.id,
                "origins": patientOrigins
            };

            return patientOriginRepository.upsert(payload)
                .then(_.partial(publishMessage, payload, "uploadPatientOriginDetails"))
                .then(createOrgUnits)
                .then(onSuccess, onFailure);
        };

        $scope.reset = function() {
            $scope.patientOrigin = {};
            $scope.createForm.$setPristine();
        };

        $scope.closeForm = function() {
            $scope.$parent.closeNewForm($scope.orgUnit);
        };

        var init = function() {
            $scope.patientOrigin = {};
            $scope.existingPatientOrigins = [];
            return patientOriginRepository.get($scope.orgUnit.id).then(function(patientOriginDetails) {
                if (!_.isEmpty(patientOriginDetails)) {
                    patientOrigins = patientOriginDetails.origins;
                    $scope.existingPatientOrigins = _.pluck(patientOrigins, "name");
                }
            });
        };

        init();
    };
});
