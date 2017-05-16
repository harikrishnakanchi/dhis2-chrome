define(["lodash", "orgUnitMapper"], function(_, orgUnitMapper) {
    return function($q, orgUnitRepository, patientOriginRepository, datasetRepository) {

        var create = function(module, patientOrigins, associateOriginDataset) {
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
                var getOriginDatasetsForModule = function () {
                    if(!associateOriginDataset) return $q.when([]);
                    return datasetRepository.getAll().then(function (allDatasets) {
                        var originDataSets = _.filter(allDatasets, "isOriginDataset");
                        return _.map(originDataSets, function (dataSet) {
                            return {id: dataSet.id};
                        });
                    });
                };

                var enrichOriginsWithDataSets = function (dataSets) {
                    return _.map(originOUPayload, function (origin) {
                        origin.dataSets = dataSets;
                    });
                };

                return getOriginDatasetsForModule()
                    .then(enrichOriginsWithDataSets)
                    .then(function () {
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
