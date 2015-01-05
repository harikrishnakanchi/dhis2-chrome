define(["dhisUrl", "lodash"], function(dhisUrl, _) {
    return function($http) {
        this.upload = function(programs) {
            return $http.post(dhisUrl.metadata, {
                "programs": programs
            });
        };
    };
});
