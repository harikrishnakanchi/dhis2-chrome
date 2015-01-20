define(["dhisUrl", "lodash"], function(dhisUrl, _) {
    return function($http) {
        this.upload = function(programs) {
            return $http.post(dhisUrl.metadata, {
                "programs": programs
            });
        };

        this.getAll = function(lastUpdatedTime) {
            var url = dhisUrl.programs + '?fields=:all&paging=false';
            url = lastUpdatedTime ? url + "&filter=lastUpdated:gte:" + lastUpdatedTime : url;
            return $http.get(url);
        };
    };
});
