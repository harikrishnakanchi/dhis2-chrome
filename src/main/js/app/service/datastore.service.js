define(["dhisUrl"], function (dhisUrl) {
    return function ($http) {
        var NAMESPACE = "praxis";
        var EXCLUDED_OPTIONS = "_excludedOptions";

        this.updateExcludedOptions = function (moduleId, payload) {
            var key = moduleId + EXCLUDED_OPTIONS;
            var url = [dhisUrl.dataStore, NAMESPACE, key].join("/");
            return $http.post(url, payload);
        };
    };
});