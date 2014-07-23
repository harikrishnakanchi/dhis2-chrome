define(["properties", "moment"], function(properties, moment) {
    return function($http, db, $q) {
        this.markAsComplete = function(dataSets, period, orgUnit, storedBy, completionDate) {
            return $http.post(properties.dhis.url + "/api/completeDataSetRegistrations", undefined, {
                params: {
                    "ds": dataSets,
                    "pe": period,
                    "ou": orgUnit,
                    "sb": storedBy,
                    "cd": completionDate,
                    "multiOu": true
                }
            });
        };

        this.markAsApproved = function(dataSets, period, orgUnit, approvedBy, approvalDate) {
            return $http.post(properties.dhis.url + "/api/dataApprovals", undefined, {
                params: {
                    "ds": dataSets,
                    "pe": period,
                    "ou": orgUnit,
                    "ab": approvedBy,
                    "ad": approvalDate
                }
            });
        };

        this.markAsUnapproved = function(dataSets, period, orgUnit) {
            return $http.delete(properties.dhis.url + "/api/dataApprovals", {
                params: {
                    "ds": dataSets,
                    "pe": period,
                    "ou": orgUnit
                }
            });
        };

        this.getAllLevelOneApprovalData = function(orgUnits, dataSets) {
            var transform = function(completeDataSetRegistrationList) {
                var registrationsGroupedByPeriodAndOu = _.groupBy(completeDataSetRegistrationList, function(registration) {
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
                if (response.data.completeDataSetRegistrationList)
                    deferred.resolve(transform(response.data.completeDataSetRegistrationList));
                else
                    deferred.resolve([]);
                return deferred.promise;
            };

            return $http.get(properties.dhis.url + '/api/completeDataSetRegistrations', {
                "params": {
                    "dataSet": dataSets,
                    "startDate": "1900-01-01",
                    "endDate": moment().format("YYYY-MM-DD"),
                    "orgUnit": orgUnits,
                    "children": true
                }
            }).then(onSuccess);
        };

        this.getAllLevelTwoApprovalData = function(orgUnits, dataSets) {
            var transform = function(dataApprovalStateResponses) {
                var approvalDataGroupedByPeriodAndOu = _.groupBy(dataApprovalStateResponses, function(approvalData) {
                    return [approvalData.period.id, approvalData.organisationUnit.id];
                });

                return _.transform(approvalDataGroupedByPeriodAndOu, function(acc, item) {
                    var isApproved = false;
                    var isAccepted = false;

                    switch (_.pluck(item, 'state')[0]) {
                        case "APPROVED_HERE":
                        case "APPROVED_ELSEWHERE":
                            isApproved = true;
                            break;
                        case "ACCEPTED_HERE":
                        case "ACCEPTED_ELSEWHERE":
                            isApproved = true;
                            isAccepted = true;
                            break;
                    }

                    if (isApproved || isAccepted)
                        acc.push({
                            'period': _.pluck(item, 'period')[0].id,
                            'orgUnit': _.pluck(item, 'organisationUnit')[0].id,
                            'dataSets': _.pluck(_.pluck(item, 'dataSet'), 'id'),
                            "isApproved": isApproved,
                            "isAccepted": isAccepted,
                            "createdByUsername": _.pluck(item, 'createdByUsername')[0],
                            "createdDate": _.pluck(item, 'createdDate')[0]
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

            return $http.get(properties.dhis.url + '/api/dataApprovals/status', {
                "params": {
                    "dataSet": dataSets,
                    "startDate": "1900-01-01",
                    "endDate": moment().format("YYYY-MM-DD"),
                    "orgUnits": orgUnits,
                    "children": true
                }
            }).then(onSuccess);
        };

        this.markAsIncomplete = function(dataSets, period, orgUnit) {
            return $http.delete(properties.dhis.url + "/api/completeDataSetRegistrations", {
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