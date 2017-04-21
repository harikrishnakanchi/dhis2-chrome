define(["dhisUrl", "constants"], function (dhisUrl, constants) {
    return function ($http, $q) {
        var NAMESPACE = "praxis";
        var EXCLUDED_OPTIONS = "_excludedOptions";

        var extractDataFromResponse = function (response) {
            return response.data;
        };

        var upsertDataToStore = function (moduleId, payload, uploadMethod) {
            var key = moduleId + EXCLUDED_OPTIONS;
            var url = [dhisUrl.dataStore, NAMESPACE, key].join("/");
            return uploadMethod(url, payload);
        };

        this.updateExcludedOptions = _.partial(upsertDataToStore, _, _, $http.put);

        this.createExcludedOptions = _.partial(upsertDataToStore, _, _, $http.post);

        this.getExcludedOptions = function (moduleId) {
            var key = moduleId + EXCLUDED_OPTIONS;
            var url = [dhisUrl.dataStore, NAMESPACE, key].join("/");
            return $http.get(url)
                .then(extractDataFromResponse)
                .catch(function (response) {
                    return response.errorCode === constants.errorCodes.NOT_FOUND ? undefined : $q.reject();
                });
        };

        var getAllKeys = function () {
            var url = [dhisUrl.dataStore, NAMESPACE].join("/");
            return $http.get(url)
                .then(extractDataFromResponse)
                .catch(function (response) {
                return response.errorCode === constants.errorCodes.NOT_FOUND ? [] : $q.reject();
            });
        };

        this.getKeysForExcludedOptions = function () {
            return getAllKeys().then(function (allKeys) {
                return _.filter(allKeys, _.partial(_.contains, _, EXCLUDED_OPTIONS, 0));
            });
        };

    };
});