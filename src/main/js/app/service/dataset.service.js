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

        this.getAll = function() {
            var url = dhisUrl.dataSets + '?fields=:all&paging=false';
            return $http.get(url).then(function(response) {
                return response.data.dataSets;
            });
        };

    };
});
