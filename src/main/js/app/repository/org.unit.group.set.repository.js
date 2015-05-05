define([], function() {
    return function(db) {
        this.getAll = function() {
            var store = db.objectStore("organisationUnitGroupSets");
            return store.getAll();
        };
    };
});
