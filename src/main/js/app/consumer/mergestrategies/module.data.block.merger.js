define(['moment', 'lodash'],
    function(moment, _) {
        return function(dataRepository, approvalDataRepository, mergeBy, dataService, $q) {

            var mergeAndSaveToLocalDatabase = function(moduleDataBlock, updatedDhisDataValues, dhisCompletion, dhisApproval) {
                var updatedDhisDataValuesExist = updatedDhisDataValues && updatedDhisDataValues.length > 0,
                    dhisDataValuesExist = updatedDhisDataValuesExist || !!moduleDataBlock.dataValuesLastUpdatedOnDhis,
                    localDataValuesExist = !!moduleDataBlock.dataValuesLastUpdated;

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
                    return dhisDataValuesExist && (!localDataValuesExist || mostRecentDhisDataValueTimestamp().isAfter(moduleDataBlock.dataValuesLastUpdated));
                };

                var praxisDataValuesAreUpToDateWithDhisDataValues = function() {
                    return (!dhisDataValuesExist && !localDataValuesExist) || (dhisDataValuesExist && mostRecentDhisDataValueTimestamp().isSame(moduleDataBlock.dataValuesLastUpdated));
                };

                var mostRecentDhisDataValueTimestamp = function() {
                    if(updatedDhisDataValuesExist) {
                        var timestamps = _.map(updatedDhisDataValues, function(dataValue) {
                            return moment(dataValue.lastUpdated);
                        });
                        return timestamps.length > 0 ? moment.max(timestamps) : null;
                    } else {
                        return moduleDataBlock.dataValuesLastUpdatedOnDhis;
                    }
                };

                var mergeAndSaveDataValues = function() {
                    if(updatedDhisDataValuesExist) {
                        var mergedDataValues = mergeDataValues(updatedDhisDataValues, moduleDataBlock.dataValues);
                        return dataRepository.saveDhisData(mergedDataValues);
                    } else {
                        return $q.when([]);
                    }
                };

                var mergeAndSaveCompletionAndApproval = function() {
                    var mergedDhisApprovalAndCompletion = _.merge({}, dhisCompletion, dhisApproval),
                        dhisApprovalOrCompletionExists = !_.isEmpty(mergedDhisApprovalAndCompletion),
                        localApprovalsExist = (moduleDataBlock.approvedAtProjectLevel || moduleDataBlock.approvedAtCoordinationLevel);

                    if(dhisDataValuesAreMoreRecentThanLocal()) {
                        if(dhisApprovalOrCompletionExists) {
                            return approvalDataRepository.saveApprovalsFromDhis(mergedDhisApprovalAndCompletion);
                        } else if(localApprovalsExist) {
                            return approvalDataRepository.invalidateApproval(moduleDataBlock.period, moduleDataBlock.moduleId);
                        }
                    } else if(praxisDataValuesAreUpToDateWithDhisDataValues()) {
                        if(dhisApprovalOrCompletionExists) {
                            return approvalDataRepository.saveApprovalsFromDhis(mergedDhisApprovalAndCompletion);
                        }
                    }
                };

                return mergeAndSaveDataValues().then(mergeAndSaveCompletionAndApproval);
            };

            var uploadToDHIS = function (moduleDataBlock) {
                return dataService.save(moduleDataBlock.dataValues);
            };

            return {
                mergeAndSaveToLocalDatabase: mergeAndSaveToLocalDatabase,
                uploadToDHIS: uploadToDHIS
            };
        };
    });