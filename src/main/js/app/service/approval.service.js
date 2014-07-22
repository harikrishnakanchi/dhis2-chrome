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

        this.markAsApproved = function(dataSets, period, orgUnit) {
            return $http.post(properties.dhis.url + "/api/dataApprovals", undefined, {
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
                return _.map(approvalDataGroupedByPeriodAndOu, function(item) {
                    return {
                        'period': _.pluck(item, 'period')[0].id,
                        'orgUnit': _.pluck(item, 'organisationUnit')[0].id,
                        'dataSets': _.pluck(_.pluck(item, 'dataSet'), 'id'),
                        'state': _.pluck(item, 'state')[0],
                        "mayApprove": _.pluck(item, 'mayApprove')[0],
                        "mayUnapprove": _.pluck(item, 'mayUnapprove')[0],
                        "mayAccept": _.pluck(item, 'mayAccept')[0],
                        "mayUnaccept": _.pluck(item, 'mayUnaccept')[0]
                    };
                });
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
                    "orgUnit": orgUnits
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