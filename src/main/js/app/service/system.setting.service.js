define(["dhisUrl", "md5", "moment", "lodashUtils", "metadataConf"], function(dhisUrl, md5, moment, _, metadataConf) {
    return function($http) {
        var getSettings = function(keys) {
            var config = {
                "params": {
                    "key": keys
                }
            };
            return $http.get(dhisUrl.systemSettings, config).then(function(response) {
                return response.data;
            });
        };

        var loadSettingsFromFile = function() {
            return $http.get("data/systemSettings.json").then(function(response) {
                return response.data;
            }).catch(function () {
                return {};
            });
        };

        var transformFieldAppSettings = function(data) {
            var accumulator = [];
            _.each(data, function (fieldAppSetting) {
                _.transform(fieldAppSetting, function(acc, value, key) {
                    acc.push({
                        "key": key,
                        "value": value
                    });
                }, accumulator);
            });
            return accumulator;
        };

        this.loadFromFile = function() {
            return loadSettingsFromFile()
                .then(transformFieldAppSettings);
        };

        this.getSystemSettings = function() {
            return getSettings(metadataConf.fields.systemSettings.key).then(transformFieldAppSettings);
        };
    };
});
