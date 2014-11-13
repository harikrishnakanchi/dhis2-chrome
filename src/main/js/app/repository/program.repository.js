define([], function() {
    return function(db) {
        this.getProgramsForOrgUnit = function(orgUnit) {
            var store = db.objectStore("programs");
            var query = db.queryBuilder().$eq(orgUnit).$index("by_organisationUnit").compile();
            return store.each(query);
        };

        this.upsert = function(payload) {
            var store = db.objectStore("programs");
            return store.upsert(payload).then(function() {
                return payload;
            });
        };

        this.getProgram = function(programId) {
            var store = db.objectStore("programs");
            return store.find(programId);
        };
    };
});