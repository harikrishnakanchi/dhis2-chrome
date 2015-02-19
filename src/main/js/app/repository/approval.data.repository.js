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

        this.deleteLevelTwoApproval = function(period, orgUnitId) {
            var store = db.objectStore("approvedDataSets");
            return store.delete([period, orgUnitId]);
        };

        this.getLevelOneApprovalData = function(period, orgUnitId, shouldFilterSoftDeletes) {
            var filterSoftDeletedApprovals = function(d) {
                return shouldFilterSoftDeletes && d && d.status === "DELETED" ? undefined : d;
            };

            var store = db.objectStore('completedDataSets');
            return store.find([period, orgUnitId]).then(filterSoftDeletedApprovals);
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

            return this.getLevelOneApprovalData(period, orgUnit, true).then(unapprove);
        };

        this.unapproveLevelTwoData = function(period, orgUnit) {
            var unapprove = function(data) {
                if (!data) return;
                data.isApproved = false;
                data.status = "DELETED";
                var store = db.objectStore('approvedDataSets');
                return store.upsert(data).then(function() {
                    return data;
                });
            };

            return this.getLevelTwoApprovalData(period, orgUnit, true).then(unapprove);
        };

        this.getLevelTwoApprovalData = function(period, orgUnitId, shouldFilterSoftDeletes) {
            var filterSoftDeletedApprovals = function(d) {
                return shouldFilterSoftDeletes && d && d.status === "DELETED" ? undefined : d;
            };

            var store = db.objectStore('approvedDataSets');
            return store.find([period, orgUnitId]).then(filterSoftDeletedApprovals);
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

        this.getLevelTwoApprovalDataForPeriodsOrgUnits = function(startPeriod, endPeriod, orgUnits) {
            var store = db.objectStore('approvedDataSets');
            var query = db.queryBuilder().$between(startPeriod, endPeriod).$index("by_period").compile();
            return store.each(query).then(function(approvalData) {
                return _.filter(approvalData, function(ad) {
                    return _.contains(orgUnits, ad.orgUnit);
                });
            });
        };
    };
});
