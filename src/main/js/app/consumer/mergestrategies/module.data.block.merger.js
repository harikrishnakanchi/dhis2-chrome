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

                var dhisDataValuesAreMoreRecentThanLocal = function() {
                    return dhisDataValues && dhisDataValues.length > 0 &&
                           moduleDataBlock.dataValuesLastUpdated &&
                           mostRecentDhisDataValueTimestamp().isAfter(moduleDataBlock.dataValuesLastUpdated);
                };

                var mostRecentDhisDataValueTimestamp = function() {
                    var timestamps = _.map(dhisDataValues, function(dataValue) {
                        return moment(dataValue.lastUpdated);
                    });
                    return moment.max(timestamps);
                };

                var mergeAndSaveDataValues = function() {
                    var dhisDataValuesExist = dhisDataValues && dhisDataValues.length > 0;

                    if(dhisDataValuesExist) {
                        var mergedDataValues = mergeDataValues(dhisDataValues, moduleDataBlock.dataValues);
                        return dataRepository.saveDhisData(mergedDataValues);
                    } else {
                        return $q.when([]);
                    }
                };

                var mergeAndSaveCompletionAndApproval = function() {
                    var localDataValuesDoNotExist = !moduleDataBlock.dataValuesLastUpdated,
                        mergedDhisApprovalAndCompletion = _.merge({}, dhisCompletion, dhisApproval),
                        dhisApprovalOrCompletionExists = !_.isEmpty(mergedDhisApprovalAndCompletion),
                        localApprovalsExist = (moduleDataBlock.approvedAtProjectLevel || moduleDataBlock.approvedAtCoordinationLevel);

                    if(localDataValuesDoNotExist || dhisDataValuesAreMoreRecentThanLocal()) {
                        if(dhisApprovalOrCompletionExists) {
                            return approvalDataRepository.saveApprovalsFromDhis(mergedDhisApprovalAndCompletion);
                        } else if(localApprovalsExist) {
                            return approvalDataRepository.invalidateApproval(moduleDataBlock.period, moduleDataBlock.moduleId);
                        }
                    }
                };

                return mergeAndSaveDataValues().then(mergeAndSaveCompletionAndApproval);
            };

            return {
                mergeAndSaveToLocalDatabase: mergeAndSaveToLocalDatabase
            };
        };
    });