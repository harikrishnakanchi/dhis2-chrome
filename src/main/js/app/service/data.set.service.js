define(["dhisUrl"], function(dhisUrl) {
    return function($http, $q) {

        this.removeOrgUnitFromDataset = function(datasetId, orgUnitId) {
            return $http.delete(dhisUrl.dataSets + '/' + datasetId + '/organisationUnits/' + orgUnitId)
                .catch(function (response) {
                    if (response.status != 404) {
                        return $q.reject();
                    }
                });
        };

        this.getAll = function(lastUpdatedTime) {
            var url = dhisUrl.dataSets + '.json?fields=:all,attributeValues[:identifiable,value,attribute[:identifiable]],organisationUnits[:identifiable]&paging=false';
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
