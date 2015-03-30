define(["properties", "datasetTransformer", "moment", "approvalDataTransformer", "dateUtils"], function(properties, datasetTransformer, moment, approvalDataTransformer, dateUtils) {
    return function($hustle, $q, $rootScope, orgUnitRepository, datasetRepository, approvalDataRepository, dataRepository) {
        var getApprovalStatus = function(orgUnitId) {
            var getStatus = function(modules, submittedPeriods, approvedPeriodsData) {
                var dataSetCompletePeriods = approvedPeriodsData.dataSetCompletePeriods;
                var approvalData = approvedPeriodsData.approvalData;
                var findIndex = function(array, orgUnitId) {
                    return _.findIndex(array, function(obj) {
                        return obj.orgUnitId === orgUnitId;
                    });
                };

                var isSubmitted = function(submittedPeriods, orgUnitId, period) {
                    var index = findIndex(submittedPeriods, orgUnitId);
                    return index > -1 ? _.contains(submittedPeriods[index].period, period) : false;
                };

                var isComplete = function(dataSetCompletePeriods, orgUnitId, period) {
                    var index = findIndex(dataSetCompletePeriods, orgUnitId);
                    return index > -1 ? _.contains(dataSetCompletePeriods[index].period, period) : false;
                };

                var getApprovalLevel = function(approvalData, orgUnitId, period) {
                    if (approvalData[orgUnitId]) {
                        var data = _.find(approvalData[orgUnitId], {
                            "period": period
                        }) || {};

                        if (data.isApproved) {
                            return 2;
                        }
                    }
                };

                var getNextApprovalLevel = function(currentApprovalLevel, submitted) {
                    if (!currentApprovalLevel && submitted) return 1;
                    return currentApprovalLevel < 2 ? currentApprovalLevel + 1 : undefined;
                };

                var getWeeksToDisplayStatus = function(openingDate) {
                    var orgUnitDuration = moment().diff(moment(openingDate), 'weeks');
                    return orgUnitDuration > properties.weeksToDisplayStatusInDashboard ? properties.weeksToDisplayStatusInDashboard : orgUnitDuration + 1;
                };

                return _.map(modules, function(mod) {
                    var weeksToDisplayStatus = getWeeksToDisplayStatus(mod.openingDate);
                    var status = _.map(_.range(weeksToDisplayStatus - 1, -1, -1), function(i) {
                        var period = dateUtils.toDhisFormat(moment().isoWeek(moment().isoWeek() - i));
                        var submitted = isSubmitted(submittedPeriods, mod.id, period);
                        var approvalLevel = isComplete(dataSetCompletePeriods, mod.id, period) ? 1 : undefined;
                        approvalLevel = getApprovalLevel(approvalData, mod.id, period) || approvalLevel;

                        var nextApprovalLevel = getNextApprovalLevel(approvalLevel, submitted);

                        return {
                            "period": period,
                            "submitted": submitted,
                            "nextApprovalLevel": nextApprovalLevel
                        };
                    });

                    return {
                        "moduleId": mod.id,
                        "moduleName": mod.parent.name + " - " + mod.name,
                        "status": status
                    };
                });
            };

            return orgUnitRepository.getAllModulesInOrgUnitsExceptCurrentModules([orgUnitId], true).then(function(modules) {
                return $q.all([
                    getSubmittedPeriodsForModules(modules, properties.weeksToDisplayStatusInDashboard),
                    getApprovedPeriodsForModules(modules, properties.weeksToDisplayStatusInDashboard)
                ]).then(function(data) {
                    var submittedPeriods = data[0];
                    var approvedPeriodsData = data[1];
                    return getStatus(modules, submittedPeriods, approvedPeriodsData);
                });
            });
        };

        var getSubmittedPeriodsForModules = function(modules, numOfWeeks) {
            var endPeriod = dateUtils.toDhisFormat(moment());
            var startPeriod = dateUtils.toDhisFormat(moment().subtract(numOfWeeks, 'week'));

            var filterDraftData = function(data) {
                return _.filter(data, function(datum) {
                    return datum.isDraft !== true;
                });
            };

            return dataRepository.getDataValuesForPeriodsOrgUnits(startPeriod, endPeriod, _.pluck(modules, "id")).then(function(data) {
                data = filterDraftData(data);
                var dataValuesByOrgUnit = _.groupBy(data, 'orgUnit');
                return _.map(_.keys(dataValuesByOrgUnit), function(moduleId) {
                    return {
                        "orgUnitId": moduleId,
                        "period": _.pluck(dataValuesByOrgUnit[moduleId], "period")
                    };
                });
            });
        };

        var filterDeletedData = function(data) {
            return _.filter(data, function(datum) {
                return datum.status !== "DELETED";
            });
        };

        var filterLevelOneApprovedData = function(data) {
            return _.filter(data, function(datum) {
                return datum.isComplete && !datum.isApproved && datum.status !== "DELETED";
            });
        };

        var filterLevelTwoApprovedData = function(data) {
            return _.filter(data, function(datum) {
                return datum.isApproved && datum.status !== "DELETED";
            });
        };

        var getApprovedPeriodsForModules = function(modules, numOfWeeks) {
            var result = {};
            var endPeriod = dateUtils.toDhisFormat(moment());
            var startPeriod = dateUtils.toDhisFormat(moment().subtract(numOfWeeks, 'week'));

            return approvalDataRepository.getApprovalDataForPeriodsOrgUnits(startPeriod, endPeriod, _.pluck(modules, "id")).then(function(data) {
                var completeData = filterLevelOneApprovedData(data);
                var approvedData = filterLevelTwoApprovedData(data);

                var completeDataByOrgUnit = _.groupBy(completeData, 'orgUnit');
                result.dataSetCompletePeriods = _.map(_.keys(completeDataByOrgUnit), function(moduleId) {
                    return {
                        "orgUnitId": moduleId,
                        "period": _.pluck(completeDataByOrgUnit[moduleId], "period")
                    };
                });
                result.approvalData = _.groupBy(data, 'orgUnit');
                return result;
            });
        };

        return {
            "getApprovalStatus": getApprovalStatus
        };
    };
});
