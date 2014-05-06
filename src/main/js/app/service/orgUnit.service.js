define(["properties", "lodash"], function(properties, _) {
    return function($http, db) {

        var create = function(orgUnitRequest) {
            var saveToDb = function() {
                var store = db.objectStore("organisationUnits");
                return store.upsert(orgUnitRequest);
            };

            var saveToDhis = function(data) {
                return $http.post(properties.dhis.url + '/api/metadata', {
                    'organisationUnits': orgUnitRequest
                }).then(function() {
                    return data;
                });
            };

            return saveToDb().then(saveToDhis);
        };

        var associateDataSetsToOrgUnit = function(payload) {
            payload = {
                'dataSets': payload
            };

            var saveToDb = function() {
                var store = db.objectStore("dataSets");
                return store.upsert(payload.dataSets);
            };

            var saveToDhis = function(data) {
                return $http.post(properties.dhis.url + '/api/metadata', payload).then(function() {
                    return data;
                });
            };

            return saveToDb().then(saveToDhis);

        };

        var getDatasetsAssociatedWithOrgUnit = function(orgUnit) {
            return getAll("dataSets").then(function(datasets) {
                return _.filter(datasets, {
                    'organisationUnits': [{
                        'id': orgUnit.id
                    }]
                });
            });

        };

        var setSystemSettings = function(projectId, data) {
            var saveToDhis = function() {
                return $http({
                    method: 'POST',
                    url: properties.dhis.url + '/api/systemSettings/' + projectId,
                    data: JSON.stringify(data),
                    headers: {
                        'Content-Type': 'text/plain'
                    }
                }).then(function() {
                    return data;
                });
            };

            var saveToDb = function() {
                var store = db.objectStore("systemSettings");
                data.id = projectId;
                return store.upsert(data);
            };

            return saveToDb().then(saveToDhis);
        };

        var getAll = function(orgUnitType) {
            var store = db.objectStore(orgUnitType);
            return store.getAll();
        };

        return {
            "create": create,
            "associateDataSetsToOrgUnit": associateDataSetsToOrgUnit,
            "getDatasetsAssociatedWithOrgUnit": getDatasetsAssociatedWithOrgUnit,
            "setSystemSettings": setSystemSettings,
            "getAll": getAll,
        };
    };
});