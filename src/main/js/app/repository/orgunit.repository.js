define([], function() {
    return function(db) {
        var upsert = function(payload) {
            var store = db.objectStore("organisationUnits");
            return store.upsert(payload).then(function() {
                return payload;
            });
        };

        var getAll = function() {
            var store = db.objectStore("organisationUnits");
            return store.getAll();
        };

        return {
            "upsert": upsert,
            "getAll": getAll
        };
    };
});