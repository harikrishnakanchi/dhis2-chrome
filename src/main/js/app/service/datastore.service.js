define(["dhisUrl", "constants"], function (dhisUrl, constants) {
    return function ($http, $q) {
        var NAMESPACE = "praxis";
        var EXCLUDED_OPTIONS = "_excludedOptions",
            REFERRAL_LOCATIONS = "_referralLocations",
            PATIENT_ORIGINS = "_patientOrigins",
            EXCLUDED_DATA_ELEMENTS = "_excludedDataElements";

        var upsertDataToStore = function (orgUnitId, payload, type, uploadMethod) {
            var key = orgUnitId + type;
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

        var getDataForMultipleKeys = function (orgUnitIds, type) {
            return _.reduce(orgUnitIds, function (result, orgUnitId) {
                return result.then(function (previousData) {
                    return getDataForKey(orgUnitId + type).then(function (data) {
                        return previousData.concat(data);
                    });
                });
            }, $q.when([]));
        };

        this.getExcludedOptions = _.partialRight(getDataForMultipleKeys, EXCLUDED_OPTIONS);

        this.getReferrals = _.partialRight(getDataForMultipleKeys, REFERRAL_LOCATIONS);

        this.getPatientOrigins = _.partialRight(getDataForMultipleKeys, PATIENT_ORIGINS);

        this.getExcludedDataElements = _.partialRight(getDataForMultipleKeys, EXCLUDED_DATA_ELEMENTS);

        this.getUpdatedKeys = function (projectIds, lastUpdated) {
            var transformData = function (keys) {
                return _.reduce(keys, function (result, key) {
                    var data = key.split('_').slice(1);
                    var path = _.last(data);
                    result[path] = _.has(result, path) ? result[path] : [];
                    result[path] = result[path].concat(_.first(data));
                    return result;
                }, {});
            };

            var filterKeysForProjects = function (keys) {
                return _.filter(keys, function (key) {
                    var projectId = _.first(key.split("_"));
                    return _.includes(projectIds, projectId);
                });
            };

            var url = [dhisUrl.dataStore, NAMESPACE].join("/");
            return $http.get(url, { params: { lastUpdated: lastUpdated } })
                .then(_.property('data'))
                .then(filterKeysForProjects)
                .then(transformData)
                .catch(function (response) {
                    return response.errorCode === constants.errorCodes.NOT_FOUND ? {} : $q.reject();
                });
        };

        this.getKeysForExcludedOptions = function (projectId) {
            return this.getUpdatedKeys([projectId]).then(function (allKeys) {
                return _.map(allKeys[_.tail(EXCLUDED_OPTIONS).join("")], function (key) {
                    return key.concat(EXCLUDED_OPTIONS);
                });
            });
        };

    };
});