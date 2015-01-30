define(["lodash"], function(_) {
    return function(db) {
        var get = function(datasetId) {
            var store = db.objectStore("dataSets");
            return store.find(datasetId);
        };

        var getAll = function() {
            var store = db.objectStore("dataSets");
            return store.getAll();
        };

        var getAllDatasetIds = function() {
            return getAll().then(function(data) {
                return _.pluck(data, "id");
            });
        };

        var getAllForOrgUnit = function(orgUnitId) {
            var store = db.objectStore("dataSets");
            var query = db.queryBuilder().$eq(orgUnitId).$index("by_organisationUnit").compile();
            return store.each(query);
        };

        var upsert = function(payload) {
            var dataSets = !_.isArray(payload) ? [payload] : payload;
            dataSets = _.map(dataSets, function(ds) {
                ds.orgUnitIds = _.pluck(ds.organisationUnits, "id");
                return ds;
            });

            var store = db.objectStore("dataSets");
            return store.upsert(dataSets).then(function() {
                return dataSets;
            });
        };

        return {
            "get": get,
            "getAll": getAll,
            "getAllDatasetIds": getAllDatasetIds,
            "upsert": upsert,
            "getAllForOrgUnit": getAllForOrgUnit
        };
    };
});
