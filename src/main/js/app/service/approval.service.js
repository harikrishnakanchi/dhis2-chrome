define(["properties", "moment", "dhisUrl", "lodash", "dateUtils"], function(properties, moment, dhisUrl, _, dateUtils) {
    return function($http, db, $q) {
        this.markAsComplete = function(dataSets, periodsAndOrgUnits, completedBy, completedOn) {
            var payload = [];
            _.each(periodsAndOrgUnits, function(periodAndOrgUnit) {
                _.each(dataSets, function(ds) {
                    payload.push({
                        "ds": ds,
                        "pe": periodAndOrgUnit.period,
                        "ou": periodAndOrgUnit.orgUnit,
                        "sb": completedBy,
                        "cd": completedOn,
                        "multiOu": true
                    });
                });
            });
            return $http.post(dhisUrl.approvalMultipleL1, payload);
        };

        this.markAsApproved = function(dataSets, periodsAndOrgUnits, approvedBy, approvalDate) {
            var payload = [];
            _.each(periodsAndOrgUnits, function(periodAndOrgUnit) {
                _.each(dataSets, function(ds) {
                    payload.push({
                        "ds": ds,
                        "pe": periodAndOrgUnit.period,
                        "ou": periodAndOrgUnit.orgUnit,
                        "ab": approvedBy,
                        "ad": approvalDate
                    });
                });
            });

            return $http.post(dhisUrl.approvalMultipleL2, payload);
        };

        this.markAsUnapproved = function(dataSets, period, orgUnit) {
            return $http.delete(dhisUrl.approvalL2, {
                params: {
                    "ds": dataSets,
                    "pe": period,
                    "ou": orgUnit
                }
            });
        };

        this.getAllLevelOneApprovalData = function(orgUnits, dataSets) {
            var transform = function(completeDataSetRegistrations) {
                var registrationsGroupedByPeriodAndOu = _.groupBy(completeDataSetRegistrations, function(registration) {
                    return [registration.period.id, registration.organisationUnit.id];
                });

                return _.map(registrationsGroupedByPeriodAndOu, function(item) {
                    return {
                        'period': dateUtils.getFormattedPeriod(_.pluck(item, 'period')[0].id),
                        'orgUnit': _.pluck(item, 'organisationUnit')[0].id,
                        'completedBy': _.pluck(item, 'storedBy')[0],
                        'completedOn': _.pluck(item, 'date')[0],
                        "isComplete": true
                    };
                });
            };

            var onSuccess = function(response) {
                var deferred = $q.defer();
                if (response.data.completeDataSetRegistrations)
                    deferred.resolve(transform(response.data.completeDataSetRegistrations));
                else
                    deferred.resolve([]);
                return deferred.promise;
            };

            var endDate = moment().format("YYYY-MM-DD");
            var startDate = moment(endDate).subtract(properties.projectDataSync.numWeeksToSync, "week").format("YYYY-MM-DD");

            return $http.get(dhisUrl.approvalL1, {
                "params": {
                    "dataSet": dataSets,
                    "startDate": startDate,
                    "endDate": endDate,
                    "orgUnit": orgUnits,
                    "children": true
                }
            }).then(onSuccess);
        };

        this.getAllLevelTwoApprovalData = function(orgUnits, dataSets) {
            var transform = function(dataApprovalStateResponses) {
                var approvalStatusOrder = {
                    "UNAPPROVABLE": -1,
                    "UNAPPROVED_READY": 0,
                    "UNAPPROVED_ABOVE": 0,
                    "APPROVED_ABOVE": 1,
                    "APPROVED_HERE": 1,
                    "ACCEPTED_HERE": 2
                };

                var approvalDataGroupedByPeriodAndOu = _.groupBy(dataApprovalStateResponses, function(approvalData) {
                    return [approvalData.period.id, approvalData.organisationUnit.id];
                });

                return _.transform(approvalDataGroupedByPeriodAndOu, function(acc, groupedItems) {
                    var isApproved = false;

                    var itemAtLowestApprovalLevel = _.minWhile(groupedItems, "state", approvalStatusOrder);

                    switch (itemAtLowestApprovalLevel.state) {
                        case "APPROVED_ABOVE":
                        case "APPROVED_HERE":
                        case "ACCEPTED_HERE":
                            isApproved = true;
                            break;
                    }

                    if (isApproved)
                        acc.push({
                            'period': dateUtils.getFormattedPeriod(_.pluck(groupedItems, 'period')[0].id),
                            'orgUnit': _.pluck(groupedItems, 'organisationUnit')[0].id,
                            "isApproved": isApproved,
                            "approvedBy": _.pluck(groupedItems, 'createdByUsername')[0],
                            "approvedOn": _.pluck(groupedItems, 'createdDate')[0],
                        });
                }, []);
            };

            var onSuccess = function(response) {
                var deferred = $q.defer();
                if (response.data.dataApprovalStateResponses)
                    deferred.resolve(transform(response.data.dataApprovalStateResponses));
                else
                    deferred.resolve([]);
                return deferred.promise;
            };

            var endDate = moment().format("YYYY-MM-DD");
            var startDate = moment(endDate).subtract(properties.projectDataSync.numWeeksToSync, "week").format("YYYY-MM-DD");

            return $http.get(dhisUrl.approvalStatus, {
                "params": {
                    "ds": dataSets,
                    "startDate": startDate,
                    "endDate": endDate,
                    "ou": orgUnits,
                    "pe": "Weekly",
                    "children": true
                }
            }).then(onSuccess);
        };

        this.markAsIncomplete = function(dataSets, period, orgUnit) {
            return $http.delete(dhisUrl.approvalL1, {
                params: {
                    "ds": dataSets,
                    "pe": period,
                    "ou": orgUnit,
                    "multiOu": true
                }
            });
        };
    };
});
