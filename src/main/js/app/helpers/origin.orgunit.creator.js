define(["lodash", "orgUnitMapper"], function(_, orgUnitMapper) {
    return function($q, orgUnitRepository, patientOriginRepository, orgUnitGroupHelper, datasetRepository) {

        var create = function(module, patientOrigins) {
            var getPatientOrigins = function() {
                var getFromRepository = function() {
                    return patientOriginRepository.get(module.parent.id).then(function(patientOrigins) {
                        return patientOrigins.origins;
                    });
                };

                patientOrigins = patientOrigins && !_.isArray(patientOrigins) ? [patientOrigins] : patientOrigins;
                return patientOrigins ? $q.when(patientOrigins) : getFromRepository();
            };

            var getOriginOUPayload = function() {
                return getPatientOrigins().then(function(patientOrigins) {
                    return orgUnitMapper.createPatientOriginPayload(patientOrigins, module);
                });
            };

            return getOriginOUPayload().then(function(originOUPayload) {
                return datasetRepository.getOriginDatasets().then(function(originDatasets) {
                    return orgUnitRepository.upsert(originOUPayload)
                        .then(_.partial(datasetRepository.associateOrgUnits, originDatasets, originOUPayload))
                        .then(function() {
                            return originOUPayload;
                        });
                });
            });
        };

        return {
            "create": create
        };
    };
});
