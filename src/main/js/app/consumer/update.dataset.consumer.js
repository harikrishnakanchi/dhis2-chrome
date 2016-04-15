define(["lodash"], function(_) {
    return function(datasetService, $q, datasetRepository) {
        var retrieveFromIDB = function(datasetIds) {
            return datasetRepository.findAllDhisDatasets(datasetIds);
        };

        var assignOrgUnitsToDatasets = function(orgUnitIds, dataSetIds) {
            return _.reduce(dataSetIds, function(wholePromise, dataSetId){
                return _.reduce(orgUnitIds, function(eachPromise, orgUnitId) {
                    return eachPromise.then(function(){
                        return datasetService.assignOrgUnitToDataset(dataSetId, orgUnitId);
                    });
                }, wholePromise);
            }, $q.when({}));
        };

        this.run = function(message) {
            if (_.isArray(message.data.data))
                return retrieveFromIDB(message.data.data).then(datasetService.associateDataSetsToOrgUnit);
            else
                return assignOrgUnitsToDatasets(message.data.data.orgUnitIds, message.data.data.dataSetIds);
        };
    };
});
