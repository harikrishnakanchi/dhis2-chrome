define(["lodash", "orgUnitMapper"], function(_, orgUnitMapper) {
    return function($q, orgUnitRepository, patientOriginRepository, orgUnitGroupHelper, datasetRepository) {

        var create = function(module, patientOrigins) {
            var getPatientOrigins = function() {
                var getFromRepository = function() {
                    return patientOriginRepository.get(module.parent.id).then(function(patientOrigins) {
                        if (!patientOrigins)
                            return [];
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

            return getOriginOUPayload().then(function (originOUPayload) {
                return datasetRepository.getAll().then(function (allDatasets) {

                    var getOriginDataSets = function () {
                        var originDataSets = _.filter(allDatasets, "isOriginDataset");
                        return _.map(originDataSets, function (dataSet) {
                            return {id: dataSet.id};
                        });
                    };

                    var originDataSets = getOriginDataSets();

                    _.map(originOUPayload, function (origin) {
                        origin.dataSets = originDataSets;
                    });

                    return orgUnitRepository.upsert(originOUPayload)
                        .then(function () {
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
