define(['moduleDataBlockMerger', 'dataRepository', 'approvalDataRepository', "dataSetRepository", 'dataService', 'approvalService', 'angularMocks', 'utils', 'moment', 'lodash', 'dataSyncFailureRepository', 'programEventRepository', 'eventService', 'aggregateDataValuesMerger', 'lineListEventsMerger'],
    function(ModuleDataBlockMerger, DataRepository, ApprovalDataRepository, DatasetRepository, DataService, ApprovalService, mocks, utils, moment, _, DataSyncFailureRepository, ProgramEventRepository, EventService, AggregateDataValuesMerger, LineListEventsMerger) {
        describe('moduleDataBlockMerger', function() {
            var q, scope, moduleDataBlockMerger,
                dataRepository, approvalRepository, datasetRepository, dataService, approvalService,
                dhisDataValues, dhisCompletion, dhisApproval, moduleDataBlock, someMomentInTime, dataSets, dataSetIds, periodAndOrgUnit, dataSyncFailureRepository, programEventRepository,
                eventService, aggregateDataValuesMerger, lineListEventsMerger, mockAggregateMergedData, dhisEvents, dhisEventIds;

            beforeEach(mocks.inject(function($q, $rootScope) {
                q = $q;
                scope = $rootScope.$new();

                dataRepository = new DataRepository();
                spyOn(dataRepository, 'saveDhisData').and.returnValue(utils.getPromise(q, {}));
                spyOn(dataRepository, 'clearFailedToSync').and.returnValue(utils.getPromise(q, {}));

                approvalRepository = new ApprovalDataRepository();
                spyOn(approvalRepository, 'saveApprovalsFromDhis').and.returnValue(utils.getPromise(q, {}));
                spyOn(approvalRepository, 'invalidateApproval').and.returnValue(utils.getPromise(q, {}));
                spyOn(approvalRepository, 'clearFailedToSync').and.returnValue(utils.getPromise(q, {}));

                dataSets = [{
                    id: 'dataSetid1'
                }, {
                    id: 'dataSetid2'
                }];
                dataSetIds = _.pluck(dataSets, "id");
                datasetRepository = new DatasetRepository();
                spyOn(datasetRepository, 'getAll').and.returnValue(utils.getPromise(q, dataSets));

                dataService = new DataService();
                spyOn(dataService, 'save').and.returnValue(utils.getPromise(q, {}));

                approvalService = new ApprovalService();
                spyOn(approvalService, 'markAsComplete').and.returnValue(utils.getPromise(q, {}));
                spyOn(approvalService, 'markAsApproved').and.returnValue(utils.getPromise(q, {}));
                spyOn(approvalService, 'markAsIncomplete').and.returnValue(utils.getPromise(q, {}));
                spyOn(approvalService, 'markAsUnapproved').and.returnValue(utils.getPromise(q, {}));

                dataSyncFailureRepository = new DataSyncFailureRepository();
                spyOn(dataSyncFailureRepository, 'delete').and.returnValue(utils.getPromise(q, {}));

                programEventRepository = new ProgramEventRepository();
                spyOn(programEventRepository, 'upsert').and.returnValue(utils.getPromise(q, {}));
                spyOn(programEventRepository, 'delete').and.returnValue(utils.getPromise(q, {}));

                eventService = new EventService();
                spyOn(eventService, 'createEvents').and.returnValue(utils.getPromise(q, {}));
                spyOn(eventService, 'updateEvents').and.returnValue(utils.getPromise(q, {}));
                spyOn(eventService, 'deleteEvent').and.returnValue(utils.getPromise(q, {}));

                aggregateDataValuesMerger = new AggregateDataValuesMerger();
                spyOn(aggregateDataValuesMerger, 'create').and.returnValue({});

                lineListEventsMerger = new LineListEventsMerger();
                spyOn(lineListEventsMerger, 'create').and.returnValue({});

                moduleDataBlockMerger = new ModuleDataBlockMerger(dataRepository, approvalRepository, dataService, q, datasetRepository, approvalService,
                    dataSyncFailureRepository, programEventRepository, eventService, aggregateDataValuesMerger,
                    lineListEventsMerger);

                moduleDataBlock = createMockModuleDataBlock();
                periodAndOrgUnit = {
                    period: moduleDataBlock.period,
                    orgUnit: moduleDataBlock.moduleId
                };
                dhisDataValues = undefined;
                dhisCompletion = undefined;
                dhisApproval = undefined;
                dhisEvents = undefined;
                dhisEventIds = undefined;
                someMomentInTime = moment('2016-05-18T13:00:00.000Z');
            }));

            var createMockDataValue = function(options) {
                if(options && options.lastUpdated) {
                    options.lastUpdated = options.lastUpdated.toISOString();
                }
                if(options && options.clientLastUpdated) {
                    options.clientLastUpdated = options.clientLastUpdated.toISOString();
                }
                return _.merge({
                    dataElement: 'someDataElementId',
                    period: 'somePeriod',
                    orgUnit: 'someOrgUnit',
                    categoryOptionCombo: 'someCategoryOptionComboId',
                    lastUpdated: '2016-05-04T09:00:00.000Z',
                    value: 'someValue'
                }, options);
            };

            var createMockEvent = function(options) {
                return _.merge({
                    event: 'someEventId',
                    lastUpdated: '2016-05-04T09:00:00.000Z'
                }, options);
            };

            var createMockCompletion = function() {
                return {
                    period: 'somePeriod',
                    orgUnit: 'someOrgUnit',
                    completedBy: 'some_l1_approver',
                    completedOn: '2016-05-05T09:00:00.000Z',
                    isComplete: true
                };
            };

            var createMockApproval = function() {
                return {
                    period: 'somePeriod',
                    orgUnit: 'someOrgUnit',
                    approvedBy: 'some_l2_approver',
                    approvedOn: '2016-05-06T09:00:00.000Z',
                    isApproved: true
                };
            };

            var createMockModuleDataBlock = function(options) {
                return _.merge({
                    period: 'somePeriod',
                    moduleId: 'someModuleId',
                    lineListService: false,
                    failedToSync: false,
                    approvalData: null,
                    dataValues: [],
                    dataValuesHaveBeenModifiedLocally: false,
                    approvedAtProjectLevel: false,
                    approvedAtProjectLevelBy: null,
                    approvedAtProjectLevelAt: null,
                    approvedAtCoordinationLevel: false,
                    approvedAtAnyLevel: false
                }, options);
            };

            var createMockDataMerger = function(options) {
                return _.merge({
                    praxisAndDhisAreBothUpToDate: false,
                    dhisIsUpToDateAndPraxisIsOutOfDate: false,
                    praxisAndDhisAreBothOutOfDate: false
                }, options);
            };

            describe('mergeAndSaveToLocalDatabase', function() {
                var performMerge = function() {
                    moduleDataBlockMerger.mergeAndSaveToLocalDatabase(moduleDataBlock, dhisDataValues, dhisCompletion, dhisApproval, dhisEvents, dhisEventIds);
                    scope.$apply();
                };

                it('should create an aggregateDataValuesMerger for an aggregate module', function() {
                    dhisDataValues = [createMockDataValue()];

                    performMerge();

                    expect(aggregateDataValuesMerger.create).toHaveBeenCalledWith(moduleDataBlock.dataValues, dhisDataValues);
                });

                it('should create a lineListEventsMerger for a linelist module', function () {
                    moduleDataBlock = createMockModuleDataBlock({ lineListService: true });
                    dhisEvents = [createMockEvent()];

                    performMerge();

                    expect(lineListEventsMerger.create).toHaveBeenCalledWith(moduleDataBlock.events, dhisEvents, dhisEventIds);
                });

                describe('aggregate data values', function() {
                    it('should be saved if updatedDhisDataValuesExist', function() {
                        mockAggregateMergedData = createMockDataMerger({
                            mergedData: ['someData'],
                            updatedDhisDataValuesExist: true
                        });
                        aggregateDataValuesMerger.create.and.returnValue(mockAggregateMergedData);

                        performMerge();

                        expect(dataRepository.saveDhisData).toHaveBeenCalledWith(mockAggregateMergedData.mergedData);
                    });

                    it('should not be saved if no updatedDhisDataValuesExist', function() {
                        aggregateDataValuesMerger.create.and.returnValue(createMockDataMerger({
                            mergedData: ['someData'],
                            updatedDhisDataValuesExist: false
                        }));

                        performMerge();

                        expect(dataRepository.saveDhisData).not.toHaveBeenCalled();
                    });
                });

                describe('linelist events', function () {
                    it('should be saved if there are eventsToUpsert', function() {
                        var mockLineListEventsMerger = createMockDataMerger({
                            eventsToUpsert: ['someEvent']
                        });
                        lineListEventsMerger.create.and.returnValue(mockLineListEventsMerger);
                        moduleDataBlock = createMockModuleDataBlock({ lineListService: true });

                        performMerge();

                        expect(programEventRepository.upsert).toHaveBeenCalledWith(mockLineListEventsMerger.eventsToUpsert);
                    });

                    it('should not be saved if there are no eventsToUpsert', function () {
                        lineListEventsMerger.create.and.returnValue(createMockDataMerger({
                            eventsToUpsert: []
                        }));
                        moduleDataBlock = createMockModuleDataBlock({ lineListService: true });

                        performMerge();

                        expect(programEventRepository.upsert).not.toHaveBeenCalled();
                    });

                    it('should be deleted if there are eventIdsToDelete', function () {
                        var mockLineistEventsMerger = createMockDataMerger({
                            eventIdsToDelete: ['someEventId']
                        });
                        lineListEventsMerger.create.and.returnValue(mockLineistEventsMerger);
                        moduleDataBlock = createMockModuleDataBlock({ lineListService: true });

                        performMerge();

                        expect(programEventRepository.delete).toHaveBeenCalledWith(mockLineistEventsMerger.eventIdsToDelete);
                    });

                    it('should not be deleted if there are no eventIdsToDelete', function () {
                        lineListEventsMerger.create.and.returnValue(createMockDataMerger({
                            eventIdsToDelete: []
                        }));
                        moduleDataBlock = createMockModuleDataBlock({ lineListService: true });

                        performMerge();

                        expect(programEventRepository.delete).not.toHaveBeenCalled();
                    });
                });

                describe('when praxisAndDhisAreBothUpToDate', function() {
                    beforeEach(function() {
                        mockAggregateMergedData = createMockDataMerger({
                            praxisAndDhisAreBothUpToDate: true
                        });
                        aggregateDataValuesMerger.create.and.returnValue(mockAggregateMergedData);
                    });

                    it('should save DHIS completion to database', function() {
                        dhisCompletion = createMockCompletion();

                        performMerge();

                        expect(approvalRepository.saveApprovalsFromDhis).toHaveBeenCalledWith(dhisCompletion);
                    });

                    it('should save DHIS approval to database', function() {
                        dhisApproval = createMockApproval();

                        performMerge();

                        expect(approvalRepository.saveApprovalsFromDhis).toHaveBeenCalledWith(dhisApproval);
                    });

                    it('should merge and save DHIS completion and approval to database', function() {
                        dhisCompletion = createMockCompletion();
                        dhisApproval = createMockApproval();

                        performMerge();

                        var expectedPayload = _.merge({}, dhisCompletion, dhisApproval);
                        expect(approvalRepository.saveApprovalsFromDhis).toHaveBeenCalledWith(expectedPayload);
                    });

                    it('should merge Praxis and DHIS approval', function() {
                        dhisApproval = createMockApproval();
                        moduleDataBlock = createMockModuleDataBlock({
                            approvalData: _.merge({ somePraxisInfo: 'someData' }, createMockCompletion())
                        });

                        performMerge();

                        var expectedPayload = _.merge({}, moduleDataBlock.approvalData, dhisApproval);
                        expect(approvalRepository.saveApprovalsFromDhis).toHaveBeenCalledWith(expectedPayload);
                    });

                    it('should not re-save approval if approval is up-to-date', function() {
                        dhisCompletion = createMockCompletion();
                        dhisApproval = createMockApproval();
                        moduleDataBlock = createMockModuleDataBlock({
                            approvalData: _.merge({ somePraxisInfo: 'someData' }, dhisCompletion, dhisApproval)
                        });

                        performMerge();

                        expect(approvalRepository.saveApprovalsFromDhis).not.toHaveBeenCalled();
                    });
                });

                describe('when dhisIsUpToDateAndPraxisIsOutOfDate', function() {
                    beforeEach(function() {
                        mockAggregateMergedData = createMockDataMerger({
                            dhisIsUpToDateAndPraxisIsOutOfDate: true
                        });
                        aggregateDataValuesMerger.create.and.returnValue(mockAggregateMergedData);
                    });

                    it('should save DHIS completion to database', function() {
                        dhisCompletion = createMockCompletion();

                        performMerge();

                        expect(approvalRepository.saveApprovalsFromDhis).toHaveBeenCalledWith(dhisCompletion);
                    });

                    it('should save DHIS approval to database', function() {
                        dhisApproval = createMockApproval();

                        performMerge();

                        expect(approvalRepository.saveApprovalsFromDhis).toHaveBeenCalledWith(dhisApproval);
                    });

                    it('should merge and save DHIS completion and approval to database', function() {
                        dhisCompletion = createMockCompletion();
                        dhisApproval = createMockApproval();

                        performMerge();

                        var expectedPayload = _.merge({}, dhisCompletion, dhisApproval);
                        expect(approvalRepository.saveApprovalsFromDhis).toHaveBeenCalledWith(expectedPayload);
                    });

                    it('should invalidate Praxis approvals if DHIS has no completion or approval', function() {
                        moduleDataBlock = createMockModuleDataBlock({
                            approvedAtAnyLevel: true
                        });

                        performMerge();

                        expect(approvalRepository.invalidateApproval).toHaveBeenCalledWith(moduleDataBlock.period, moduleDataBlock.moduleId);
                    });

                    it('should not invalidate Praxis approval if it does not exist', function() {
                        moduleDataBlock = createMockModuleDataBlock();

                        performMerge();

                        expect(approvalRepository.invalidateApproval).not.toHaveBeenCalled();
                    });
                });

                describe('when praxisAndDhisAreBothOutOfDate', function() {
                    beforeEach(function() {
                        mockAggregateMergedData = createMockDataMerger({
                            praxisAndDhisAreBothOutOfDate: true
                        });
                        aggregateDataValuesMerger.create.and.returnValue(mockAggregateMergedData);
                    });

                    it('should invalidate Praxis approval', function() {
                        moduleDataBlock = createMockModuleDataBlock({
                            approvedAtAnyLevel: true
                        });

                        performMerge();

                        expect(approvalRepository.invalidateApproval).toHaveBeenCalledWith(moduleDataBlock.period, moduleDataBlock.moduleId);
                    });

                    it('should not invalidate Praxis approval if it does not exist', function() {
                        moduleDataBlock = createMockModuleDataBlock();

                        performMerge();

                        expect(approvalRepository.invalidateApproval).not.toHaveBeenCalled();
                    });
                });

                describe('module data block has previously failed to sync', function() {
                    describe('when praxisAndDhisAreBothUpToDate', function() {
                        beforeEach(function() {
                            mockAggregateMergedData = createMockDataMerger({
                                praxisAndDhisAreBothUpToDate: true
                            });
                            aggregateDataValuesMerger.create.and.returnValue(mockAggregateMergedData);
                        });

                        it('deletes the data sync failure if there are no approvals on Praxis', function() {
                            moduleDataBlock = createMockModuleDataBlock({
                                failedToSync: true
                            });

                            performMerge();

                            expect(dataSyncFailureRepository.delete).toHaveBeenCalledWith(moduleDataBlock.moduleId, moduleDataBlock.period);
                        });

                        it('retains data sync failure if data has been approved at project level only on Praxis', function() {
                            moduleDataBlock = createMockModuleDataBlock({
                                approvedAtProjectLevel: true,
                                failedToSync: true
                            });

                            performMerge();

                            expect(dataSyncFailureRepository.delete).not.toHaveBeenCalled();
                        });

                        it('deletes the data sync failure if data has been approved at project level on both DHIS and Praxis', function() {
                            dhisCompletion = createMockCompletion();
                            moduleDataBlock = createMockModuleDataBlock({
                                approvedAtProjectLevel: true,
                                failedToSync: true
                            });

                            performMerge();

                            expect(dataSyncFailureRepository.delete).toHaveBeenCalledWith(moduleDataBlock.moduleId, moduleDataBlock.period);
                        });

                        it('retains data sync failure if data has been approved at coordination level only on Praxis', function() {
                            dhisCompletion = createMockCompletion();
                            moduleDataBlock = createMockModuleDataBlock({
                                approvedAtProjectLevel: true,
                                approvedAtCoordinationLevel: true,
                                failedToSync: true
                            });

                            performMerge();

                            expect(dataSyncFailureRepository.delete).not.toHaveBeenCalled();
                        });

                        it('deletes the data sync failure if data has been approved at coordination level on both DHIS and Praxis', function() {
                            dhisCompletion = createMockCompletion();
                            dhisApproval = createMockApproval();
                            moduleDataBlock = createMockModuleDataBlock({
                                approvedAtProjectLevel: true,
                                approvedAtCoordinationLevel: true,
                                failedToSync: true
                            });

                            performMerge();

                            expect(dataSyncFailureRepository.delete).toHaveBeenCalledWith(moduleDataBlock.moduleId, moduleDataBlock.period);
                        });
                    });

                    describe('when dhisIsUpToDateAndPraxisIsOutOfDate', function() {
                        it('deletes the data sync failure', function() {
                            mockAggregateMergedData = createMockDataMerger({
                                dhisIsUpToDateAndPraxisIsOutOfDate: true
                            });
                            aggregateDataValuesMerger.create.and.returnValue(mockAggregateMergedData);
                            moduleDataBlock = createMockModuleDataBlock({
                                failedToSync: true
                            });

                            performMerge();

                            expect(dataSyncFailureRepository.delete).toHaveBeenCalledWith(moduleDataBlock.moduleId, moduleDataBlock.period);
                        });
                    });
                });

                describe('module data block has not previously failed to sync', function() {
                    it('does not delete any data sync failures', function() {
                        moduleDataBlock = createMockModuleDataBlock({
                            failedToSync: false
                        });

                        performMerge();

                        expect(dataSyncFailureRepository.delete).not.toHaveBeenCalled();
                    });
                });
            });

            describe('uploadToDHIS', function() {
                var performUpload = function () {
                    moduleDataBlockMerger.uploadToDHIS(moduleDataBlock, dhisCompletion, dhisApproval, dhisEventIds);
                    scope.$apply();
                };

                describe('data values in Praxis have been modified locally', function () {
                    var localDataValue;

                    beforeEach(function () {
                        localDataValue = createMockDataValue({ clientLastUpdated: someMomentInTime });
                        moduleDataBlock = createMockModuleDataBlock({
                            dataValuesHaveBeenModifiedLocally: true,
                            dataValues: [localDataValue]
                        });
                    });

                    it('should upload data values to DHIS', function() {
                        performUpload();
                        expect(dataService.save).toHaveBeenCalledWith([localDataValue]);
                    });

                    it('should remove locally-modified timestamps from local data', function() {
                        performUpload();
                        expect(dataRepository.saveDhisData).toHaveBeenCalledWith([_.omit(localDataValue, 'clientLastUpdated')]);
                    });

                    it('should delete completion data from DHIS if it is present before uploading data values to DHIS', function() {
                        dhisCompletion = createMockCompletion();

                        performUpload();
                        expect(approvalService.markAsIncomplete).toHaveBeenCalledWith(dataSetIds, [periodAndOrgUnit]);
                    });

                    it('should delete approval data from DHIS if it is present before uploading data values to DHIS', function() {
                        dhisApproval = createMockApproval();

                        performUpload();
                        expect(approvalService.markAsUnapproved).toHaveBeenCalledWith(dataSetIds, [periodAndOrgUnit]);
                    });

                    it('should not upload events to DHIS', function () {
                        performUpload();
                        expect(eventService.createEvents).not.toHaveBeenCalled();
                        expect(eventService.updateEvents).not.toHaveBeenCalled();
                    });
                });

                describe('data values in Praxis have not been modified locally', function() {
                    it('should not upload data values to DHIS', function() {
                        moduleDataBlock = createMockModuleDataBlock({ dataValuesHaveBeenModifiedLocally: false });

                        performUpload();
                        expect(dataService.save).not.toHaveBeenCalled();
                    });
                });

                describe('events have been submitted on Praxis', function() {
                    var submittedEvent;

                    beforeEach(function () {
                        submittedEvent = createMockEvent({ localStatus: 'READY_FOR_DHIS' });
                        moduleDataBlock = createMockModuleDataBlock({
                            events: [submittedEvent]
                        });
                    });

                    it('should create submitted events on DHIS if they do not already exist', function(){
                        dhisEventIds = [];
                        performUpload();
                        expect(eventService.createEvents).toHaveBeenCalledWith([submittedEvent]);
                        expect(eventService.updateEvents).not.toHaveBeenCalled();
                    });

                    it('should update submitted events on DHIS if they already exist', function(){
                        dhisEventIds = [submittedEvent.event];
                        performUpload();
                        expect(eventService.createEvents).not.toHaveBeenCalled();
                        expect(eventService.updateEvents).toHaveBeenCalledWith([submittedEvent]);
                    });

                    it('should remove local timestamp and status from submitted events', function(){
                        performUpload();
                        expect(programEventRepository.upsert).toHaveBeenCalledWith([_.omit(submittedEvent, ["localStatus", "clientLastUpdated"])]);
                    });

                    it('should delete completion data from DHIS if it is present before uploading events to DHIS', function() {
                        dhisCompletion = createMockCompletion();

                        performUpload();
                        expect(approvalService.markAsIncomplete).toHaveBeenCalledWith(dataSetIds, [periodAndOrgUnit]);
                    });

                    it('should delete approval data from DHIS if it is present before uploading events to DHIS', function() {
                        dhisApproval = createMockApproval();

                        performUpload();
                        expect(approvalService.markAsUnapproved).toHaveBeenCalledWith(dataSetIds, [periodAndOrgUnit]);
                    });

                    it('should not upload data values to DHIS', function () {
                        performUpload();
                        expect(dataService.save).not.toHaveBeenCalled();
                    });
                });

                describe('events have not been submitted on Praxis', function() {
                    it('should not upload events to DHIS', function(){
                        moduleDataBlock = createMockModuleDataBlock({
                            events: [createMockEvent()]
                        });

                        moduleDataBlockMerger.uploadToDHIS(moduleDataBlock, dhisCompletion, dhisApproval);
                        scope.$apply();

                        expect(eventService.createEvents).not.toHaveBeenCalled();
                        expect(eventService.updateEvents).not.toHaveBeenCalled();
                    });
                });

                describe('events have been deleted on Praxis', function () {
                    var deletedEventA, deletedEventB;

                    beforeEach(function () {
                        deletedEventA = createMockEvent({ event: 'eventA', localStatus: 'DELETED' });
                        deletedEventB = createMockEvent({ event: 'eventB', localStatus: 'DELETED' });
                        moduleDataBlock = createMockModuleDataBlock({
                            events: [deletedEventA, deletedEventB]
                        });
                    });

                    it('should remove deleted events from DHIS', function(){
                        performUpload();
                        expect(eventService.deleteEvent).toHaveBeenCalledWith(deletedEventA.event);
                        expect(eventService.deleteEvent).toHaveBeenCalledWith(deletedEventB.event);
                    });

                    it('should remove the deleted events from Praxis', function() {
                        performUpload();
                        expect(programEventRepository.delete).toHaveBeenCalledWith(deletedEventA.event);
                        expect(programEventRepository.delete).toHaveBeenCalledWith(deletedEventB.event);
                    });

                    it('should delete completion data from DHIS if it is present before deleting events from DHIS', function() {
                        dhisCompletion = createMockCompletion();

                        performUpload();
                        expect(approvalService.markAsIncomplete).toHaveBeenCalledWith(dataSetIds, [periodAndOrgUnit]);
                    });

                    it('should delete approval data from DHIS if it is present before deleting events from DHIS', function() {
                        dhisApproval = createMockApproval();

                        performUpload();
                        expect(approvalService.markAsUnapproved).toHaveBeenCalledWith(dataSetIds, [periodAndOrgUnit]);
                    });
                });

                describe('events have not been deleted on Praxis', function () {
                    beforeEach(function () {
                        moduleDataBlock = createMockModuleDataBlock({
                            events: [createMockEvent()]
                        });
                        performUpload();
                    });

                    it('should not remove deleted events from DHIS', function(){
                        expect(eventService.deleteEvent).not.toHaveBeenCalled();
                    });

                    it('should not remove deleted events from Praxis', function(){
                        expect(programEventRepository.delete).not.toHaveBeenCalled();
                    });
                });

                describe('data has been approved on Praxis', function () {
                    it('should upload completion data from Praxis to DHIS', function() {
                        moduleDataBlock = createMockModuleDataBlock({
                            approvedAtProjectLevel: true,
                            approvedAtProjectLevelBy: 'Kuala',
                            approvedAtProjectLevelAt: someMomentInTime
                        });

                        performUpload();
                        expect(approvalService.markAsComplete).toHaveBeenCalledWith(dataSetIds,
                            [periodAndOrgUnit],
                            moduleDataBlock.approvedAtProjectLevelBy,
                            moduleDataBlock.approvedAtProjectLevelAt.toISOString());
                    });

                    it('should upload approval data from Praxis to DHIS', function () {
                        moduleDataBlock = createMockModuleDataBlock({
                            approvedAtCoordinationLevel: true
                        });

                        performUpload();
                        expect(approvalService.markAsApproved).toHaveBeenCalledWith(dataSetIds,
                            [moduleDataBlock.period], [moduleDataBlock.moduleId]
                        );
                    });

                    it('should not re-upload completion and approval data to DHIS', function() {
                        dhisCompletion = createMockCompletion();
                        dhisApproval = createMockApproval();
                        moduleDataBlock = createMockModuleDataBlock({
                            approvedAtProjectLevel: true,
                            approvedAtProjectLevelBy: 'Kuala',
                            approvedAtProjectLevelAt: someMomentInTime,
                            approvedAtCoordinationLevel: true
                        });

                        performUpload();
                        expect(approvalService.markAsUnapproved).not.toHaveBeenCalled();
                        expect(approvalService.markAsIncomplete).not.toHaveBeenCalled();
                        expect(approvalService.markAsComplete).not.toHaveBeenCalled();
                        expect(approvalService.markAsApproved).not.toHaveBeenCalled();
                    });

                    it('should delete and re-upload approval data to DHIS if completion data needs to be uploaded', function() {
                        dhisApproval = createMockApproval();

                        moduleDataBlock = createMockModuleDataBlock({
                            approvedAtProjectLevel: true,
                            approvedAtProjectLevelBy: 'Kuala',
                            approvedAtProjectLevelAt: someMomentInTime,
                            approvedAtCoordinationLevel: true
                        });

                        performUpload();
                        expect(approvalService.markAsUnapproved).toHaveBeenCalled();
                        expect(approvalService.markAsIncomplete).not.toHaveBeenCalled();
                        expect(approvalService.markAsComplete).toHaveBeenCalled();
                        expect(approvalService.markAsApproved).toHaveBeenCalled();
                    });
                });
            });
        });
    });
