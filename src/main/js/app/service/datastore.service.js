define(["dhisUrl", "constants"], function (dhisUrl, constants) {
    return function ($http, $q) {
        var NAMESPACE = "praxis";
        var EXCLUDED_OPTIONS = "_excludedOptions",
        REFERRAL_LOCATIONS = "_referralLocations",
        PATIENT_ORIGINS = "_patientOrigins";

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

        this.getExcludedOptions = function (moduleId) {
            var key = moduleId + EXCLUDED_OPTIONS;
            var url = [dhisUrl.dataStore, NAMESPACE, key].join("/");
            return $http.get(url)
                .then(_.property('data'))
                .catch(function (response) {
                    return response.errorCode === constants.errorCodes.NOT_FOUND ? undefined : $q.reject();
                });
        };

        this.getReferrals = function (opUnitId) {
            var key = opUnitId + REFERRAL_LOCATIONS;
            var url = [dhisUrl.dataStore, NAMESPACE, key].join("/");
            return $http.get(url)
                .then(_.property('data'))
                .catch(function (response) {
                    return response.errorCode === constants.errorCodes.NOT_FOUND ? undefined : $q.reject();
                });
        };

        this.getPatientOrigins = function (opUnitId) {
            var key = opUnitId + PATIENT_ORIGINS;
            var url = [dhisUrl.dataStore, NAMESPACE, key].join("/");
            return $http.get(url)
                .then(_.property('data'))
                .catch(function (response) {
                    return response.errorCode === constants.errorCodes.NOT_FOUND ? undefined : $q.reject();
                });
        };

        var getAllKeys = function (lastUpdated) {
            var url = [dhisUrl.dataStore, NAMESPACE].join("/");
            return $http.get(url, { params: { lastUpdated: lastUpdated } })
                .then(_.property('data'))
                .catch(function (response) {
                    return response.errorCode === constants.errorCodes.NOT_FOUND ? [] : $q.reject();
                });
        };

        this.getUpdatedKeys = getAllKeys;

        this.getKeysForExcludedOptions = function () {
            return getAllKeys().then(function (allKeys) {
                return _.filter(allKeys, _.partial(_.contains, _, EXCLUDED_OPTIONS, 0));
            });
        };

    };
});