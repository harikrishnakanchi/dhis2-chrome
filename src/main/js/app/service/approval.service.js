define(["properties", "moment", "dhisUrl", "lodash", "dateUtils"], function(properties, moment, dhisUrl, _, dateUtils) {
    return function($http, db, $q) {
        var APPROVED_STATES = ['APPROVED_ABOVE', 'APPROVED_HERE', 'ACCEPTED_HERE'];

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
            var isAnyDataSetIsLocked = function (response) {
                var responseData = _.isString(response.data) ? response.data : response.data.message;
                if (response.status == 409 && _.contains(responseData, "Data set is locked:")) {
                    return $q.when();
                }
                else {
                    return $q.reject();
                }
            };
            // TODO: Remove catch block after 6.0 update
            return $http.post(dhisUrl.approvalMultipleL1, payload)
                .catch(isAnyDataSetIsLocked);
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

        this.getCompletionData = function(orgUnits, originOrgUnits, dataSets, periodRange) {
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

            var startDate,
                endDate;

            if(periodRange) {
                endDate = moment(_.last(periodRange), 'YYYY[W]WW').endOf('isoWeek').format("YYYY-MM-DD");
                startDate = moment(_.first(periodRange), 'YYYY[W]WW').startOf('isoWeek').format("YYYY-MM-DD");
            } else {
                endDate = moment().format("YYYY-MM-DD");
                startDate = moment(endDate).subtract(properties.projectDataSync.numWeeksToSync, "week").format("YYYY-MM-DD");
            }

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
                var groupedApprovalResponses = _.groupBy(response.data.dataApprovalStateResponses, function(approvalData) {
                    return [approvalData.period.id, approvalData.organisationUnit.id];
                });

                return _.transform(groupedApprovalResponses, function(results, approvalResponses) {
                    var allResponsesAreApproved = _.all(approvalResponses, function(approvalResponse) {
                        return _.includes(APPROVED_STATES, approvalResponse.state);
                    });

                    if (allResponsesAreApproved) {
                        var oneApprovalResponse = _.first(approvalResponses);
                        results.push({
                            period: dateUtils.getFormattedPeriod(oneApprovalResponse.period.id),
                            orgUnit: oneApprovalResponse.organisationUnit.id,
                            isApproved: true,
                            approvedBy: oneApprovalResponse.createdByUsername,
                            approvedOn: oneApprovalResponse.createdDate
                        });
                    }
                }, []);
            };

            var startDate, endDate;

            if(periodRange) {
                endDate = moment(_.last(periodRange), 'YYYY[W]WW').endOf('isoWeek').format("YYYY-MM-DD");
                startDate = moment(_.first(periodRange), 'YYYY[W]WW').startOf('isoWeek').format("YYYY-MM-DD");
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
