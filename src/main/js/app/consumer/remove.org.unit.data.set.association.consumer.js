define([], function () {
        return function(datasetService, $q) {
            var removeOrgUnitsFromDatasets = function(orgUnitIds, dataSetIds) {
                return _.reduce(dataSetIds, function(wholePromise, dataSetId){
                    return _.reduce(orgUnitIds, function(eachPromise, orgUnitId) {
                        return eachPromise.then(function(){
                            return datasetService.removeOrgUnitFromDataset(dataSetId, orgUnitId);
                        });
                    }, wholePromise);
                }, $q.when({}));
            };

            this.run = function(message) {
                return removeOrgUnitsFromDatasets(message.data.data.orgUnitIds, message.data.data.dataSetIds);
            };
        };
});