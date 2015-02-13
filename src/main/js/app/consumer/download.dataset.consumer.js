define(['moment', 'mergeBy', 'lodashUtils'], function(moment, mergeBy, _) {
    return function(datasetService, datasetRepository, $q, changeLogRepository) {
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
                .then(_.curry(mergeBy.union)("organisationUnits", allDhisDatasets))
                .then(datasetRepository.upsertDhisDownloadedData)
                .then(_.bind(datasetRepository.findAll, {}, dataSetIds))
                .then(_.curry(mergeBy.lastUpdated)({}, allDhisDatasets))
                .then(datasetRepository.upsertDhisDownloadedData);
        };
    };
});