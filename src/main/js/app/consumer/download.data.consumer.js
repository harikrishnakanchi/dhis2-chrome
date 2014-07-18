define(["moment", "properties", "lodash"], function(moment, properties, _) {
    return function(dataService, dataRepository, dataSetRepository, userPreferenceRepository, $q, approvalService, approvalDataRepository) {
        var getPeriod = function(m) {
            return m.year() + "W" + m.isoWeek();
        };

        var getUserOrgUnits = function() {
            return userPreferenceRepository.getAll().then(function(userPreferences) {
                userPreferences = userPreferences || [];
                return _.map(_.flatten(_.map(userPreferences, "orgUnits")), function(o) {
                    return o.id;
                });
            });
        };

        var merge = function(list1, list2, equalsPred, lastUpdateDateProperty) {
            lastUpdateDateProperty = lastUpdateDateProperty || "lastUpdated";
            equalsPred = _.curry(equalsPred);
            return _.transform(list2, function(acc, ele) {
                var resultIndex = _.findIndex(acc, equalsPred(ele));
                if (resultIndex >= 0) {
                    if (ele[lastUpdateDateProperty] > acc[resultIndex][lastUpdateDateProperty]) {
                        acc[resultIndex] = ele;
                    }
                } else {
                    acc.push(ele);
                }
            }, list1);
        };

        var downloadCompletionData = function(metadata) {
            var userOrgUnitIds = metadata[0];
            var allDataSets = _.pluck(metadata[1], "id");

            if (userOrgUnitIds.length === 0 || allDataSets.length === 0) return;

            var saveAllLevelOneApprovalData = function(dhisApprovalDataList) {

                if (_.isEmpty(dhisApprovalDataList))
                    return;

                var mergeAndSaveCompletion = function(dbApprovalDataList) {
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

                    return $q.all[l1UpdatePromises];
                };

                var m = moment();
                var startPeriod = getPeriod(m.isoWeek(m.isoWeek() - properties.projectDataSync.numWeeksToSync + 1));
                var endPeriod = getPeriod(moment());

                var moduleIds = _.unique(_.pluck(dhisApprovalDataList, "orgUnit"));

                var equalsPred = function(obj1, obj2) {
                    return obj1.period === obj2.period && obj1.orgUnit === obj2.orgUnit;
                };

                approvalDataRepository.getLevelOneApprovalDataForPeriodsOrgUnits(startPeriod, endPeriod, moduleIds).then(mergeAndSaveCompletion);
            };

            return approvalService.getAllLevelOneApprovalData(userOrgUnitIds, allDataSets).then(saveAllLevelOneApprovalData);
        };

        var downloadDataValues = function(metadata) {
            var dataValuesEquals = function(d1, d2) {
                return d1.dataElement === d2.dataElement && d1.period === d2.period && d1.orgUnit === d2.orgUnit && d1.categoryOptionCombo === d2.categoryOptionCombo;
            };

            var getAllDataValues = function(vals) {
                var orgUnitIds = vals[0];
                var allDataSets = vals[1];
                return $q.when(orgUnitIds.length > 0 && allDataSets.length > 0 ? dataService.downloadAllData(orgUnitIds, allDataSets) : []);
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

                return dataRepository.getDataValuesForPeriodsOrgUnits(startPeriod, endPeriod, moduleIds).then(function(dataValuesFromDb) {
                    var mergedData = merge(_.flatten(dataValuesFromDb, "dataValues"), dataValuesFromDhis, dataValuesEquals);
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
            return $q.all([getUserOrgUnits(), dataSetRepository.getAll()]).then(function(metadata) {
                return $q.all([downloadDataValues(metadata), downloadCompletionData(metadata)]);
            });
        };
    };
});