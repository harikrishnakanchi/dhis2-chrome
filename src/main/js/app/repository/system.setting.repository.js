define(["lodash"], function(_) {
    return function(db, $q) {
        var upsert = function(systemSettings) {
            var store = db.objectStore("systemSettings");
            return store.upsert(systemSettings).then(function() {
                return systemSettings;
            });
        };

        var get = function(moduleId) {
            if (!moduleId) return $q.when([]);
            var store = db.objectStore("systemSettings");
            return store.find(moduleId);
        };

        var findAll = function(orgUnitIds) {
            var store = db.objectStore("systemSettings");
            var query = db.queryBuilder().$in(orgUnitIds).compile();
            return store.each(query);
        };

        return {
            "upsert": upsert,
            "get": get,
            "findAll": findAll
        };
    };
});