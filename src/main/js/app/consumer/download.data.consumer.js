define(["moment", "properties", "lodash", "dateUtils", "mergeBy"], function(moment, properties, _, dateUtils, mergeBy) {
    return function(dataService, dataRepository, datasetRepository, userPreferenceRepository, $q, approvalDataRepository) {
        this.run = function() {
            return downloadDataValues()
                .then(mergeAndSaveDataValues);
        };

        var downloadDataValues = function() {
            var getAllDataValues = function(vals) {
                var orgUnitIds = vals[0];
                var allDataSetIds = vals[1];

                if (orgUnitIds.length === 0 || allDataSetIds.length === 0)
                    return $q.when([]);

                return dataService.downloadAllData(orgUnitIds, allDataSetIds);
            };

            return $q.all([userPreferenceRepository.getUserModuleIds(), datasetRepository.getAllDatasetIds()])
                .then(getAllDataValues);
        };

        var mergeAndSaveDataValues = function(dataValuesFromDhis) {
            var getDataFromDb = function() {
                var m = moment();
                var startPeriod = dateUtils.toDhisFormat(m.isoWeek(m.isoWeek() - properties.projectDataSync.numWeeksToSync + 1));
                var endPeriod = dateUtils.toDhisFormat(moment());
                var moduleIds = _.unique(_.pluck(dataValuesFromDhis, "orgUnit"));
                return dataRepository.getDataValuesForPeriodsOrgUnits(startPeriod, endPeriod, moduleIds);
            };

            var merge = function(dataValuesFromDhis, dataValuesFromDb) {
                var dataValuesEquals = function(d1, d2) {
                    return d1.dataElement === d2.dataElement && d1.period === d2.period && d1.orgUnit === d2.orgUnit && d1.categoryOptionCombo === d2.categoryOptionCombo;
                };

                return mergeBy.lastUpdatedUsingCustomEquals(dataValuesEquals, dataValuesFromDhis, dataValuesFromDb);
            };

            var clearApprovals = function(originalData, mergedData) {
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

                return $q.all(deleteApprovals).then(function() {
                    return mergedData;
                });
            };

            if (_.isEmpty(dataValuesFromDhis))
                return;

            return getDataFromDb()
                .then(_.curry(merge)(dataValuesFromDhis))
                .then(_.curry(clearApprovals)(dataValuesFromDhis))
                .then(dataRepository.saveDhisData);
        };
    };
});
