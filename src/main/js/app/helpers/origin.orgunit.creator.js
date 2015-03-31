define(["lodash", "orgUnitMapper"], function(_, orgUnitMapper) {
    return function(orgUnitRepository, patientOriginRepository) {

        var create = function(module) {
            var getOriginOUPayload = function() {
                return orgUnitRepository.get(module.parent.id).then(function(parentOpUnit) {
                    return patientOriginRepository.get(parentOpUnit.id).then(function(patientOrigins) {
                        if (!_.isEmpty(patientOrigins))
                            return orgUnitMapper.createPatientOriginPayload(patientOrigins.origins, module);
                    });
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
