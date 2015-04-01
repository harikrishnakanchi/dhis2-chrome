define(["lodash", "orgUnitMapper"], function(_, orgUnitMapper) {
    return function($q, orgUnitRepository, patientOriginRepository, orgUnitGroupHelper) {

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

            return getOriginOUPayload().then(function(originOUPayload) {
                if (isLinelistService(module)) {
                    return orgUnitRepository.upsert(originOUPayload)
                        .then(_.partial(orgUnitGroupHelper.createOrgUnitGroups, originOUPayload, false))
                        .then(function() {
                            return originOUPayload;
                        });
                }
                return orgUnitRepository.upsert(originOUPayload);
            });
        };

        return {
            "create": create
        };
    };
});
