define(["dhisUrl", "lodash", "moment"], function(dhisUrl, _, moment) {
    return function($http) {
        this.getAllPivotTables = function() {
            var url = dhisUrl.pivotTables + ".json";
            var config = {
                params: {
                    "fields": ":all",
                    "filter": "name:like:Field App",
                    "paging": false,
                }
            };
            var transform = function(response) {
                return response.data.reportTables;
            };
            return $http.get(url, config).then(transform);
        };
    };
});