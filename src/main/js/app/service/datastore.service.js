define(["dhisUrl"], function (dhisUrl) {
    return function ($http, $q) {
        var NAMESPACE = "praxis";
        var EXCLUDED_OPTIONS = "_excludedOptions";

        this.updateExcludedOptions = function (moduleId, payload) {
            var key = moduleId + EXCLUDED_OPTIONS;
            var url = [dhisUrl.dataStore, NAMESPACE, key].join("/");
            return $http.post(url, payload);
        };

        this.getExcludedOptions = function (moduleId) {
            var key = moduleId + EXCLUDED_OPTIONS;
            var url = [dhisUrl.dataStore, NAMESPACE, key].join("/");
            return $http.get(url).catch(function (response) {
                return response.status == 404 ? undefined : $q.reject();
            });
        };
    };
});