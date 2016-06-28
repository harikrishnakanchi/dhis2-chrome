define(['moment', 'lodash'],
    function(moment, _) {
        return function(dataRepository, approvalDataRepository, mergeBy, dataService, $q, datasetRepository, approvalService, dataSyncFailureRepository, programEventRepository, eventService, aggregateDataValuesMerger) {

            var mergeAndSaveToLocalDatabase = function(moduleDataBlock, updatedDhisDataValues, dhisCompletion, dhisApproval) {
                var dataMerger = aggregateDataValuesMerger.create(moduleDataBlock.dataValues, updatedDhisDataValues);

                var mergeAndSaveDataValues = function() {
                    if(dataMerger.updatedDhisDataValuesExist) {
                        return dataRepository.saveDhisData(dataMerger.mergedData);
                    } else {
                        return $q.when([]);
                    }
                };

                var mergeAndSaveApprovals = function() {
                    return moduleDataBlock.lineListService ? mergeAndSaveCompletionAndApprovalForLineLists() : mergeAndSaveCompletionAndApprovalForAggregates();
                };

                var mergeAndSaveCompletionAndApprovalForAggregates = function() {
                    var mergeDhisAndPraxisApprovals = function() {
                        var mergedApproval = _.merge({}, moduleDataBlock.approvalData, dhisCompletion, dhisApproval),
                            mergedApprovalIsDifferent = !_.isEqual(mergedApproval, moduleDataBlock.approvalData);

                        return mergedApprovalIsDifferent ? approvalDataRepository.saveApprovalsFromDhis(mergedApproval) : $q.when();
                    };

                    var saveDhisApprovals = function() {
                        var mergedDhisApprovalAndCompletion = _.merge({}, dhisCompletion, dhisApproval),
                            dhisApprovalOrCompletionExists = !_.isEmpty(mergedDhisApprovalAndCompletion);

                        if (dhisApprovalOrCompletionExists) {
                            return approvalDataRepository.saveApprovalsFromDhis(mergedDhisApprovalAndCompletion);
                        } else if(moduleDataBlock.approvedAtAnyLevel) {
                            return approvalDataRepository.invalidateApproval(moduleDataBlock.period, moduleDataBlock.moduleId);
                        } else {
                            return $q.when();
                        }
                    };

                    var invalidatePraxisApprovals = function() {
                        return moduleDataBlock.approvedAtAnyLevel ? approvalDataRepository.invalidateApproval(moduleDataBlock.period, moduleDataBlock.moduleId) : $q.when();
                    };

                    if (dataMerger.praxisAndDhisAreBothUpToDate) {
                        return mergeDhisAndPraxisApprovals();
                    } else if (dataMerger.dhisIsUpToDateAndPraxisIsOutOfDate) {
                        return saveDhisApprovals();
                    } else if(dataMerger.praxisAndDhisAreBothOutOfDate) {
                        return invalidatePraxisApprovals();
                    }
                };

                var mergeAndSaveCompletionAndApprovalForLineLists = function () {
                    var mergedDhisApprovalAndCompletion = _.merge({}, dhisCompletion, dhisApproval),
                        dhisApprovalOrCompletionExists = !_.isEmpty(mergedDhisApprovalAndCompletion);

                    // Can be removed once approval logic for line list modules is integrated properly into ModuleDataBlockMerger
                    if(moduleDataBlock.approvalData && (moduleDataBlock.approvalData.status == 'NEW' || moduleDataBlock.approvalData.status == 'DELETED')) {
                        //DO NOTHING
                    } else if(dhisApprovalOrCompletionExists) {
                        return approvalDataRepository.saveApprovalsFromDhis(mergedDhisApprovalAndCompletion);
                    } else {
                        return approvalDataRepository.invalidateApproval(moduleDataBlock.period, moduleDataBlock.moduleId);
                    }
                };

                var resetDataSyncFailure = function () {
                    var approvedAtProjectLevelOnlyOnPraxis = moduleDataBlock.approvedAtProjectLevel && !dhisCompletion,
                        approvedAtCoordinationLevelOnlyOnPraxis = moduleDataBlock.approvedAtCoordinationLevel && !dhisApproval;

                    if(moduleDataBlock.failedToSync) {
                        if(dataMerger.praxisAndDhisAreBothUpToDate) {
                            if(!approvedAtProjectLevelOnlyOnPraxis && !approvedAtCoordinationLevelOnlyOnPraxis) {
                                return dataSyncFailureRepository.delete(moduleDataBlock.moduleId, moduleDataBlock.period);
                            }
                        } else if (dataMerger.dhisIsUpToDateAndPraxisIsOutOfDate) {
                            return dataSyncFailureRepository.delete(moduleDataBlock.moduleId, moduleDataBlock.period);
                        }
                    }
                };

                return mergeAndSaveDataValues()
                    .then(mergeAndSaveApprovals)
                    .then(resetDataSyncFailure);
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
                        var completedOn = moduleDataBlock.approvedAtProjectLevelAt.toISOString();

                        return approvalService.markAsComplete(dataSetIds, [periodAndOrgUnit], completedBy, completedOn);
                    }
                    return $q.when({});
                };

                var uploadApprovalData = function (dataSetIds) {
                  if(moduleDataBlock.approvedAtCoordinationLevel && (dataOnDhisNotPreviouslyApproved || moduleDataBlock.dataValuesHaveBeenModifiedLocally || dataHasBeenCompletedLocallyButNotOnDhis)) {
                      var periodAndOrgUnit = {period: moduleDataBlock.period, orgUnit: moduleDataBlock.moduleId};
                      var approvedBy = moduleDataBlock.approvedAtCoordinationLevelBy;
                      var approvedOn = moduleDataBlock.approvedAtCoordinationLevelAt.toISOString();

                      return approvalService.markAsApproved(dataSetIds, [periodAndOrgUnit], approvedBy, approvedOn);
                  }
                  return $q.when({});
                };

                var uploadEventData = function () {

                    var changeEventLocalStatus = function(events) {
                        var updatedEvents = _.map(events, function(ev) {
                            return _.omit(ev, ["localStatus", "clientLastUpdated"]);
                        });

                        return programEventRepository.upsert(updatedEvents);
                    };

                    if (moduleDataBlock.shouldSyncEvents) {
                        var eventsPayload = {
                            'events': moduleDataBlock.eventsToSync
                        };
                        return eventService.upsertEvents(eventsPayload).then(function () {
                            return moduleDataBlock.eventsToSync;
                        }).then(changeEventLocalStatus);
                    }
                    return $q.when({});

                };

                return datasetRepository.getAll().then(function (allDataSet) {
                    var dataSetIds = _.pluck(allDataSet, 'id');

                    return deleteApproval(dataSetIds)
                        .then(_.partial(deleteCompletion, dataSetIds))
                        .then(uploadDataValues)
                        .then(uploadEventData)
                        .then(_.partial(uploadCompletionData, dataSetIds))
                        .then(_.partial(uploadApprovalData, dataSetIds));

                });
            };

            var mergeAndSaveEventsToLocalDatabase = function (localEvents, dhisEvents) {
                if (_.isEmpty(dhisEvents) && _.isEmpty(localEvents))
                    return;

                var getNewEvents = function() {
                    return _.reject(dhisEvents, function(dhisEvent) {
                        return _.any(localEvents, {
                            "event": dhisEvent.event
                        });
                    });
                };

                var eventsToUpsert = [];
                var eventsToDelete = [];

                _.each(localEvents, function(dbEvent) {
                    if (!_.isEmpty(dbEvent.localStatus))
                        return;

                    var dhisEvent = _.find(dhisEvents, {
                        "event": dbEvent.event
                    });

                    if (dhisEvent) {
                        eventsToUpsert.push(dhisEvent);
                    } else {
                        eventsToDelete.push(dbEvent);
                    }
                });

                var newEvents = getNewEvents();
                eventsToUpsert = eventsToUpsert.concat(newEvents);
                _.map(eventsToUpsert, function(ev) {
                    ev.eventDate = moment(ev.eventDate).toISOString();
                });

                var upsertPromise = programEventRepository.upsert(eventsToUpsert);

                var deletePromise = programEventRepository.delete(_.pluck(eventsToDelete, 'event'));

                return $q.all([upsertPromise, deletePromise]);
            };

            return {
                mergeAndSaveToLocalDatabase: mergeAndSaveToLocalDatabase,
                mergeAndSaveEventsToLocalDatabase: mergeAndSaveEventsToLocalDatabase,
                uploadToDHIS: uploadToDHIS
            };
        };
    });