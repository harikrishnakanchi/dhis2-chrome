define([], function() {
    return function(datasetService) {
        this.run = function(message) {
            console.debug("Associating datasets to orgunits: ", message.data.data);
            return datasetService.associateDataSetsToOrgUnit(message.data.data);
        };
    };
});