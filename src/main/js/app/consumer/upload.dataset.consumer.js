define(["lodash"], function(_) {
    return function(datasetService, $q) {
        var assignOrgUnitsToDatasets = function(orgUnitIds, dataSetIds) {
            return _.reduce(dataSetIds, function(wholePromise, dataSetId){
                return _.reduce(orgUnitIds, function(eachPromise, orgUnitId) {
                    return eachPromise.then(datasetService.assignOrgUnitToDataset(dataSetId, orgUnitId));
                }, wholePromise);
            }, $q.when({}));
        };

        this.run = function(message) {
            return assignOrgUnitsToDatasets(message.data.data.orgUnitIds, message.data.data.dataSetIds);
        };
    };
});
