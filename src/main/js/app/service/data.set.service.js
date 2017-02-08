define(["dhisUrl", "metadataConf"], function(dhisUrl, metadataConf) {
    return function($http, $q) {

        this.removeOrgUnitFromDataset = function(datasetId, orgUnitId) {
            return $http.delete(dhisUrl.dataSets + '/' + datasetId + '/organisationUnits/' + orgUnitId)
                .catch(function (response) {
                    if (response.status != 404) {
                        return $q.reject();
                    }
                });
        };

        this.getAll = function (lastUpdatedTime) {
            var url = dhisUrl.dataSets + ".json";
            var params = {
                fields: metadataConf.fields.dataSets,
                paging: false
            };
            if (lastUpdatedTime)
                params.filter = "lastUpdated:gte:" + lastUpdatedTime;

            return $http.get(url, {params: params}).then(function (response) {
                return response.data.dataSets;
            });
        };

        this.loadFromFile = function() {
            return $http.get("data/dataSets.json").then(function(response) {
                return response.data.dataSets;
            }).catch(function () {
                return [];
            });
        };

    };
});
