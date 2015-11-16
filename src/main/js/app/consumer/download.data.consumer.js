define(["moment", "properties", "lodash", "dateUtils"], function(moment, properties, _, dateUtils) {
    return function(dataService, dataRepository, datasetRepository, userPreferenceRepository, $q, approvalDataRepository, mergeBy, changeLogRepository) {

        var userProjectIds = [];

        this.run = function() {
            return userPreferenceRepository.getCurrentProjects().then(function(userProjectIds) {
                return getLastUpdatedTime(userProjectIds).then(function(lastUpdated) {
                    return datasetRepository.getAll().then(function(allDataSets) {
                        return downloadMergeAndSave(userProjectIds, allDataSets, lastUpdated).then(function() {
                            return updateChangeLog(userProjectIds);
                        });
                    });
                });
            });
        };

        var downloadMergeAndSave = function(orgUnitIds, allDataSets, lastUpdated) {
            if (_.isEmpty(orgUnitIds))
                return $q.when();

            var dataSetIds = _.pluck(_.filter(allDataSets, {
                "isLineListService": false
            }), "id");

            var startDate = lastUpdated ? dateUtils.subtractWeeks(properties.projectDataSync.numWeeksToSync) : dateUtils.subtractWeeks(properties.projectDataSync.numWeeksToSyncOnFirstLogIn);
            var periods = getPeriods(startDate);

            var recursivelyDownloadMergeAndSave = function() {
                if (_.isEmpty(periods))
                    return $q.when();

                return dataService.downloadData(orgUnitIds, dataSetIds, periods.pop(), lastUpdated)
                    .then(mergeAndSaveDataValues)
                    .then(recursivelyDownloadMergeAndSave);
            };

            return recursivelyDownloadMergeAndSave();
        };

        var getPeriods = function(startDate) {
            var numOfWeeks = moment().diff(moment(startDate), 'weeks');
            var periods = [];
            while (numOfWeeks > 0) {
                periods.push(moment(startDate).add(numOfWeeks, 'weeks').format("GGGG[W]WW"));
                numOfWeeks = numOfWeeks - 1;
            }
            return periods;
        };

        var updateChangeLog = function(userProjectIds) {
            return changeLogRepository.upsert("dataValues:" + userProjectIds.join(';'), moment().toISOString());
        };

        var getLastUpdatedTime = function(userProjectIds) {
            return changeLogRepository.get("dataValues:" + userProjectIds.join(';'));
        };

        var mergeAndSaveDataValues = function(dataValuesFromDhis) {
            var getDataFromDb = function() {
                var periods = _.unique(_.pluck(dataValuesFromDhis, "period"));
                var moduleIds = _.unique(_.pluck(dataValuesFromDhis, "orgUnit"));
                return dataRepository.getDataValuesForOrgUnitsPeriods(moduleIds, periods);
            };

            var dataValuesEquals = function(d1, d2) {
                return d1.dataElement === d2.dataElement && d1.period === d2.period && d1.orgUnit === d2.orgUnit && d1.categoryOptionCombo === d2.categoryOptionCombo;
            };

            var merge = function(dataValuesFromDhis, dataValuesFromDb) {
                return mergeBy.lastUpdated({
                    eq: dataValuesEquals
                }, dataValuesFromDhis, dataValuesFromDb);
            };

            var clearApprovals = function(originalData, mergedData) {
                var orgUnitAndPeriod = function(dataValue) {
                    return dataValue.orgUnit + dataValue.period;
                };

                var areEqual = function(originalDataValues, mergedDataValues) {
                    return originalDataValues.length === mergedDataValues.length && _.all(originalDataValues, function(dv) {
                        return _.any(mergedDataValues, function(mergedDv) {
                            return dataValuesEquals(dv, mergedDv) && dv.value === mergedDv.value;
                        });
                    });
                };

                var mergedDataGroupedByOuAndPeriod = _.groupBy(mergedData, orgUnitAndPeriod);
                var originalDataGroupedByOuAndPeriod = _.groupBy(originalData, orgUnitAndPeriod);

                var deleteApprovals = [];
                for (var ouAndPeriod in originalDataGroupedByOuAndPeriod) {
                    if (mergedDataGroupedByOuAndPeriod[ouAndPeriod] && !areEqual(originalDataGroupedByOuAndPeriod[ouAndPeriod], mergedDataGroupedByOuAndPeriod[ouAndPeriod])) {
                        var firstDataValue = originalDataGroupedByOuAndPeriod[ouAndPeriod][0];
                        deleteApprovals.push(approvalDataRepository.invalidateApproval(firstDataValue.period, firstDataValue.orgUnit));
                    }
                }

                return $q.all(deleteApprovals).then(function() {
                    return mergedData;
                });
            };
            if (_.isEmpty(dataValuesFromDhis))
                return;


            return getDataFromDb().then(function(dataFromLocalDb) {
                var mergedData = merge(dataValuesFromDhis, dataFromLocalDb);
                return clearApprovals(dataFromLocalDb, mergedData).then(dataRepository.saveDhisData);
            });
        };
    };
});
