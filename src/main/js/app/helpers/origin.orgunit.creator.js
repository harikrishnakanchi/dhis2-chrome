define(["lodash", "orgUnitMapper"], function(_, orgUnitMapper) {
    return function($hustle, orgUnitRepository, patientOriginRepository) {

        var create = function(module) {
            var getOriginOUPayload = function() {
                return orgUnitRepository.get(module.parent.id).then(function(parentOpUnit) {
                    return patientOriginRepository.get(parentOpUnit.id).then(function(patientOrigins) {
                        if (!_.isEmpty(patientOrigins))
                            return orgUnitMapper.createPatientOriginPayload(patientOrigins.origins, module);
                    });
                });
            };

            var publishMessage = function(data, action) {
                return $hustle.publish({
                    "data": data,
                    "type": action
                }, "dataValues");
            };

            return getOriginOUPayload().then(function(originOUPayload) {
                return orgUnitRepository.upsert(originOUPayload)
                    .then(_.partial(publishMessage, originOUPayload, "upsertOrgUnit"))
                    .then(function() {
                        return originOUPayload;
                    });
            });
        };

        return {
            "create": create
        };
    };
});
