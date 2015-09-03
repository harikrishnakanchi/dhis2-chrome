define(["dhisUrl", "md5", "moment", "lodashUtils"], function(dhisUrl, md5, moment, _) {
    return function($http) {
        var upsert = function(args) {
            var key = "exclude_" + args.key;
            return $http({
                "method": "POST",
                "url": dhisUrl.systemSettings + "/" + key,
                "data": JSON.stringify(args.value),
                "headers": {
                    "Content-Type": "text/plain"
                }
            });
        };

        var transform = function(response) {
            var result = [];
            _.transform(response.data, function(acc, value, key) {
                if (_.startsWith(key, "exclude_")) {
                    result.push({
                        "key": key.replace("exclude_", ""),
                        "value": JSON.parse(value)
                    });
                }
                if (key === "moduleTemplates") {
                    result.push({
                        "key": key,
                        "value": value
                    });
                }
            });
            return result;
        };

        var getAll = function() {
            return $http.get(dhisUrl.systemSettings).then(transform);
        };

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

        var getSystemSettings = function() {
            return getSettings("fieldAppSettings");
        };

        var getProjectSettings = function(projectIds) {
            projectIds = _.flatten([projectIds]);

            var transform = function(data) {
                return _.mapKeys(data, function(value, key) {
                    return key.replace(projectSettingsPrefix, "");
                });
            };

            var settingKeys = _.map(projectIds, function(projectId) {
                return projectSettingsPrefix + projectId;
            });

            return getSettings(settingKeys).then(transform);
        };

        var merge = function(collection, item) {
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
            var request = {
                "method": "POST",
                "url": dhisUrl.systemSettings,
                "data": {},
                "headers": {
                    "Content-Type": "application/json"
                }
            };

            request.data[projectSettingsPrefix + projectId] = payload;

            return $http(request);
        };

        var upsertExcludedDataElements = function(projectId, updatedDataElementsExclusions) {
            var update = function(data) {
                data[projectId] = data[projectId] || {};
                data[projectId].excludedDataElements = merge(data[projectId].excludedDataElements, updatedDataElementsExclusions);
                return data[projectId];
            };

            var upsert = function(payload) {
                return upsertProjectSettings(projectId, payload);
            };

            return getProjectSettings(projectId)
                .then(update)
                .then(upsert);
        };

        var upsertPatientOriginDetails = function(projectId, updatedPatientOriginDetails) {
            var update = function(data) {
                data[projectId] = data[projectId] || {};
                data[projectId].patientOrigins = merge(data[projectId].patientOrigins, updatedPatientOriginDetails);
                return data[projectId];
            };

            var upsert = function(payload) {
                return upsertProjectSettings(projectId, payload);
            };

            return getProjectSettings(projectId)
                .then(update)
                .then(upsert);
        };

        var upsertReferralLocations = function(projectId, updatedReferralLocations) {
            var update = function(data) {
                data[projectId] = data[projectId] || {};
                data[projectId].referralLocations = merge(data[projectId].referralLocations, updatedReferralLocations);
                return data[projectId];
            };

            var upsert = function(payload) {
                return upsertProjectSettings(projectId, payload);
            };

            return getProjectSettings(projectId)
                .then(update)
                .then(upsert);
        };

        return {
            "upsert": upsert,
            "getAll": getAll,
            "getSystemSettings": getSystemSettings,
            "getProjectSettings": getProjectSettings,
            "upsertExcludedDataElements": upsertExcludedDataElements,
            "upsertPatientOriginDetails": upsertPatientOriginDetails,
            "upsertReferralLocations": upsertReferralLocations
        };
    };
});
