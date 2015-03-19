define(["moment", "lodash", "dateUtils"], function(moment, _, dateUtils) {
    return function(db) {
        var modifiedPayload = function(payload) {
            payload = _.isArray(payload) ? payload : [payload];
            return _.map(payload, function(datum) {
                datum.period = moment(datum.period, "GGGG[W]W").format("GGGG[W]WW");
                return datum;
            });
        };

        this.saveLevelOneApproval = function(payload) {
            var store = db.objectStore("completedDataSets");
            return store.upsert(modifiedPayload(payload));
        };

        this.saveLevelTwoApproval = function(payload) {
            var store = db.objectStore("approvedDataSets");
            return store.upsert(modifiedPayload(payload));
        };

        this.deleteLevelOneApproval = function(period, orgUnitId) {
            var store = db.objectStore("completedDataSets");
            return store.delete([dateUtils.getFormattedPeriod(period), orgUnitId]);
        };

        this.deleteLevelTwoApproval = function(period, orgUnitId) {
            var store = db.objectStore("approvedDataSets");
            return store.delete([dateUtils.getFormattedPeriod(period), orgUnitId]);
        };

        this.getLevelOneApprovalData = function(period, orgUnitId, shouldFilterSoftDeletes) {
            var filterSoftDeletedApprovals = function(d) {
                return shouldFilterSoftDeletes && d && d.status === "DELETED" ? undefined : d;
            };

            var store = db.objectStore('completedDataSets');
            return store.find([dateUtils.getFormattedPeriod(period), orgUnitId]).then(filterSoftDeletedApprovals);
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
            return store.find([dateUtils.getFormattedPeriod(period), orgUnitId]).then(filterSoftDeletedApprovals);
        };

        this.getLevelOneApprovalDataForPeriodsOrgUnits = function(startPeriod, endPeriod, orgUnits) {
            var store = db.objectStore('completedDataSets');
            var query = db.queryBuilder().$between(dateUtils.getFormattedPeriod(startPeriod), dateUtils.getFormattedPeriod(endPeriod)).$index("by_period").compile();
            return store.each(query).then(function(approvalData) {
                return _.filter(approvalData, function(ad) {
                    return _.contains(orgUnits, ad.orgUnit);
                });
            });
        };

        this.getLevelTwoApprovalDataForPeriodsOrgUnits = function(startPeriod, endPeriod, orgUnits) {
            var store = db.objectStore('approvedDataSets');
            var query = db.queryBuilder().$between(dateUtils.getFormattedPeriod(startPeriod), dateUtils.getFormattedPeriod(endPeriod)).$index("by_period").compile();
            return store.each(query).then(function(approvalData) {
                return _.filter(approvalData, function(ad) {
                    return _.contains(orgUnits, ad.orgUnit);
                });
            });
        };

        this.markAsComplete = function(periodsAndOrgUnits, storedBy) {
            var payload = _.map(periodsAndOrgUnits, function(periodAndOrgUnit) {
                return {
                    "period": moment(periodAndOrgUnit.period, "GGGG[W]W").format("GGGG[W]WW"),
                    "orgUnit": periodAndOrgUnit.orgUnit,
                    "storedBy": storedBy,
                    "date": moment().toISOString(),
                    "status": "NEW"
                };
            });

            var store = db.objectStore("completedDataSets");
            return store.upsert(payload);
        };

        this.markAsApproved = function(periodsAndOrgUnits, storedBy) {
            var payload = _.map(periodsAndOrgUnits, function(periodAndOrgUnit) {
                return {
                    "period": moment(periodAndOrgUnit.period, "GGGG[W]W").format("GGGG[W]WW"),
                    "orgUnit": periodAndOrgUnit.orgUnit,
                    "createdByUsername": storedBy,
                    "createdDate": moment().toISOString(),
                    "isAccepted": false,
                    "isApproved": true,
                    "status": "NEW"
                };
            });

            var store = db.objectStore("approvedDataSets");
            return store.upsert(payload);
        };

        this.markAsAccepted = function(periodsAndOrgUnits, storedBy) {
            var payload = _.map(periodsAndOrgUnits, function(periodAndOrgUnit) {
                return {
                    "period": moment(periodAndOrgUnit.period, "GGGG[W]W").format("GGGG[W]WW"),
                    "orgUnit": periodAndOrgUnit.orgUnit,
                    "createdByUsername": storedBy,
                    "createdDate": moment().toISOString(),
                    "isAccepted": true,
                    "isApproved": true,
                    "status": "NEW"
                };
            });

            var store = db.objectStore("approvedDataSets");
            return store.upsert(payload);
        };

        this.markAsNotComplete = function(periodsAndOrgUnits, storedBy) {
            var payload = _.map(periodsAndOrgUnits, function(periodAndOrgUnit) {
                return {
                    "period": moment(periodAndOrgUnit.period, "GGGG[W]W").format("GGGG[W]WW"),
                    "orgUnit": periodAndOrgUnit.orgUnit,
                    "storedBy": storedBy,
                    "date": moment().toISOString(),
                    "status": "DELETED"
                };
            });

            var store = db.objectStore("completedDataSets");
            return store.upsert(payload);
        };

        this.markAsNotApproved = function(periodsAndOrgUnits, storedBy) {
            var payload = _.map(periodsAndOrgUnits, function(periodAndOrgUnit) {
                return {
                    "period": moment(periodAndOrgUnit.period, "GGGG[W]W").format("GGGG[W]WW"),
                    "orgUnit": periodAndOrgUnit.orgUnit,
                    "createdByUsername": storedBy,
                    "createdDate": moment().toISOString(),
                    "isAccepted": false,
                    "isApproved": false,
                    "status": "DELETED"
                };
            });

            var store = db.objectStore("approvedDataSets");
            return store.upsert(payload);
        };
    };
});