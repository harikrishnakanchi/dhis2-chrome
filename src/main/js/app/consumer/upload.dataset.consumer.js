define([], function() {
    return function(datasetService, datasetRepository) {
        var retrieveFromIDB = function(datasetIds) {
            return datasetRepository.findAllDhisDatasets(datasetIds);
        };

        this.run = function(message) {
            return retrieveFromIDB(message.data.data).then(datasetService.associateDataSetsToOrgUnit);
        };
    };
});
