define([],
    function() {
        return function(dataRepository, $q) {
            var mergeAndSaveToLocalDatabase = function(moduleDataBlock, dhisDataValues) {
                if(dhisDataValues.length > 0) {
                    return dataRepository.saveDhisData(dhisDataValues);
                }
            };

            return {
                mergeAndSaveToLocalDatabase: mergeAndSaveToLocalDatabase
            };
        };
    });