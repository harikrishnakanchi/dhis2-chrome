define(["properties"], function(properties) {
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

        return {
            "create": create
        };
    };
});