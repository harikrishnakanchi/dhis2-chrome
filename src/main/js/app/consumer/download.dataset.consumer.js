define(['moment', 'lodashUtils'], function(moment, _) {
    return function(datasetService, datasetRepository, $q, changeLogRepository, mergeBy) {
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
                .then(_.curry(mergeBy.union)("organisationUnits", "id", allDhisDatasets))
                .then(datasetRepository.upsertDhisDownloadedData);
        };
    };
});
