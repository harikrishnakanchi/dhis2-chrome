define(['moment', 'lodash'],
    function(moment, _) {
        return function(dataRepository, approvalDataRepository, mergeBy, $q) {

            var mergeAndSaveToLocalDatabase = function(moduleDataBlock, dhisDataValues, dhisCompletion, dhisApproval) {
                var dataValuesEquals = function(dv1, dv2) {
                    return dv1.dataElement === dv2.dataElement &&
                           dv1.period === dv2.period &&
                           dv1.orgUnit === dv2.orgUnit &&
                           dv1.categoryOptionCombo === dv2.categoryOptionCombo;
                };

                var mergeDataValues = function(dhisDataValues, localDataValues) {
                    return mergeBy.lastUpdated({
                        eq: dataValuesEquals
                    }, dhisDataValues, localDataValues);
                };

                var mergeAndSaveDataValues = function() {
                    var dhisDataValuesExist = dhisDataValues.length > 0;

                    if(dhisDataValuesExist) {
                        var mergedDataValues = mergeDataValues(dhisDataValues, moduleDataBlock.dataValues);
                        return dataRepository.saveDhisData(mergedDataValues);
                    } else {
                        return $q.when([]);
                    }
                };

                var mergeAndSaveCompletionAndApproval = function() {
                    var mergedApprovalAndCompletion = _.merge({}, dhisCompletion, dhisApproval);
                    if(!_.isEmpty(mergedApprovalAndCompletion)) {
                        return approvalDataRepository.saveApprovalsFromDhis(mergedApprovalAndCompletion);
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