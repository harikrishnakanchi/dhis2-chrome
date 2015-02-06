define(['moment', 'mergeByUnion', 'lodashUtils', "mergeByLastUpdated"], function(moment, mergeByUnion, _, mergeByLastUpdated) {
    return function(datasetService, datasetRepository, $q) {
        this.run = function(message) {
            return download()
                .then(mergeAndSave)
                .then(updateChangeLog);
        };

        var updateChangeLog = function() {
            return changeLogRepository.upsert("datasets", moment().toISOString());
        };

        var download = function() {
            return changeLogRepository.get("datasets").then(datasetService.getAll);
        };

        var mergeAndSave = function(allDhisDatasets) {
            var dataSetIds = _.pluck(allDhisDatasets, "id");
            return datasetRepository.findAll(dataSetIds)
                .then(_.curry(mergeByUnion)("organisationUnits", allDhisDatasets))
                .then(_.curry(mergeByLastUpdated)(allDhisDatasets))
                .then(datasetRepository.upsertDhisDownloadedData);
        };
    };
});
