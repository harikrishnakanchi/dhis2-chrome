define(["dhisUrl", "md5", "moment", "lodashUtils"], function(dhisUrl, md5, moment, _) {
    return function($http, $q) {

        var projectSettingsPrefix = "projectSettings_";

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

        var transformProjectSettings = function(data) {
            return _.mapKeys(data, function(value, key) {
                return key.replace(projectSettingsPrefix, "");
            });
        };

        var mergeUpsertedData = function(collection, item) {
            collection = collection || [];

            var existingItemIndex = _.findIndex(collection, {
                "orgUnit": item.orgUnit
            });

            if (existingItemIndex >= 0)
                collection[existingItemIndex] = item;
            else
                collection.push(item);

            return collection;
        };

        var upsertProjectSettings = function(projectId, payload) {
            var data = {};
            data[projectSettingsPrefix + projectId] = payload;
            return $http.post(dhisUrl.systemSettings, data);
        };

        this.loadFromFile = function() {
            return loadSettingsFromFile()
                .then(transformFieldAppSettings);
        };

        this.getSystemSettings = function() {
            return getSettings("fieldAppSettings,versionCompatibilityInfo").then(transformFieldAppSettings);
        };

        this.getProjectSettings = function(projectIds) {
            projectIds = _.flatten([projectIds]);

            var settingKeys = _.map(projectIds, function(projectId) {
                return projectSettingsPrefix + projectId;
            });

            return getSettings(settingKeys).then(transformProjectSettings);
        };


        this.upsertExcludedDataElements = function(projectId, updatedDataElementsExclusions) {
            var update = function(data) {
                data[projectId] = data[projectId] || {};
                data[projectId].excludedDataElements = mergeUpsertedData(data[projectId].excludedDataElements, updatedDataElementsExclusions);
                return data[projectId];
            };

            var upsert = function(payload) {
                return upsertProjectSettings(projectId, payload);
            };

            return this.getProjectSettings(projectId)
                .then(update)
                .then(upsert);
        };

        this.upsertPatientOriginDetails = function(projectId, updatedPatientOriginDetails) {
            var update = function(data) {
                data[projectId] = data[projectId] || {};
                data[projectId].patientOrigins = mergeUpsertedData(data[projectId].patientOrigins, updatedPatientOriginDetails);
                return data[projectId];
            };

            var upsert = function(payload) {
                return upsertProjectSettings(projectId, payload);
            };

            return this.getProjectSettings(projectId)
                .then(update)
                .then(upsert);
        };

        this.upsertReferralLocations = function(projectId, updatedReferralLocations) {
            var update = function(data) {
                data[projectId] = data[projectId] || {};
                data[projectId].referralLocations = mergeUpsertedData(data[projectId].referralLocations, updatedReferralLocations);
                return data[projectId];
            };

            var upsert = function(payload) {
                return upsertProjectSettings(projectId, payload);
            };

            return this.getProjectSettings(projectId)
                .then(update)
                .then(upsert);
        };
    };
});
