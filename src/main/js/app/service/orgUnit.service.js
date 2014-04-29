define(["properties", "lodash"], function(properties, _) {
    return function($http, db) {

        var create = function(payload) {
            payload = {
                'organisationUnits': payload
            };

            var saveToDb = function() {
                var store = db.objectStore("organisationUnits");
                return store.upsert(payload.organisationUnits);
            };

            var saveToDhis = function(data) {
                return $http.post(properties.dhis.url + '/api/metadata', payload).then(function() {
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
            var store = db.objectStore("dataSets");
            return store.getAll().then(function(datasets) {
                return _.filter(datasets, {
                    'organisationUnits': [{
                        'id': orgUnit.id
                    }]
                });
            });

        };

        return {
            "create": create,
            "associateDataSetsToOrgUnit": associateDataSetsToOrgUnit,
            "getDatasetsAssociatedWithOrgUnit": getDatasetsAssociatedWithOrgUnit
        };
    };
});