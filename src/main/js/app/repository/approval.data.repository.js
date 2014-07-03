define([], function() {
    return function(db) {
        this.save = function(payload) {
            var store = db.objectStore("completeDataSets");
            return store.upsert(payload);
        };

        this.getCompleteDataValues = function(period, orgUnitId) {
            var filterSoftDeletedApprovals = function(d) {
                return d && d.isDeleted ? undefined : d;
            };

            var store = db.objectStore('completeDataSets');
            return store.find([period, orgUnitId]).then(filterSoftDeletedApprovals);
        };

        this.unapproveLevelOneData = function(period, orgUnit) {
            var unapprove = function(data) {
                if (!data) return;
                data.isDeleted = true;
                var store = db.objectStore('completeDataSets');
                return store.upsert(data);
            };

            return this.getCompleteDataValues(period, orgUnit).then(unapprove);
        };
    };
});