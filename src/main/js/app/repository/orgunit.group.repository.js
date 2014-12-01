define([], function() {
    return function(db) {
        this.getAll = function() {
            var store = db.objectStore("orgUnitGroups");
            return store.getAll();
        };

        this.upsert = function(orgUnitGroups) {
            var store = db.objectStore("orgUnitGroups");
            return store.upsert(orgUnitGroups).then(function() {
                return orgUnitGroups;
            });
        };
    };
});