define([], function() {
    return function(datasetService) {
        this.run = function(message) {
            return datasetService.associateDataSetsToOrgUnit(message.data.data);
        };
    };
});