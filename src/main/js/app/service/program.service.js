define(["dhisUrl", "lodash"], function(dhisUrl, _) {
    return function($http) {
        this.upsert = function(programs) {
            return $http.post(dhisUrl.metadata, {
                "programs": programs
            });
        };

        this.getAll = function(lastUpdatedTime) {
            var url = dhisUrl.programs + '?fields=:all&paging=false';
            url = lastUpdatedTime ? url + "&filter=lastUpdated:gte:" + lastUpdatedTime : url;
            return $http.get(url).then(function(data) {
                return data.data.programs;
            });
        };

        this.loadFromFile = function() {
            return $http.get("/data/programs.json").then(function(response) {
                return response.data.programs;
            });
        };

    };
});
