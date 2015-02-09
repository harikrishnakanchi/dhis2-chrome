define(["moment"], function(moment) {
    return function(db) {
        this.getAll = function() {
            var store = db.objectStore("orgUnitGroups");
            return store.getAll();
        };

        this.upsert = function(orgUnitGroups) {
            var store = db.objectStore("orgUnitGroups");

            var addClientLastUpdatedField = function(payload) {
                return _.map(payload, function(p) {
                    p.clientLastUpdated = moment().toISOString();
                    return p;
                });
            };

            orgUnitGroups = addClientLastUpdatedField(orgUnitGroups);
            return store.upsert(orgUnitGroups).then(function() {
                return orgUnitGroups;
            });
        };

        this.upsertDhisDownloadedData = function(payload) {
            var store = db.objectStore("orgUnitGroups");

            return store.upsert(payload).then(function() {
                return payload;
            });
        };

        this.get = function(orgUnitGroupId) {
            var store = db.objectStore("orgUnitGroups");
            return store.find(orgUnitGroupId);
        };

        this.findAll = function(orgUnitGroupIds) {
            var store = db.objectStore("orgUnitGroups");

            var query = db.queryBuilder().$in(orgUnitGroupIds).compile();
            return store.each(query);
        };

    };
});
