define(["properties", "moment", "dhisUrl", "lodash"], function(properties, moment, dhisUrl, _) {
    return function($http, db, $q) {
        this.markAsComplete = function(dataSets, period, orgUnit, storedBy, completionDate) {
            var payload = _.transform(dataSets, function(result, ds) {
                result.push({
                    "ds": ds,
                    "pe": period,
                    "ou": orgUnit,
                    "sb": storedBy,
                    "cd": completionDate,
                    "multiOu": true
                });
            });

            return $http.post(dhisUrl.approvalMultipleL1, payload);
        };

        this.markAsApproved = function(dataSets, period, orgUnit, approvedBy, approvalDate) {
            var payload = _.transform(dataSets, function(result, ds) {
                result.push({
                    "ds": ds,
                    "pe": period,
                    "ou": orgUnit,
                    "ab": approvedBy,
                    "ad": approvalDate
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

        this.markAsAccepted = function(dataSets, period, orgUnit, approvedBy, approvalDate) {
            var payload = _.transform(dataSets, function(result, ds) {
                result.push({
                    "ds": ds,
                    "pe": period,
                    "ou": orgUnit,
                    "ab": approvedBy,
                    "ad": approvalDate
                });
            });
            return $http.post(dhisUrl.approvalMultipleL3, payload);
        };

        this.getAllLevelOneApprovalData = function(orgUnits, dataSets) {
            var transform = function(completeDataSetRegistrations) {
                var registrationsGroupedByPeriodAndOu = _.groupBy(completeDataSetRegistrations, function(registration) {
                    return [registration.period.id, registration.organisationUnit.id];
                });

                return _.map(registrationsGroupedByPeriodAndOu, function(item) {
                    return {
                        'period': _.pluck(item, 'period')[0].id,
                        'orgUnit': _.pluck(item, 'organisationUnit')[0].id,
                        'storedBy': _.pluck(item, 'storedBy')[0],
                        'date': _.pluck(item, 'date')[0],
                        'dataSets': _.pluck(_.pluck(item, 'dataSet'), 'id')
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
                    var isAccepted = false;

                    var itemAtLowestApprovalLevel = _.minWhile(groupedItems, "state", approvalStatusOrder);

                    switch (itemAtLowestApprovalLevel.state) {
                        case "APPROVED_ABOVE":
                        case "APPROVED_HERE":
                            isApproved = true;
                            break;
                        case "ACCEPTED_HERE":
                            isApproved = true;
                            isAccepted = true;
                            break;
                    }

                    if (isApproved || isAccepted)
                        acc.push({
                            'period': _.pluck(groupedItems, 'period')[0].id,
                            'orgUnit': _.pluck(groupedItems, 'organisationUnit')[0].id,
                            "isApproved": isApproved,
                            "isAccepted": isAccepted
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
