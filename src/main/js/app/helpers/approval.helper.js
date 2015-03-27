define(["properties", "datasetTransformer", "moment", "approvalDataTransformer", "dateUtils"], function(properties, datasetTransformer, moment, approvalDataTransformer, dateUtils) {
    return function($hustle, $q, $rootScope, orgUnitRepository, datasetRepository, approvalDataRepository, dataRepository) {
        var getApprovalStatus = function(orgUnitId) {
            var getStatus = function(modules, submittedPeriods, dataSetCompletePeriods, approvalData) {

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
                    getLevelOneApprovedPeriodsForModules(modules, properties.weeksToDisplayStatusInDashboard),
                    getLevelTwoAndThreeApprovedPeriodsForModules(modules, properties.weeksToDisplayStatusInDashboard)
                ]).then(function(data) {
                    var submittedPeriods = data[0];
                    var dataSetCompletePeriods = data[1];
                    var approvalData = data[2];
                    return getStatus(modules, submittedPeriods, dataSetCompletePeriods, approvalData);
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

        var getLevelOneApprovedPeriodsForModules = function(modules, numOfWeeks) {
            var endPeriod = dateUtils.toDhisFormat(moment());
            var startPeriod = dateUtils.toDhisFormat(moment().subtract(numOfWeeks, 'week'));

            return approvalDataRepository.getLevelOneApprovalDataForPeriodsOrgUnits(startPeriod, endPeriod, _.pluck(modules, "id")).then(function(data) {
                data = filterDeletedData(data);
                var approvalDataByOrgUnit = _.groupBy(data, 'orgUnit');
                return _.map(_.keys(approvalDataByOrgUnit), function(moduleId) {
                    return {
                        "orgUnitId": moduleId,
                        "period": _.pluck(approvalDataByOrgUnit[moduleId], "period")
                    };
                });
            });
        };

        var getLevelTwoAndThreeApprovedPeriodsForModules = function(modules, numOfWeeks) {
            var endPeriod = dateUtils.toDhisFormat(moment());
            var startPeriod = dateUtils.toDhisFormat(moment().subtract(numOfWeeks, 'week'));

            return approvalDataRepository.getLevelTwoApprovalDataForPeriodsOrgUnits(startPeriod, endPeriod, _.pluck(modules, "id")).then(function(data) {
                data = filterDeletedData(data);
                return _.groupBy(data, 'orgUnit');
            });
        };

        return {
            "getApprovalStatus": getApprovalStatus
        };
    };
});
