define(["lodash", "orgUnitMapper"], function(_, orgUnitMapper) {
    return function($q, orgUnitRepository, patientOriginRepository) {

        var create = function(module, patientOrigins) {
            var getPatientOrigins = function() {
                var getFromRepository = function() {
                    return orgUnitRepository.get(module.parent.id).then(function(parentOpUnit) {
                        return patientOriginRepository.get(parentOpUnit.id).then(function(patientOrigins) {
                            return patientOrigins.origins;
                        });
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
                return orgUnitRepository.upsert(originOUPayload);
            });
        };

        return {
            "create": create
        };
    };
});
