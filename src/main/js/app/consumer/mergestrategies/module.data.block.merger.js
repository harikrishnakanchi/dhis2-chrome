define(['moment', 'lodash'],
    function(moment, _) {
        return function(dataRepository, approvalDataRepository, mergeBy, dataService, $q, datasetRepository, approvalService) {

            var mergeAndSaveToLocalDatabase = function(moduleDataBlock, updatedDhisDataValues, dhisCompletion, dhisApproval) {
                var updatedDhisDataValuesExist = updatedDhisDataValues && updatedDhisDataValues.length > 0;

                var dataValuesEquals = function(dv1, dv2) {
                    return dv1.dataElement === dv2.dataElement &&
                           dv1.period === dv2.period &&
                           dv1.orgUnit === dv2.orgUnit &&
                           dv1.categoryOptionCombo === dv2.categoryOptionCombo;
                };

                var dataValuesAreEqual = function(originalDataValues, mergedDataValues) {
                    return originalDataValues.length === mergedDataValues.length && _.all(originalDataValues, function(dv) {
                            return _.any(mergedDataValues, function(mergedDv) {
                                return dataValuesEquals(dv, mergedDv) && dv.value === mergedDv.value;
                            });
                        });
                };

                var mergeDataValues = function(dhisDataValues, localDataValues) {
                    return mergeBy.lastUpdated({
                        eq: dataValuesEquals
                    }, dhisDataValues, localDataValues);
                };

                var mergedDataValues = function() {
                    return updatedDhisDataValuesExist ? mergeDataValues(updatedDhisDataValues, moduleDataBlock.dataValues) : moduleDataBlock.dataValues;
                };

                var mergedDataValuesAreEqualToExistingPraxisDataValues = function() {
                    return updatedDhisDataValuesExist ? dataValuesAreEqual(moduleDataBlock.dataValues, mergedDataValues()) : true;
                };

                var mergedDataValuesAreEqualToDhisDataValues = function() {
                    return _.all(mergedDataValues(), function(mergedDataValue) {
                        return !mergedDataValue.clientLastUpdated;
                    });
                };

                var mergeAndSaveDataValues = function() {
                    if(updatedDhisDataValuesExist) {
                        return dataRepository.saveDhisData(mergedDataValues());
                    } else {
                        return $q.when([]);
                    }
                };

                var mergeAndSaveCompletionAndApproval = function() {
                    var mergedDhisApprovalAndCompletion = _.merge({}, dhisCompletion, dhisApproval),
                        dhisApprovalOrCompletionExists = !_.isEmpty(mergedDhisApprovalAndCompletion),
                        localApprovalsExist = (moduleDataBlock.approvedAtProjectLevel || moduleDataBlock.approvedAtCoordinationLevel);

                    if(mergedDataValuesAreEqualToExistingPraxisDataValues() && mergedDataValuesAreEqualToDhisDataValues()) {
                        var mergedApproval = _.merge({}, moduleDataBlock.approvalData, dhisCompletion, dhisApproval);
                        if(!_.isEqual(mergedApproval, moduleDataBlock.approvalData)) {
                            return approvalDataRepository.saveApprovalsFromDhis(mergedApproval);
                        }
                    } else if (mergedDataValuesAreEqualToDhisDataValues()) {
                        if(dhisApprovalOrCompletionExists) {
                            return approvalDataRepository.saveApprovalsFromDhis(mergedDhisApprovalAndCompletion);
                        } else if(localApprovalsExist) {
                            return approvalDataRepository.invalidateApproval(moduleDataBlock.period, moduleDataBlock.moduleId);
                        }
                    } else if(!mergedDataValuesAreEqualToExistingPraxisDataValues() && localApprovalsExist) {
                        return approvalDataRepository.invalidateApproval(moduleDataBlock.period, moduleDataBlock.moduleId);
                    }
                };

                return mergeAndSaveDataValues().then(mergeAndSaveCompletionAndApproval);
            };


            var uploadToDHIS = function (moduleDataBlock, dhisCompletionData, dhisApprovalData) {
                var periodAndOrgUnit = {period: moduleDataBlock.period, orgUnit: moduleDataBlock.moduleId},
                    dataOnDhisNotPreviouslyCompleted = !dhisCompletionData,
                    dataOnDhisNotPreviouslyApproved = !dhisApprovalData,
                    dataHasBeenCompletedLocallyButNotOnDhis = moduleDataBlock.approvedAtProjectLevel && dataOnDhisNotPreviouslyCompleted;


                var deleteApproval = function (dataSetIds) {
                    if(dhisApprovalData && (moduleDataBlock.dataValuesHaveBeenModifiedLocally || dataHasBeenCompletedLocallyButNotOnDhis)) {
                        return approvalService.markAsUnapproved(dataSetIds, [periodAndOrgUnit]);
                    } else {
                        return $q.when({});
                    }
                };

                var deleteCompletion = function (dataSetIds) {
                    if(dhisCompletionData && moduleDataBlock.dataValuesHaveBeenModifiedLocally) {
                        return approvalService.markAsIncomplete(dataSetIds, [periodAndOrgUnit]);
                    } else {
                        return $q.when({});
                    }
                };

                var uploadDataValues = function () {
                    if(moduleDataBlock.dataValuesHaveBeenModifiedLocally) {
                        return dataService.save(moduleDataBlock.dataValues).then(removeLocallyModifiedTimestamp);
                    } else {
                        return $q.when({});
                    }
                };

                var removeLocallyModifiedTimestamp = function() {
                    var dataValuesWithoutLocalTimestamps = _.map(moduleDataBlock.dataValues, function(dataValue) {
                        return _.omit(dataValue, 'clientLastUpdated');
                    });
                    return dataRepository.saveDhisData(dataValuesWithoutLocalTimestamps);
                };

                var uploadCompletionData = function (dataSetIds) {
                    if(moduleDataBlock.approvedAtProjectLevel && (dataOnDhisNotPreviouslyCompleted || moduleDataBlock.dataValuesHaveBeenModifiedLocally)) {
                        var completedBy = moduleDataBlock.approvedAtProjectLevelBy;
                        var completedOn = moduleDataBlock.approvedAtProjectLevelOn.toISOString();

                        return approvalService.markAsComplete(dataSetIds, [periodAndOrgUnit], completedBy, completedOn);
                    }
                    return $q.when({});
                };

                var uploadApprovalData = function (dataSetIds) {
                  if(moduleDataBlock.approvedAtCoordinationLevel && (dataOnDhisNotPreviouslyApproved || moduleDataBlock.dataValuesHaveBeenModifiedLocally || dataHasBeenCompletedLocallyButNotOnDhis)) {
                      var periodAndOrgUnit = {period: moduleDataBlock.period, orgUnit: moduleDataBlock.moduleId};
                      var approvedBy = moduleDataBlock.approvedAtCoordinationLevelBy;
                      var approvedOn = moduleDataBlock.approvedAtCoordinationLevelOn.toISOString();

                      return approvalService.markAsApproved(dataSetIds, [periodAndOrgUnit], approvedBy, approvedOn);
                  }
                  return $q.when({});
                };

                return datasetRepository.getAll().then(function (allDataSet) {
                    var dataSetIds = _.pluck(allDataSet, 'id');

                    return deleteApproval(dataSetIds)
                        .then(_.partial(deleteCompletion, dataSetIds))
                        .then(uploadDataValues)
                        .then(_.partial(uploadCompletionData, dataSetIds))
                        .then(_.partial(uploadApprovalData, dataSetIds));
                });
            };

            return {
                mergeAndSaveToLocalDatabase: mergeAndSaveToLocalDatabase,
                uploadToDHIS: uploadToDHIS
            };
        };
    });