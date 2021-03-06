define(['moment', 'lodash'],
    function(moment, _) {
        return function(dataRepository, approvalDataRepository, dataService, $q, datasetRepository, approvalService, dataSyncFailureRepository, programEventRepository, eventService,
                        aggregateDataValuesMerger, lineListEventsMerger) {

            var mergeAndSaveToLocalDatabase = function(moduleDataBlock, updatedDhisDataValues, dhisCompletion, dhisApproval, updatedDhisEvents, dhisEventIds) {
                var dataMerger;

                var mergeAndSaveDataForModule = function() {
                    var saveAggregateData = function() {
                        return dataMerger.updatedDhisDataValuesExist ? dataRepository.saveDhisData(dataMerger.mergedData) : $q.when();
                    };

                    var saveLineListEvents = function () {
                        return !_.isEmpty(dataMerger.eventsToUpsert) ? programEventRepository.upsert(dataMerger.eventsToUpsert) : $q.when();
                    };

                    var deleteLineListEvents = function () {
                        return !_.isEmpty(dataMerger.eventIdsToDelete) ? programEventRepository.delete(dataMerger.eventIdsToDelete) : $q.when();
                    };

                    if(moduleDataBlock.lineListService) {
                        dataMerger = lineListEventsMerger.create(moduleDataBlock.events, updatedDhisEvents, dhisEventIds);
                        return saveLineListEvents().then(deleteLineListEvents);
                    } else {
                        dataMerger = aggregateDataValuesMerger.create(moduleDataBlock.dataValues, updatedDhisDataValues);
                        return saveAggregateData();
                    }
                };

                var mergeAndSaveApprovals = function() {
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

                return mergeAndSaveDataForModule()
                    .then(mergeAndSaveApprovals)
                    .then(resetDataSyncFailure);
            };

            var uploadToDHIS = function (moduleDataBlock, dhisCompletionData, dhisApprovalData, dhisEventIds) {
                var periodAndOrgUnit = {period: moduleDataBlock.period, orgUnit: moduleDataBlock.moduleId},
                    eventsToUpload = _.filter(moduleDataBlock.events, { localStatus: 'READY_FOR_DHIS' }),
                    eventIdsToDelete = _.pluck(_.filter(moduleDataBlock.events, { localStatus: 'DELETED' }), 'event'),
                    dataOnDhisNotPreviouslyCompleted = !dhisCompletionData,
                    dataOnDhisNotPreviouslyApproved = !dhisApprovalData,
                    dataHasBeenCompletedLocallyButNotOnDhis = moduleDataBlock.approvedAtProjectLevel && dataOnDhisNotPreviouslyCompleted,
                    dataHasBeenModifiedLocally = moduleDataBlock.dataValuesHaveBeenModifiedLocally || !_.isEmpty(eventsToUpload) || !_.isEmpty(eventIdsToDelete);


                var deleteApproval = function (dataSetIds) {
                    if(dhisApprovalData && (dataHasBeenModifiedLocally || dataHasBeenCompletedLocallyButNotOnDhis)) {
                        return approvalService.markAsUnapproved(dataSetIds, [periodAndOrgUnit]);
                    } else {
                        return $q.when({});
                    }
                };

                var deleteCompletion = function (dataSetIds) {
                    if(dhisCompletionData && dataHasBeenModifiedLocally) {
                        return approvalService.markAsIncomplete(dataSetIds, [periodAndOrgUnit]);
                    } else {
                        return $q.when({});
                    }
                };

                var uploadDataValues = function () {
                    var removeLocallyModifiedTimestamp = function() {
                        var dataValuesWithoutLocalTimestamps = _.map(moduleDataBlock.dataValues, function(dataValue) {
                            return _.omit(dataValue, 'clientLastUpdated');
                        });
                        return dataRepository.saveDhisData(dataValuesWithoutLocalTimestamps);
                    };

                    if(moduleDataBlock.dataValuesHaveBeenModifiedLocally) {
                        return dataService.save(moduleDataBlock.dataValues).then(removeLocallyModifiedTimestamp);
                    } else {
                        return $q.when({});
                    }
                };

                var uploadEventData = function () {
                    var mapOfDhisEventIds = _.indexBy(dhisEventIds);

                    var eventExistsOnDhis = function(event) {
                        return !!mapOfDhisEventIds[event.event];
                    };

                    var createNewEvents = function() {
                        var newEvents = _.reject(eventsToUpload, eventExistsOnDhis);
                        return _.isEmpty(newEvents) ? $q.when() : eventService.createEvents(newEvents);
                    };

                    var updateExistingEvents = function() {
                        var existingEvents = _.filter(eventsToUpload, eventExistsOnDhis);
                        return _.isEmpty(existingEvents) ? $q.when() : eventService.updateEvents(existingEvents);
                    };

                    var changeEventLocalStatus = function() {
                        var updatedEvents = _.map(eventsToUpload, function(ev) {
                            return _.omit(ev, ["localStatus", "clientLastUpdated"]);
                        });
                        return programEventRepository.upsert(updatedEvents);
                    };

                    return _.isEmpty(eventsToUpload) ? $q.when() : createNewEvents().then(updateExistingEvents).then(changeEventLocalStatus);
                };

                var deleteEvents = function () {
                    var deleteEvent = function(eventId) {
                        var deleteEventLocally = function () {
                            return programEventRepository.delete(eventId);
                        };

                        return eventService.deleteEvent(eventId).then(deleteEventLocally);
                    };

                    var recursivelyDeleteEvents = function(eventIds) {
                        if(_.isEmpty(eventIds)) {
                            return $q.when();
                        }

                        return deleteEvent(eventIds.pop()).then(function() {
                            return recursivelyDeleteEvents(eventIds);
                        });
                    };

                    return recursivelyDeleteEvents(eventIdsToDelete);
                };

                var uploadCompletionData = function (dataSetIds) {
                    if(moduleDataBlock.approvedAtProjectLevel && (dataOnDhisNotPreviouslyCompleted || dataHasBeenModifiedLocally)) {
                        var completedBy = moduleDataBlock.approvedAtProjectLevelBy;
                        var completedOn = moduleDataBlock.approvedAtProjectLevelAt.toISOString();

                        return approvalService.markAsComplete(dataSetIds, [periodAndOrgUnit], completedBy, completedOn);
                    }
                    return $q.when({});
                };

                var uploadApprovalData = function (dataSetIds) {
                  if(moduleDataBlock.approvedAtCoordinationLevel && (dataOnDhisNotPreviouslyApproved || dataHasBeenModifiedLocally || dataHasBeenCompletedLocallyButNotOnDhis)) {
                      return approvalService.markAsApproved(dataSetIds, [moduleDataBlock.period], [moduleDataBlock.moduleId]);
                  }
                  return $q.when({});
                };

                return datasetRepository.getAll().then(function (allDataSet) {
                    var dataSetIds = _.pluck(allDataSet, 'id');

                    return deleteApproval(dataSetIds)
                        .then(_.partial(deleteCompletion, dataSetIds))
                        .then(uploadDataValues)
                        .then(uploadEventData)
                        .then(deleteEvents)
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