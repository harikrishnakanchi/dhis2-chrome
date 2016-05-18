define(['moment', 'lodash'],
    function(moment, _) {
        return function(dataRepository, $q) {
            var mergeAndSaveToLocalDatabase = function(moduleDataBlock, dhisDataValues) {
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
                }
            };

            return {
                mergeAndSaveToLocalDatabase: mergeAndSaveToLocalDatabase
            };
        };
    });