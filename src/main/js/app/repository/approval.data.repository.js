define(["moment", "lodash", "dateUtils"], function(moment, _, dateUtils) {
    return function(db, $q) {
        var self = this;

        this.getApprovalData = function(periodsAndOrgUnits) {
            var store = db.objectStore('approvals');

            if (!_.isArray(periodsAndOrgUnits))
                return store.find([dateUtils.getFormattedPeriod(periodsAndOrgUnits.period), periodsAndOrgUnits.orgUnit]);

            var getApprovalDataPromises = [];
            _.each(periodsAndOrgUnits, function(periodAndOrgUnit) {
                getApprovalDataPromises.push(store.find([dateUtils.getFormattedPeriod(periodAndOrgUnit.period), periodAndOrgUnit.orgUnit]));
            });
            return $q.all(getApprovalDataPromises).then(function(allApprovalData) {
                return _.compact(allApprovalData);
            });
        };

        this.getApprovalDataForPeriodsOrgUnits = function(startPeriod, endPeriod, orgUnits) {
            var store = db.objectStore('approvals');
            var query = db.queryBuilder().$between(dateUtils.getFormattedPeriod(startPeriod), dateUtils.getFormattedPeriod(endPeriod)).$index("by_period").compile();
            return store.each(query).then(function(approvalData) {
                return _.filter(approvalData, function(ad) {
                    return _.contains(orgUnits, ad.orgUnit);
                });
            });
        };

        this.markAsComplete = function(periodsAndOrgUnits, completedBy) {
            periodsAndOrgUnits = _.isArray(periodsAndOrgUnits) ? periodsAndOrgUnits : [periodsAndOrgUnits];
            var payload = _.map(periodsAndOrgUnits, function(periodAndOrgUnit) {
                return {
                    "period": moment(periodAndOrgUnit.period, "GGGG[W]W").format("GGGG[W]WW"),
                    "orgUnit": periodAndOrgUnit.orgUnit,
                    "completedBy": completedBy,
                    "completedOn": moment().toISOString(),
                    "isComplete": true,
                    "isApproved": false,
                    "status": "NEW",
                    "localStatus": "WAITING_TO_SYNC"
                };
            });

            var store = db.objectStore("approvals");
            return store.upsert(payload);
        };

        this.markAsApproved = function(periodsAndOrgUnits, approvedBy) {
            periodsAndOrgUnits = _.isArray(periodsAndOrgUnits) ? periodsAndOrgUnits : [periodsAndOrgUnits];

            var getApprovals = function() {
                var periods = _.uniq(_.pluck(periodsAndOrgUnits, "period"));
                var query = db.queryBuilder().$index("by_period").$in(periods).compile();
                var store = db.objectStore("approvals");
                var newApprovals = [];
                return store.each(query).then(function(allApprovalsForPeriods) {
                    return _.transform(periodsAndOrgUnits, function(acc, periodAndOrgUnit) {
                        var approval = _.find(allApprovalsForPeriods, {
                            "period": periodAndOrgUnit.period,
                            "orgUnit": periodAndOrgUnit.orgUnit
                        });

                        if (_.isEmpty(approval)) {
                            acc.push({
                                "period": periodAndOrgUnit.period,
                                "orgUnit": periodAndOrgUnit.orgUnit,
                                "completedBy": approvedBy,
                                "completedOn": moment().toISOString(),
                                "isComplete": true
                            });
                        } else {
                            acc.push(approval);
                        }
                    }, []);
                });
            };

            var updateThemAsApproved = function(approvalsInDb) {

                return _.map(approvalsInDb, function(approval) {
                    approval.isApproved = true;
                    approval.approvedBy = approvedBy;
                    approval.approvedOn = moment().toISOString();
                    approval.status = "NEW";
                    approval.localStatus = 'WAITING_TO_SYNC';
                    return approval;
                });
            };

            var saveToIdb = function(approvals) {
                var store = db.objectStore("approvals");
                store.upsert(approvals);
            };

            return getApprovals()
                .then(updateThemAsApproved)
                .then(saveToIdb);
        };

        this.clearApprovals = function(periodsAndOrgUnits) {
            periodsAndOrgUnits = _.isArray(periodsAndOrgUnits) ? periodsAndOrgUnits : [periodsAndOrgUnits];
            var payload = _.map(periodsAndOrgUnits, function(periodAndOrgUnit) {
                return {
                    "period": moment(periodAndOrgUnit.period, "GGGG[W]W").format("GGGG[W]WW"),
                    "orgUnit": periodAndOrgUnit.orgUnit,
                    "isComplete": false,
                    "isApproved": false,
                    "status": "DELETED"
                };
            });

            var store = db.objectStore("approvals");
            return store.upsert(payload);
        };

        this.invalidateApproval = function(period, orgUnit) {
            var store = db.objectStore("approvals");
            return store.delete([dateUtils.getFormattedPeriod(period), orgUnit]);
        };

        this.saveApprovalsFromDhis = function(approvalsFromDhis) {
            var updateLocalStatus = function (approvalsFromDhis, status) {
                if(_.isArray(approvalsFromDhis)) {
                    _.each(approvalsFromDhis, function(approval) {
                        approval.localStatus = status;
                    });
                } else {
                    approvalsFromDhis.localStatus = status;
                }
            };

            var saveApprovals = function (approvals){
                var store = db.objectStore("approvals");
                return store.upsert(approvals);
            };

            updateLocalStatus(approvalsFromDhis, 'DATA_FROM_DHIS');
            return saveApprovals(approvalsFromDhis);
        };

        this.clearStatusFlag = function(period, orgUnit) {
            var periodAndOrgUnit = {
                "period": period,
                "orgUnit": orgUnit
            };
            var store = db.objectStore("approvals");
            return self.getApprovalData(periodAndOrgUnit).then(function(approvalFromDb) {
                return store.upsert(_.omit(approvalFromDb, "status"));
            });
        };

        this.setLocalStatus = function(periodsAndOrgUnits, localStatus) {
            periodsAndOrgUnits = _.map(periodsAndOrgUnits, function(periodAndOrgUnit) {
                return [periodAndOrgUnit.period, periodAndOrgUnit.orgUnit];
            });
            var approvals = db.objectStore("approvals");
            _.each(periodsAndOrgUnits, function(tuple) {
                approvals.find(tuple).then(function (data) {
                    data.localStatus = localStatus;
                    return approvals.upsert(data);
                });
            });
        };
    };
});
