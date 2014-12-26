define(["moment", "properties", "lodash"], function(moment, properties, _) {
    return function(dataService, dataRepository, dataSetRepository, userPreferenceRepository, $q, approvalService, approvalDataRepository, orgUnitRepository) {
        var getPeriod = function(m) {
            return m.year() + "W" + m.isoWeek();
        };

        var getUserModuleIds = function() {
            return userPreferenceRepository.getAll().then(function(userPreferences) {
                userPreferences = userPreferences || [];
                var userProjectIds = _.uniq(_.pluck(_.flatten(userPreferences, "orgUnits"), 'id'));

                if (_.isEmpty(userProjectIds))
                    return [];

                return orgUnitRepository.getAllModulesInProjects(userProjectIds).then(function(userModules) {
                    return _.pluck(userModules, "id");
                });
            });
        };

        var merge = function(list1, list2, equalsPred, lastUpdateDateProperty) {
            lastUpdateDateProperty = lastUpdateDateProperty || "lastUpdated";
            equalsPred = _.curry(equalsPred);
            var mergedList = _.clone(list1);
            return _.transform(list2, function(acc, ele) {
                var resultIndex = _.findIndex(acc, equalsPred(ele));
                if (resultIndex >= 0) {
                    if (ele[lastUpdateDateProperty] > acc[resultIndex][lastUpdateDateProperty]) {
                        acc[resultIndex] = ele;
                    }
                } else {
                    acc.push(ele);
                }
            }, mergedList);
        };

        var downloadApprovalData = function(metadata) {
            var userModuleIds = metadata[0];
            var allDataSetIds = metadata[1];

            if (userModuleIds.length === 0 || allDataSetIds.length === 0) return;

            var saveAllLevelTwoApprovalData = function(dhisApprovalDataList) {

                var mergeAndSaveCompletion = function(dbApprovalDataList) {

                    if (_.isEmpty(dhisApprovalDataList) && _.isEmpty(dbApprovalDataList))
                        return;

                    var l1UpdatePromises = [];
                    _.each(dbApprovalDataList, function(dbApprovalData) {
                        if (dbApprovalData.status === "NEW" || dbApprovalData.status === "DELETED")
                            return;

                        var dhisApprovalData = _.find(dhisApprovalDataList, {
                            "orgUnit": dbApprovalData.orgUnit,
                            "period": dbApprovalData.period
                        });

                        var l1UpdatePromise = dhisApprovalData ? approvalDataRepository.saveLevelTwoApproval(dhisApprovalData) : approvalDataRepository.deleteLevelTwoApproval(dbApprovalData.period, dbApprovalData.orgUnit);
                        l1UpdatePromises.push(l1UpdatePromise);
                    });

                    var newApprovals = _.reject(dhisApprovalDataList, function(dhisApprovalData) {
                        return _.any(dbApprovalDataList, {
                            "orgUnit": dhisApprovalData.orgUnit,
                            "period": dhisApprovalData.period
                        });
                    });
                    var approvalPromise = approvalDataRepository.saveLevelTwoApproval(newApprovals);
                    l1UpdatePromises.push(approvalPromise);

                    return $q.all(l1UpdatePromises);
                };

                var m = moment();
                var startPeriod = getPeriod(m.isoWeek(m.isoWeek() - properties.projectDataSync.numWeeksToSync + 1));
                var endPeriod = getPeriod(moment());

                var moduleIds = _.unique(_.pluck(dhisApprovalDataList, "orgUnit"));

                approvalDataRepository.getLevelTwoApprovalDataForPeriodsOrgUnits(startPeriod, endPeriod, moduleIds).then(mergeAndSaveCompletion);
            };

            return approvalService.getAllLevelTwoApprovalData(userModuleIds, allDataSetIds).then(saveAllLevelTwoApprovalData);
        };


        var downloadCompletionData = function(metadata) {
            var userModuleIds = metadata[0];
            var allDataSetIds = metadata[1];

            if (userModuleIds.length === 0 || allDataSetIds.length === 0) return;

            var saveAllLevelOneApprovalData = function(dhisApprovalDataList) {

                var mergeAndSaveCompletion = function(dbApprovalDataList) {

                    if (_.isEmpty(dhisApprovalDataList) && _.isEmpty(dbApprovalDataList))
                        return;

                    var l1UpdatePromises = [];
                    _.each(dbApprovalDataList, function(dbApprovalData) {
                        if (dbApprovalData.status === "NEW" || dbApprovalData.status === "DELETED")
                            return;

                        var dhisApprovalData = _.find(dhisApprovalDataList, {
                            "orgUnit": dbApprovalData.orgUnit,
                            "period": dbApprovalData.period
                        });

                        var l1UpdatePromise = dhisApprovalData ? approvalDataRepository.saveLevelOneApproval(dhisApprovalData) : approvalDataRepository.deleteLevelOneApproval(dbApprovalData.period, dbApprovalData.orgUnit);
                        l1UpdatePromises.push(l1UpdatePromise);
                    });

                    var newApprovals = _.reject(dhisApprovalDataList, function(dhisApprovalData) {
                        return _.any(dbApprovalDataList, {
                            "orgUnit": dhisApprovalData.orgUnit,
                            "period": dhisApprovalData.period
                        });
                    });

                    var approvalPromise = approvalDataRepository.saveLevelOneApproval(newApprovals);
                    l1UpdatePromises.push(approvalPromise);

                    return $q.all(l1UpdatePromises);
                };

                var m = moment();
                var startPeriod = getPeriod(m.isoWeek(m.isoWeek() - properties.projectDataSync.numWeeksToSync + 1));
                var endPeriod = getPeriod(moment());

                var moduleIds = _.unique(_.pluck(dhisApprovalDataList, "orgUnit"));

                approvalDataRepository.getLevelOneApprovalDataForPeriodsOrgUnits(startPeriod, endPeriod, moduleIds).then(mergeAndSaveCompletion);
            };

            return approvalService.getAllLevelOneApprovalData(userModuleIds, allDataSetIds).then(saveAllLevelOneApprovalData);
        };

        var downloadDataValues = function(metadata) {
            var dataValuesEquals = function(d1, d2) {
                return d1.dataElement === d2.dataElement && d1.period === d2.period && d1.orgUnit === d2.orgUnit && d1.categoryOptionCombo === d2.categoryOptionCombo;
            };

            var getAllDataValues = function(vals) {
                var orgUnitIds = vals[0];
                var allDataSetIds = vals[1];
                return $q.when(orgUnitIds.length > 0 && allDataSetIds.length > 0 ? dataService.downloadAllData(orgUnitIds, allDataSetIds) : []);
            };

            var clearApprovals = function(mergedData, originalData) {
                var orgUnitAndPeriod = function(dataValue) {
                    return dataValue.orgUnit + dataValue.period;
                };

                var groupedMergedData = _.groupBy(mergedData, orgUnitAndPeriod);
                var groupedOriginalData = _.groupBy(originalData, orgUnitAndPeriod);

                var deleteApprovals = [];
                for (var data in groupedOriginalData) {
                    if (groupedMergedData[data] && !_.isEqual(groupedMergedData[data], groupedOriginalData[data])) {
                        var firstDataValue = groupedOriginalData[data][0];
                        var deleteFirstLevelApproval = approvalDataRepository.deleteLevelOneApproval(firstDataValue.period, firstDataValue.orgUnit);
                        var deleteSecondLevelApproval = approvalDataRepository.deleteLevelTwoApproval(firstDataValue.period, firstDataValue.orgUnit);
                        deleteApprovals.push(deleteFirstLevelApproval);
                        deleteApprovals.push(deleteSecondLevelApproval);
                    }
                }

                return $q.all(deleteApprovals);
            };

            var saveAllDataValues = function(data) {
                if (_.isEmpty(data))
                    return;

                var dataValuesFromDhis = data.dataValues;

                var m = moment();
                var startPeriod = getPeriod(m.isoWeek(m.isoWeek() - properties.projectDataSync.numWeeksToSync + 1));
                var endPeriod = getPeriod(moment());

                var moduleIds = _.unique(_.pluck(dataValuesFromDhis, "orgUnit"));

                return dataRepository.getDataValuesForPeriodsOrgUnits(startPeriod, endPeriod, moduleIds).then(function(dataValues) {
                    var dataValuesFromDb = _.flatten(dataValues, "dataValues");
                    var mergedData = merge(dataValuesFromDb, dataValuesFromDhis, dataValuesEquals);
                    return clearApprovals(mergedData, dataValuesFromDb).then(function() {
                        return dataRepository.save({
                            "dataValues": mergedData
                        });
                    });
                });
            };

            return getAllDataValues(metadata).then(saveAllDataValues);
        };

        this.run = function() {
            return $q.all([getUserModuleIds(), dataSetRepository.getAllDatasetIds()]).then(function(metadata) {
                return $q.all([downloadDataValues(metadata), downloadCompletionData(metadata), downloadApprovalData(metadata)]);
            });
        };
    };
});