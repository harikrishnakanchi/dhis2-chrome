define(["properties", "moment", "lodash"], function(properties, moment, _) {
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

            return $http.post(properties.dhis.url + "/api/completeDataSetRegistrations", payload);
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

            return $http.post(properties.dhis.url + "/api/dataApprovals", payload);
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

            var endDate = moment().format("YYYY-MM-DD");
            var startDate = moment(endDate).subtract(properties.projectDataSync.numWeeksToSync, "week").format("YYYY-MM-DD");

            return $http.get(properties.dhis.url + '/api/completeDataSetRegistrations', {
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

                var approvalDataGroupedByPeriodAndOu = _.groupBy(dataApprovalStateResponses, function(approvalData) {
                    return [approvalData.period.id, approvalData.organisationUnit.id];
                });

                return _.transform(approvalDataGroupedByPeriodAndOu, function(acc, groupedItems) {

                    var isApproved = false;
                    var isAccepted = false;
                    var createdBy;
                    var createdOn;

                    var dataSets = [];

                    _.each(groupedItems, function(item) {
                        switch (item.state) {
                            case "APPROVED_HERE":
                            case "APPROVED_ELSEWHERE":
                                isApproved = true;
                                dataSets.push(item.dataSet);
                                createdBy = item.createdByUsername;
                                createdOn = item.createdDate;
                                break;
                            case "ACCEPTED_HERE":
                            case "ACCEPTED_ELSEWHERE":
                                isApproved = true;
                                isAccepted = true;
                                dataSets.push(item.dataSet);
                                createdBy = item.createdByUsername;
                                createdOn = item.createdDate;
                                break;
                        }
                    });

                    if (!_.isEmpty(dataSets) && (isApproved || isAccepted))
                        acc.push({
                            'period': _.pluck(groupedItems, 'period')[0].id,
                            'orgUnit': _.pluck(groupedItems, 'organisationUnit')[0].id,
                            'dataSets': _.pluck(dataSets, 'id'),
                            "isApproved": isApproved,
                            "isAccepted": isAccepted,
                            "createdByUsername": createdBy,
                            "createdDate": createdOn
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


            return $http.get(properties.dhis.url + '/api/dataApprovals/status', {
                "params": {
                    "dataSet": dataSets,
                    "startDate": startDate,
                    "endDate": endDate,
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