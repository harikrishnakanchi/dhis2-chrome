define([], function() {
    return function(db) {
        this.saveLevelOneApproval = function(payload) {
            var store = db.objectStore("completedDataSets");
            return store.upsert(payload);
        };

        this.saveLevelTwoApproval = function(payload) {
            var store = db.objectStore("approvedDataSets");
            return store.upsert(payload);
        };

        this.deleteLevelOneApproval = function(period, orgUnitId) {
            var store = db.objectStore("completedDataSets");
            return store.delete([period, orgUnitId]);
        };

        this.getCompleteDataValues = function(period, orgUnitId) {
            var filterSoftDeletedApprovals = function(d) {
                return d && d.status === "DELETED" ? undefined : d;
            };

            var store = db.objectStore('completedDataSets');
            return store.find([period, orgUnitId]).then(filterSoftDeletedApprovals);
        };

        this.getLevelOneApprovalData = function(period, orgUnitId) {
            var store = db.objectStore('completedDataSets');
            return store.find([period, orgUnitId]);
        };

        this.unapproveLevelOneData = function(period, orgUnit) {
            var unapprove = function(data) {
                if (!data) return;
                data.status = "DELETED";
                var store = db.objectStore('completedDataSets');
                return store.upsert(data).then(function() {
                    return data;
                });
            };

            return this.getCompleteDataValues(period, orgUnit).then(unapprove);
        };

        this.getLevelTwoApprovalData = function(period, orgUnitId) {
            var store = db.objectStore('approvedDataSets');
            return store.find([period, orgUnitId]);
        };

        this.getLevelOneApprovalDataForPeriodsOrgUnits = function(startPeriod, endPeriod, orgUnits) {
            var store = db.objectStore('completedDataSets');
            var query = db.queryBuilder().$between(startPeriod, endPeriod).$index("by_period").compile();
            return store.each(query).then(function(approvalData) {
                return _.filter(approvalData, function(ad) {
                    return _.contains(orgUnits, ad.orgUnit);
                });
            });
        };
    };
});