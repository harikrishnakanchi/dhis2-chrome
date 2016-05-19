define(['moment', 'lodash'],
    function(moment, _) {
        return function(dataRepository, approvalDataRepository, $q) {

            var mergeAndSaveToLocalDatabase = function(moduleDataBlock, dhisDataValues, dhisCompletion) {
                var mergeAndSaveDataValues = function() {
                    var mostRecentDhisDataValueTimestamp = function() {
                        var timestamps = _.map(dhisDataValues, function(dataValue) {
                            return moment(dataValue.lastUpdated);
                        });
                        return moment.max(timestamps);
                    };

                    var dhisDataValuesExist = dhisDataValues.length > 0,
                        localDataValuesExist = !!moduleDataBlock.dataValuesLastUpdated,
                        dhisDataValuesAreMoreRecentThanLocal = mostRecentDhisDataValueTimestamp().isAfter(moduleDataBlock.dataValuesLastUpdated);

                    if(dhisDataValuesExist && (!localDataValuesExist || dhisDataValuesAreMoreRecentThanLocal)) {
                        return dataRepository.saveDhisData(dhisDataValues);
                    } else {
                        return $q.when([]);
                    }
                };

                var mergeAndSaveCompletionAndApproval = function() {
                    if(dhisCompletion) {
                        return approvalDataRepository.saveApprovalsFromDhis(dhisCompletion);
                    } else {
                        return $q.when([]);
                    }
                };

                return mergeAndSaveDataValues().then(mergeAndSaveCompletionAndApproval);
            };

            return {
                mergeAndSaveToLocalDatabase: mergeAndSaveToLocalDatabase
            };
        };
    });