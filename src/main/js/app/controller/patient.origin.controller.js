define(["lodash", "moment", "dhisId", "orgUnitMapper"], function(_, moment, dhisId, orgUnitMapper) {
    return function($scope, $hustle, $q, patientOriginRepository, orgUnitRepository, datasetRepository) {
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
                var patientOriginPayload;
                return orgUnitRepository.getAllModulesInOrgUnitsExceptCurrentModules($scope.orgUnit.id).then(function(modules) {
                    patientOriginPayload = orgUnitMapper.createPatientOriginPayload($scope.patientOrigin, modules);
                    return orgUnitRepository.upsert(patientOriginPayload).then(_.partial(publishMessage, patientOriginPayload, "upsertOrgUnit"));
                }).then(function() {
                    return patientOriginPayload;
                });
            };

            var associateDatasets = function(getDatasetsToAssociate, orgUnits) {
                var addOrgUnits = function(orgUnits, datasets) {
                    var ouPayloadToAssociate = _.map(orgUnits, function(orgUnit) {
                        return {
                            "id": orgUnit.id,
                            "name": orgUnit.name
                        };
                    });

                    return _.map(datasets, function(ds) {
                        ds.organisationUnits = ds.organisationUnits || [];
                        ds.organisationUnits = ds.organisationUnits.concat(ouPayloadToAssociate);
                        return ds;
                    });
                };

                var updateDatasets = function(datasets) {
                    return $q.all([datasetRepository.upsert(datasets), publishMessage(_.pluck(datasets, "id"), "associateOrgUnitToDataset")]);
                };

                return getDatasetsToAssociate()
                    .then(_.partial(addOrgUnits, orgUnits))
                    .then(updateDatasets);
            };

            var getOriginDatasets = function() {
                return datasetRepository.getOriginDatasets();
            };

            $scope.patientOrigin.id = dhisId.get($scope.patientOrigin.name);
            $scope.patientOrigin.clientLastUpdated = moment().toISOString();
            patientOrigins.push($scope.patientOrigin);

            var payload = {
                orgUnit: $scope.orgUnit.id,
                origins: patientOrigins
            };

            return patientOriginRepository.upsert(payload)
                .then(_.partial(publishMessage, payload, "uploadPatientOriginDetails"))
                .then(createOrgUnits)
                .then(_.partial(associateDatasets, getOriginDatasets))
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
