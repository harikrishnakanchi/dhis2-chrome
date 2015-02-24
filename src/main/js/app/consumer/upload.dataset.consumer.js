define([], function() {
    return function(datasetService, datasetRepository) {
        var retrieveFromIDB = function(datasetIds) {
            return datasetRepository.findAll(datasetIds);
        };

        this.run = function(message) {
            console.debug("Associating datasets to orgunits: ", message.data.data);
            return retrieveFromIDB(message.data.data).then(datasetService.associateDataSetsToOrgUnit);
        };
    };
});
