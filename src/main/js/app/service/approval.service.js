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

        this.markAsIncomplete = function(dataSets, periodsAndOrgUnits) {
            var markAsIncompletePromises = _.map(periodsAndOrgUnits, function(periodAndOrgUnit) {
                return $http.delete(dhisUrl.approvalL1, {
                    params: {
                        "ds": dataSets,
                        "pe": periodAndOrgUnit.period,
                        "ou": periodAndOrgUnit.orgUnit,
                        "multiOu": true
                    }
                });
            });

            return $q.all(markAsIncompletePromises);
        };

        this.markAsUnapproved = function(dataSets, periodsAndOrgUnits) {

            var doGet = function(periodAndOrgUnit) {
                var startDate = moment(periodAndOrgUnit.period, "GGGG[W]W");

                return $http.get(dhisUrl.approvalStatus, {
                    "params": {
                        "ds": dataSets,
                        "startDate": startDate.format("YYYY-MM-DD"),
                        "endDate": startDate.add(6, 'days').format("YYYY-MM-DD"),
                        "ou": [periodAndOrgUnit.orgUnit],
                        "pe": "Weekly"
                    }
                });
            };

            var doDelete = function(periodAndOrgUnit, responseFromGET) {
                var mayUnapprovePermissions = _.map(responseFromGET.data.dataApprovalStateResponses, function(status) {
                    return status.permissions.mayUnapprove;
                });

                if (!_.isEmpty(responseFromGET.data.dataApprovalStateResponses) && _.any(mayUnapprovePermissions)) {
                    return $http.delete(dhisUrl.approvalL2, {
                        params: {
                            "ds": dataSets,
                            "pe": periodAndOrgUnit.period,
                            "ou": periodAndOrgUnit.orgUnit
                        }
                    });
                }
            };

            var markAsUnapprovedPromises = _.map(periodsAndOrgUnits, function(periodAndOrgUnit) {
                return doGet(periodAndOrgUnit).then(_.curry(doDelete)(periodAndOrgUnit));
            });

            return $q.all(markAsUnapprovedPromises);
        };

        this.getCompletionData = function(orgUnits, originOrgUnits, dataSets) {
            var transform = function(response) {
                if (!response.data.completeDataSetRegistrations)
                    return [];

                var indexedOriginOrgUnits = _.indexBy(originOrgUnits, "id");

                return _.transform(response.data.completeDataSetRegistrations, function(results, registration) {

                    var period = dateUtils.getFormattedPeriod(registration.period.id);
                    var orgUnit = registration.organisationUnit.id;
                    if (indexedOriginOrgUnits[orgUnit])
                        orgUnit = indexedOriginOrgUnits[orgUnit].parent.id;

                    if (!_.any(results, {
                            "period": period,
                            "orgUnit": orgUnit
                        })) {
                        results.push({
                            'period': period,
                            'orgUnit': orgUnit,
                            'completedBy': registration.storedBy,
                            'completedOn': registration.date,
                            'isComplete': true
                        });
                    }
                }, []);
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
            }).then(transform);
        };

        this.getApprovalData = function(orgUnit, dataSets, periodRange) {

            var transform = function(response) {
                if (!response.data.dataApprovalStateResponses)
                    return [];

                var approvalStatusOrder = {
                    "UNAPPROVABLE": -1,
                    "UNAPPROVED_READY": 0,
                    "UNAPPROVED_ABOVE": 0,
                    "APPROVED_ABOVE": 1,
                    "APPROVED_HERE": 1,
                    "ACCEPTED_HERE": 2
                };

                var approvalDataGroupedByPeriodAndOu = _.groupBy(response.data.dataApprovalStateResponses, function(approvalData) {
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

            var startDate, endDate;

            if(periodRange) {
                endDate = moment(_.last(periodRange), 'YYYY[W]WW').format("YYYY-MM-DD");
                startDate = moment(periodRange[0], 'YYYY[W]WW').format("YYYY-MM-DD");
            } else {
                endDate = moment().format("YYYY-MM-DD");
                startDate = moment(endDate).subtract(properties.projectDataSync.numWeeksToSync, "week").format("YYYY-MM-DD");
            }

            return $http.get(dhisUrl.approvalStatus, {
                "params": {
                    "ds": dataSets,
                    "startDate": startDate,
                    "endDate": endDate,
                    "ou": orgUnit,
                    "pe": "Weekly"
                }
            }).then(transform);
        };
    };
});
