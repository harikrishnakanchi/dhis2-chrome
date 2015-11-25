define(["moment", "properties", "lodash", "dateUtils"], function(moment, properties, _, dateUtils) {
    return function(dataService, dataRepository, datasetRepository, userPreferenceRepository, $q, approvalDataRepository, mergeBy, changeLogRepository) {

        var userProjectIds = [];

        this.run = function(message) {
            return datasetRepository.getAll().then(function(allDataSets) {
                if (message.data.data.length === 0) {
                    return userPreferenceRepository.getCurrentProjects().then(function(userProjectIds) {
                        return getLastUpdatedTime(userProjectIds).then(function(lastUpdated) {
                            var startDate = lastUpdated ?
                                dateUtils.subtractWeeks(properties.projectDataSync.numWeeksToSync) :
                                dateUtils.subtractWeeks(properties.projectDataSync.numWeeksToSyncOnFirstLogIn);
                            var periods = getPeriods(startDate);
                            return downloadMergeAndSave(userProjectIds, allDataSets, periods, false, lastUpdated).then(function() {
                                return updateChangeLog(userProjectIds);
                            });
                        });
                    });
                } else {
                    var orgUnitIds = _.uniq(_.pluck(message.data.data, "orgUnit"));
                    var periods = _.uniq(_.pluck(message.data.data, "period"));
                    return downloadMergeAndSave(orgUnitIds, allDataSets, periods, true, moment().toISOString());
                }
            });

        };


        var downloadMergeAndSave = function(orgUnitIds, allDataSets, periods, isMessageDataAvailable, lastUpdated) {

            var onSuccess = function(dataValuesFromDhis) {
                return mergeAndSaveDataValues(dataValuesFromDhis).then(recursivelyDownloadMergeAndSave);
            };

            var onFailure = function() {
                if (isMessageDataAvailable)
                    return $q.reject();
                return recursivelyDownloadMergeAndSave();
            };

            if (_.isEmpty(orgUnitIds))
                return $q.when();

            var dataSetIds = _.pluck(_.filter(allDataSets, {
                "isLineListService": false
            }), "id");

            var recursivelyDownloadMergeAndSave = function() {
                if (_.isEmpty(periods))
                    return $q.when();

                return dataService.downloadData(orgUnitIds, dataSetIds, periods.pop(), lastUpdated).then(onSuccess, onFailure);
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
                return $q.when();


            return getDataFromDb().then(function(dataFromLocalDb) {
                var mergedData = merge(dataValuesFromDhis, dataFromLocalDb);
                return clearApprovals(dataFromLocalDb, mergedData).then(dataRepository.saveDhisData);
            });
        };
    };
});