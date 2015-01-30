define([], function() {
    return function(datasetService, datasetRepository) {
        var retrieveFromIDB = function(datasetIds) {
            return datasetRepository.getAll().then(function(data) {
                return _.filter(data, function(d) {
                    return _.contains(datasetIds, d.id);
                });
            });
        };

        this.run = function(message) {
            console.debug("Associating datasets to orgunits: ", message.data.data);
            return retrieveFromIDB(message.data.data).then(datasetService.associateDataSetsToOrgUnit);
        };
    };
});
