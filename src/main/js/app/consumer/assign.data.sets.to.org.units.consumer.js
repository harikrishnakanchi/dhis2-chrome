define(["lodash"], function(_) {
    return function(orgUnitService, $q) {
        var assignDataSetsToOrgUnits = function(orgUnitIds, dataSetIds) {
            orgUnitIds = _.compact(orgUnitIds);
            dataSetIds = _.compact(dataSetIds);
            return _.reduce(dataSetIds, function(wholePromise, dataSetId){
                return _.reduce(orgUnitIds, function(eachPromise, orgUnitId) {
                    return eachPromise.then(function(){
                        return orgUnitService.assignDataSetToOrgUnit(orgUnitId, dataSetId);
                    });
                }, wholePromise);
            }, $q.when({}));
        };

        this.run = function(message) {
            return assignDataSetsToOrgUnits(message.data.data.orgUnitIds, message.data.data.dataSetIds);
        };
    };
});
