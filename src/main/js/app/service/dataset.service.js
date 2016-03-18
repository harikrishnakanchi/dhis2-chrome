define(["dhisUrl"], function(dhisUrl) {
    return function($http) {

        this.assignOrgUnitToDataset = function(datasetId, orgUnitId) {
            return $http.post(dhisUrl.dataSets + '/' + datasetId + '/organisationUnits/' + orgUnitId);
        };
        this.getAll = function(lastUpdatedTime) {
            var url = dhisUrl.dataSets + '.json?fields=:all&paging=false';
            url = lastUpdatedTime ? url + "&filter=lastUpdated:gte:" + lastUpdatedTime : url;
            return $http.get(url).then(function(response) {
                return response.data.dataSets;
            });
        };

        this.loadFromFile = function() {
            return $http.get("/data/dataSets.json").then(function(response) {
                return response.data.dataSets;
            });
        };

    };
});
