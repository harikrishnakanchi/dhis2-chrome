define(["moment", "properties", "lodash", "dateUtils"], function(moment, properties, _, dateUtils) {
    return function(dataService, dataRepository, dataSetRepository, userPreferenceRepository, $q, approvalDataRepository, orgUnitRepository) {
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
                var startPeriod = dateUtils.toDhisFormat(m.isoWeek(m.isoWeek() - properties.projectDataSync.numWeeksToSync + 1));
                var endPeriod = dateUtils.toDhisFormat(moment());

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
            return $q.all([getUserModuleIds(), dataSetRepository.getAllDatasetIds()]).then(downloadDataValues);
        };
    };
});