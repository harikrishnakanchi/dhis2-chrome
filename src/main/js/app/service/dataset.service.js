define(["dhisUrl"], function(dhisUrl) {
    return function($http) {
        this.associateDataSetsToOrgUnit = function(payload) {
            payload = {
                'dataSets': payload
            };

            var saveToDhis = function(data) {
                return $http.post(dhisUrl.metadata, payload).then(function() {
                    return data;
                });
            };

            return saveToDhis(payload);
        };

        this.assignOrgUnitToDataset = function(datasetId, orgUnitId) {
            return $http.post(dhisUrl.dataSets + '/' + datasetId + '/organisationUnits/' + orgUnitId);
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
