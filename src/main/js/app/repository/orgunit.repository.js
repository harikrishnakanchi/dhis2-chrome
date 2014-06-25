define([], function() {
    return function(db) {
        var save = function(payload) {
            var store = db.objectStore("organisationUnits");
            return store.upsert(payload).then(function() {
                return payload;
            });
        };

        return {
            "save": save
        };
    };
});