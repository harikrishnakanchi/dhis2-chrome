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
                return datasetRepository.getOriginDatasets().then(function(originDatasets) {
                    if (isLinelistService(module)) {
                        return orgUnitRepository.upsert(originOUPayload)
                            .then(_.partial(orgUnitGroupHelper.createOrgUnitGroups, originOUPayload, false))
                            .then(_.partial(datasetRepository.associateOrgUnits, originDatasets, originOUPayload))
                            .then(function() {
                                return originOUPayload;
                            });
                    } else {
                        return orgUnitRepository.upsert(originOUPayload)
                            .then(_.partial(datasetRepository.associateOrgUnits, originDatasets, originOUPayload))
                            .then(function() {
                                return originOUPayload;
                            });
                    }
                });
            });
        };

        return {
            "create": create
        };
    };
});
