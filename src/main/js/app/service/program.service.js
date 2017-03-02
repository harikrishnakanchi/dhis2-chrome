define(["dhisUrl", "lodash", "metadataConf"], function(dhisUrl, _, metadataConf) {
    return function($http) {
        this.upsert = function(programs) {
            return $http.post(dhisUrl.metadata, {
                "programs": programs
            });
        };

        this.assignOrgUnitToProgram = function (programId, orgUnitId) {
            return $http.post(dhisUrl.programs + '/' + programId + '/organisationUnits/' + orgUnitId);
        };

        this.getAll = function (lastUpdatedTime) {
            var url = dhisUrl.programs + ".json";
            var params = {
                fields: metadataConf.fields.programs,
                paging: false
            };
            if (lastUpdatedTime)
                params.filter = "lastUpdated:gte:" + lastUpdatedTime;

            return $http.get(url, {params: params}).then(function (data) {
                return data.data.programs;
            });
        };

        this.loadFromFile = function() {
            return $http.get("data/programs.json").then(function(response) {
                return response.data.programs;
            }).catch(function () {
                return [];
            });
        };

    };
});
