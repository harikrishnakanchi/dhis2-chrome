define(["lodash"], function(_) {
    return function(db, $q) {
        var upsert = function(patientOrigin) {
            var patientOrigins = _.isArray(patientOrigin) ? patientOrigin : [patientOrigin];
            var store = db.objectStore("patientOrigin");
            return store.upsert(patientOrigins);
        };

        var get = function(projectId) {
            if (!projectId) return $q.when({});
            var store = db.objectStore("patientOrigin");
            return store.find(projectId);
        };

        var findAll = function(projectIds) {
            var store = db.objectStore("patientOrigin");
            var query = db.queryBuilder().$in(projectIds).compile();
            return store.each(query);
        };

        return {
            "upsert": upsert,
            "get": get,
            "findAll": findAll
        };
    };
});
