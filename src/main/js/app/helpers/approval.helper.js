define(["properties", "datasetTransformer", "moment", "approvalDataTransformer"], function(properties, datasetTransformer, moment, approvalDataTransformer) {
    return function($hustle, $q, $rootScope, orgUnitRepository, dataSetRepository, approvalDataRepository, dataRepository) {
        var approveData = function(approvalData, approvalFn, approvalType) {
            var saveToDhis = function() {
                return $hustle.publish({
                    "data": approvalData,
                    "type": approvalType
                }, "dataValues");
            };

            return approvalFn(approvalData).then(saveToDhis);
        };

        var markDataAsComplete = function(data) {
            var dataForApproval = {
                "dataSets": data.dataSets,
                "period": data.period,
                "orgUnit": data.orgUnit,
                "storedBy": data.storedBy,
                "date": moment().toISOString(),
                "status": "NEW"
            };

            return approveData(dataForApproval, approvalDataRepository.saveLevelOneApproval, "uploadCompletionData").then(function() {
                return data;
            });
        };

        var markDataAsApproved = function(data) {
            var dataForApproval = {
                "dataSets": data.dataSets,
                "period": data.period,
                "orgUnit": data.orgUnit,
                "createdByUsername": data.storedBy,
                "createdDate": moment().toISOString(),
                "isApproved": true,
                "status": "NEW"
            };

            return approveData(dataForApproval, approvalDataRepository.saveLevelTwoApproval, "uploadApprovalData");
        };

        var autoApproveExistingData = function(orgUnit) {
            var orgUnitId = orgUnit.id;

            var autoApprove = function(data) {
                var approvalData = approvalDataTransformer.generateBulkApprovalData(data[0], data[1], "service.account");
                return $q.all(_.map(approvalData, function(datum) {
                    return markDataAsComplete(datum).then(markDataAsApproved);
                }));
            };

            return orgUnitRepository.getAllModulesInProjects([orgUnitId], false).then(function(modules) {
                return $q.all([getSubmittedPeriodsForModules(modules, properties.weeksForAutoApprove), dataSetRepository.getAll()])
                    .then(autoApprove)
                    .then(function(data) {
                        return data;
                    });
            });
        };

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

                        if (data.isAccepted) {
                            return 3;
                        } else if (data.isApproved) {
                            return 2;
                        }
                    }
                };

                var getNextApprovalLevel = function(currentApprovalLevel, submitted) {
                    if (!currentApprovalLevel && submitted) return 1;
                    return currentApprovalLevel < 3 ? currentApprovalLevel + 1 : undefined;
                };

                return _.map(modules, function(mod) {
                    var status = _.map(_.range(properties.weeksToDisplayStatusInDashboard, 0, -1), function(i) {
                        var period = getPeriod(moment().isoWeek(moment().isoWeek() - i));
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

            return orgUnitRepository.getAllModulesInProjects([orgUnitId], false).then(function(modules) {
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

        var getPeriod = function(m) {
            return m.year() + "W" + m.isoWeek();
        };

        var getSubmittedPeriodsForModules = function(modules, numOfWeeks) {
            var endPeriod = getPeriod(moment());
            var startPeriod = getPeriod(moment().subtract(numOfWeeks, 'week'));

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
            var endPeriod = getPeriod(moment());
            var startPeriod = getPeriod(moment().subtract(numOfWeeks, 'week'));

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
            var endPeriod = getPeriod(moment());
            var startPeriod = getPeriod(moment().subtract(numOfWeeks, 'week'));

            return approvalDataRepository.getLevelTwoApprovalDataForPeriodsOrgUnits(startPeriod, endPeriod, _.pluck(modules, "id")).then(function(data) {
                data = filterDeletedData(data);
                return _.groupBy(data, 'orgUnit');
            });
        };

        return {
            "markDataAsComplete": markDataAsComplete,
            "markDataAsApproved": markDataAsApproved,
            "autoApproveExistingData": autoApproveExistingData,
            "getApprovalStatus": getApprovalStatus
        };
    };
});