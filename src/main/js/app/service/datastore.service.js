define(["dhisUrl", "constants"], function (dhisUrl, constants) {
    return function ($http, $q) {
        var NAMESPACE = "praxis";
        var EXCLUDED_OPTIONS = "_excludedOptions",
            REFERRAL_LOCATIONS = "_referralLocations",
            PATIENT_ORIGINS = "_patientOrigins",
            EXCLUDED_DATA_ELEMENTS = "_excludedDataElements";

        var upsertDataToStore = function (projectId, orgUnitId, payload, type, uploadMethod) {
            var key = [projectId, orgUnitId].join("_") + type;
            var url = [dhisUrl.dataStore, NAMESPACE, key].join("/");
            return uploadMethod(url, payload);
        };

        this.updateExcludedOptions = _.partialRight(upsertDataToStore, EXCLUDED_OPTIONS, $http.put);
        this.createExcludedOptions = _.partialRight(upsertDataToStore, EXCLUDED_OPTIONS, $http.post);

        this.createReferrals = _.partialRight(upsertDataToStore, REFERRAL_LOCATIONS, $http.post);
        this.updateReferrals = _.partialRight(upsertDataToStore, REFERRAL_LOCATIONS, $http.put);

        this.createPatientOrigins = _.partialRight(upsertDataToStore, PATIENT_ORIGINS, $http.post);
        this.updatePatientOrigins = _.partialRight(upsertDataToStore, PATIENT_ORIGINS, $http.put);

        this.createExcludedDataElements = _.partialRight(upsertDataToStore, EXCLUDED_DATA_ELEMENTS, $http.post);
        this.updateExcludedDataElements = _.partialRight(upsertDataToStore, EXCLUDED_DATA_ELEMENTS, $http.put);

        var getDataForKey = function (key) {
            var url = [dhisUrl.dataStore, NAMESPACE, key].join("/");
            return $http.get(url)
                .then(_.property('data'))
                .catch(function (response) {
                    return response.errorCode === constants.errorCodes.NOT_FOUND ? undefined : $q.reject();
                });
        };

        var getDataForMultipleKeys = function (keys) {
            return _.reduce(keys, function (result, key) {
                return result.then(function (previousData) {
                    return getDataForKey(key).then(function (data) {
                        return previousData.concat(data);
                    });
                });
            }, $q.when([]));
        };

        var getDataForOrgUnit = function (projectId, orgUnitId, type) {
            var key = [projectId, orgUnitId].join("_") + type;
            return getDataForKey(key);
        };

        this.getExcludedOptions = _.partialRight(getDataForOrgUnit, EXCLUDED_OPTIONS);

        this.getReferrals = _.partialRight(getDataForOrgUnit, REFERRAL_LOCATIONS);

        this.getPatientOrigins = _.partialRight(getDataForOrgUnit, PATIENT_ORIGINS);

        this.getExcludedDataElements = _.partialRight(getDataForOrgUnit, EXCLUDED_DATA_ELEMENTS);

        this.getUpdatedData = function (projectIds, lastUpdated) {
            var filterKeysForProjects = function (keys) {
                return _.filter(keys, function (key) {
                    var projectId = _.first(key.split("_"));
                    return _.includes(projectIds, projectId);
                });
            };

            var filterKeysOfType = function (keys, type) {
                return _.filter(keys, function (key) {
                    return _.includes(type, _.last(key.split("_")));
                });
            };

            var downloadDataForEachType = function (keys) {
                var types = [EXCLUDED_DATA_ELEMENTS, EXCLUDED_OPTIONS, REFERRAL_LOCATIONS, PATIENT_ORIGINS];
                var formattedTypes = _.map(types, function (type) {
                    return _.last(type.split("_"));
                });
                return _.reduce(formattedTypes, function (result, type) {
                    var filteredKeys = filterKeysOfType(keys, type);
                    return result.then(function (previousData) {
                        return getDataForMultipleKeys(filteredKeys).then(function (data) {
                            previousData[type] = data;
                            return previousData;
                        });
                    });
                }, $q.when({}));
            };

            var url = [dhisUrl.dataStore, NAMESPACE].join("/");
            return $http.get(url, { params: { lastUpdated: lastUpdated } })
                .then(_.property('data'))
                .then(filterKeysForProjects)
                .then(downloadDataForEachType)
                .catch(function (response) {
                    return response.errorCode === constants.errorCodes.NOT_FOUND ? {} : $q.reject();
                });
        };
    };
});