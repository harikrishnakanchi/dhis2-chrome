define(['downloadModuleDataBlocksConsumer', 'dataService', 'approvalService', 'systemInfoService', "dataSetRepository", 'userPreferenceRepository', 'changeLogRepository', 'orgUnitRepository', 'moduleDataBlockFactory',
        'moduleDataBlockMerger', 'eventService', 'angularMocks', 'dateUtils', 'utils', 'timecop', 'moment'],
    function(DownloadModuleDataBlocksConsumer, DataService, ApprovalService, SystemInfoService, DataSetRepository, UserPreferenceRepository, ChangeLogRepository, OrgUnitRepository, ModuleDataBlockFactory,
             ModuleDataBlockMerger, EventService, mocks, dateUtils, utils, timecop, moment) {
        
        var downloadModuleDataBlocksConsumer, dataService, approvalService, systemInfoService,
            userPreferenceRepository, datasetRepository, changeLogRepository, orgUnitRepository,
            moduleDataBlockFactory, moduleDataBlockMerger,
            q, scope, aggregateDataSet, periodRange, mockProjectId, mockModule, mockOriginOrgUnits, mockAggregateModuleDataBlock, mockLineListModuleDataBlock, someMomentInTime, eventService;

            describe('downloadModuleDataBlocksConsumer', function() {
            beforeEach(mocks.inject(function($rootScope, $q) {
                q = $q;
                scope = $rootScope.$new();

                mockModule = {
                    id: 'someModuleId',
                    "attributeValues": [{
                        "attribute": {
                            "code": "isLineListService"
                        },
                        "value": "false"
                    }]
                };
                mockOriginOrgUnits = [{
                    id: 'someOriginId'
                }];
                mockProjectId = 'someProjectId';
                aggregateDataSet = {
                    id: 'someAggregateDataSetId',
                    isLineListService: false
                };
                periodRange = ['2016W20', '2016W21'];
                mockAggregateModuleDataBlock = {
                    moduleId: 'someModuleId',
                    period: '2016W24',
                    lineListService: false
                };
                mockLineListModuleDataBlock = {
                    moduleId: 'someModuleId',
                    period: '2016W24',
                    lineListService: true
                };
                someMomentInTime = '2016-05-20T15:48:00.888Z';

                spyOn(dateUtils, "getPeriodRangeInWeeks").and.returnValue(periodRange);

                dataService = new DataService();
                spyOn(dataService, "downloadData").and.returnValue(utils.getPromise(q, {}));

                approvalService = new ApprovalService();
                spyOn(approvalService, 'getCompletionData').and.returnValue(utils.getPromise(q, {}));
                spyOn(approvalService, 'getApprovalData').and.returnValue(utils.getPromise(q, {}));

                orgUnitRepository = new OrgUnitRepository();
                spyOn(orgUnitRepository, 'getAllModulesInOrgUnits').and.returnValue(utils.getPromise(q, [mockModule]));
                spyOn(orgUnitRepository, 'findAllByParent').and.returnValue(utils.getPromise(q, mockOriginOrgUnits));

                datasetRepository = new DataSetRepository();
                spyOn(datasetRepository, 'findAllForOrgUnits').and.returnValue(utils.getPromise(q, [aggregateDataSet]));

                userPreferenceRepository = new UserPreferenceRepository();
                spyOn(userPreferenceRepository, 'getCurrentUsersProjectIds').and.returnValue(utils.getPromise(q, [mockProjectId]));

                changeLogRepository =  new ChangeLogRepository();
                spyOn(changeLogRepository, 'get').and.returnValue(utils.getPromise(q, someMomentInTime));
                spyOn(changeLogRepository, 'upsert').and.returnValue(utils.getPromise(q, {}));

                moduleDataBlockFactory = new ModuleDataBlockFactory();
                spyOn(moduleDataBlockFactory, 'createForModule').and.returnValue(utils.getPromise(q, [mockAggregateModuleDataBlock]));

                moduleDataBlockMerger = new ModuleDataBlockMerger();
                spyOn(moduleDataBlockMerger, 'mergeAndSaveToLocalDatabase').and.returnValue(utils.getPromise(q, {}));

                eventService = new EventService();
                spyOn(eventService, 'getEvents').and.returnValue(utils.getPromise(q, []));
                spyOn(eventService, 'getEventIds').and.returnValue(utils.getPromise(q, []));

                systemInfoService = new SystemInfoService();
                spyOn(systemInfoService, 'getServerDate').and.returnValue(utils.getPromise(q, 'someTime'));

                downloadModuleDataBlocksConsumer = new DownloadModuleDataBlocksConsumer(dataService, approvalService, systemInfoService, datasetRepository,
                    userPreferenceRepository, changeLogRepository, orgUnitRepository, moduleDataBlockFactory, moduleDataBlockMerger, eventService, q);

            }));

            var runConsumer = function() {
                downloadModuleDataBlocksConsumer.run();
                scope.$apply();
            };

            it('should retrieve the modules for each project', function() {
                var mockProjectIds = ['projectIdA', 'projectIdB'];
                userPreferenceRepository.getCurrentUsersProjectIds.and.returnValue(utils.getPromise(q, mockProjectIds));

                runConsumer();
                expect(orgUnitRepository.getAllModulesInOrgUnits).toHaveBeenCalledWith(['projectIdA']);
                expect(orgUnitRepository.getAllModulesInOrgUnits).toHaveBeenCalledWith(['projectIdB']);
            });

            it('should download data values from DHIS for each aggregate module', function() {
                moduleDataBlockFactory.createForModule.and.returnValue(utils.getPromise(q, [mockAggregateModuleDataBlock]));

                runConsumer();
                expect(dataService.downloadData).toHaveBeenCalledWith(mockModule.id, [aggregateDataSet.id], periodRange, someMomentInTime);
            });

            it('should not download data values from DHIS for linelist modules', function() {
                moduleDataBlockFactory.createForModule.and.returnValue(utils.getPromise(q, [mockLineListModuleDataBlock]));

                runConsumer();
                expect(dataService.downloadData).not.toHaveBeenCalled();
            });

            it('should download completion data from DHIS for each module', function () {
                runConsumer();
                expect(approvalService.getCompletionData).toHaveBeenCalledWith(mockModule.id, mockOriginOrgUnits, [aggregateDataSet.id], periodRange);
            });

            it('should download approval data from DHIS for each module', function () {
                runConsumer();
                expect(approvalService.getApprovalData).toHaveBeenCalledWith(mockModule.id, [aggregateDataSet.id], periodRange);
            });

            it('should download event data from DHIS for each line list module', function () {
                moduleDataBlockFactory.createForModule.and.returnValue(utils.getPromise(q, [mockLineListModuleDataBlock]));

                runConsumer();
                expect(eventService.getEvents).toHaveBeenCalledWith(mockModule.id, periodRange, someMomentInTime);
            });

            it('should download event ids from DHIS for each line list module', function () {
                moduleDataBlockFactory.createForModule.and.returnValue(utils.getPromise(q, [mockLineListModuleDataBlock]));

                runConsumer();
                expect(eventService.getEventIds).toHaveBeenCalledWith(mockModule.id, periodRange);
            });

            it('should not download event data from DHIS for aggregate modules', function () {
                moduleDataBlockFactory.createForModule.and.returnValue(utils.getPromise(q, [mockAggregateModuleDataBlock]));

                runConsumer();
                expect(eventService.getEvents).not.toHaveBeenCalled();
            });

            it('should not download event ids from DHIS for aggregate modules', function () {
                moduleDataBlockFactory.createForModule.and.returnValue(utils.getPromise(q, [mockAggregateModuleDataBlock]));

                runConsumer();
                expect(eventService.getEventIds).not.toHaveBeenCalled();
            });

            it('should not download data from DHIS for linelist summary datasets', function() {
                var lineListSummaryDataSet = {
                    id: 'lineListDataSetId',
                    isLineListService: true
                };
                datasetRepository.findAllForOrgUnits.and.returnValue(utils.getPromise(q, [aggregateDataSet, lineListSummaryDataSet]));

                runConsumer();
                expect(dataService.downloadData).toHaveBeenCalledWith(mockModule.id, [aggregateDataSet.id], periodRange, someMomentInTime);
            });

            it('should download completion data from DHIS for linelist summary datasets', function() {
                var lineListSummaryDataSet = {
                    id: 'lineListDataSetId',
                    isLineListService: true
                };
                datasetRepository.findAllForOrgUnits.and.returnValue(utils.getPromise(q, [aggregateDataSet, lineListSummaryDataSet]));

                runConsumer();
                expect(approvalService.getCompletionData).toHaveBeenCalledWith(mockModule.id, mockOriginOrgUnits, [aggregateDataSet.id, lineListSummaryDataSet.id], periodRange);
            });

            it('should download approval data from DHIS for linelist summary datasets', function() {
                var lineListSummaryDataSet = {
                    id: 'lineListDataSetId',
                    isLineListService: true
                };
                datasetRepository.findAllForOrgUnits.and.returnValue(utils.getPromise(q, [aggregateDataSet, lineListSummaryDataSet]));

                runConsumer();
                expect(approvalService.getApprovalData).toHaveBeenCalledWith(mockModule.id, [aggregateDataSet.id, lineListSummaryDataSet.id], periodRange);
            });

            it('should download data and approvals only for dataSets assosciated with each module and its origins', function () {
                var mockModuleA = { id: 'mockModuleIdA' },
                    mockModuleB = { id: 'mockModuleIdB' },
                    mockOriginForA = { id: 'mockOriginA' },
                    mockOriginForB = { id: 'mockOriginB' };

                orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, [mockModuleA, mockModuleB]));
                orgUnitRepository.findAllByParent.and.callFake(function(moduleIds) {
                    var originToReturn = _.first(moduleIds) == mockModuleA.id ? mockOriginForA : mockOriginForB;
                    return utils.getPromise(q, [originToReturn]);
                });

                runConsumer();

                expect(datasetRepository.findAllForOrgUnits).toHaveBeenCalledWith([mockModuleA, mockOriginForA]);
                expect(datasetRepository.findAllForOrgUnits).toHaveBeenCalledWith([mockModuleB, mockOriginForB]);
           });

            it('should instantiate module data blocks for each module', function() {
                runConsumer();
                expect(moduleDataBlockFactory.createForModule).toHaveBeenCalledWith(mockModule.id, periodRange);
            });

            it('should merge and save each module data block', function() {
                var periodA = '2016W20',
                    periodB = '2016W21',
                    mockModuleDataBlockA = { moduleId: mockModule.id, period: periodA, moduleName: 'someModuleName' },
                    mockModuleDataBlockB = { moduleId: mockModule.id, period: periodB, moduleName: 'someModuleName' },
                    mockDhisDataValueA   = { orgUnit: mockModule.id, period: periodA, value: 'someValue' },
                    mockDhisDataValueB   = { orgUnit: mockModule.id, period: periodB, value: 'someValue' },
                    mockDhisCompletionA  = { orgUnit: mockModule.id, period: periodA, isComplete: true },
                    mockDhisCompletionB  = { orgUnit: mockModule.id, period: periodB, isComplete: true },
                    mockDhisApprovalA    = { orgUnit: mockModule.id, period: periodA, isApproved: true },
                    mockDhisApprovalB    = { orgUnit: mockModule.id, period: periodB, isApproved: true };

                moduleDataBlockFactory.createForModule.and.returnValue(utils.getPromise(q, [mockModuleDataBlockA, mockModuleDataBlockB]));
                dataService.downloadData.and.returnValue(utils.getPromise(q, [mockDhisDataValueA, mockDhisDataValueB]));
                approvalService.getCompletionData.and.returnValue(utils.getPromise(q, [mockDhisCompletionA, mockDhisCompletionB]));
                approvalService.getApprovalData.and.returnValue(utils.getPromise(q, [mockDhisApprovalA, mockDhisApprovalB]));

                runConsumer();
                expect(moduleDataBlockMerger.mergeAndSaveToLocalDatabase).toHaveBeenCalledWith(mockModuleDataBlockA, [mockDhisDataValueA], mockDhisCompletionA, mockDhisApprovalA, undefined, undefined);
                expect(moduleDataBlockMerger.mergeAndSaveToLocalDatabase).toHaveBeenCalledWith(mockModuleDataBlockB, [mockDhisDataValueB], mockDhisCompletionB, mockDhisApprovalB, undefined, undefined);
            });

            it('should merge and save each module data block including origin data', function() {
                var periodA = '2016W20',
                    periodB = '2016W21',
                    mockModuleDataBlockA = { moduleId: mockModule.id, period: periodA, moduleName: 'someModuleName' },
                    mockModuleDataBlockB = { moduleId: mockModule.id, period: periodB, moduleName: 'someModuleName' },
                    mockDhisDataValueA   = { orgUnit: mockModule.id, period: periodA, value: 'someValue' },
                    mockDhisDataValueB   = { orgUnit: _.first(mockOriginOrgUnits).id, period: periodB, value: 'someValue' };

                moduleDataBlockFactory.createForModule.and.returnValue(utils.getPromise(q, [mockModuleDataBlockA, mockModuleDataBlockB]));
                dataService.downloadData.and.returnValue(utils.getPromise(q, [mockDhisDataValueA, mockDhisDataValueB]));

                runConsumer();
                expect(moduleDataBlockMerger.mergeAndSaveToLocalDatabase).toHaveBeenCalledWith(mockModuleDataBlockA, [mockDhisDataValueA], undefined, undefined, undefined, undefined);
                expect(moduleDataBlockMerger.mergeAndSaveToLocalDatabase).toHaveBeenCalledWith(mockModuleDataBlockB, [mockDhisDataValueB], undefined, undefined, undefined, undefined);
            });

            it('should merge and save line list events for each period', function (){
                var periodA = '2016W20',
                    periodB = '2016W21',
                    mockModuleDataBlockA = { moduleId: mockModule.id, period: periodA, moduleName: 'someModuleNameA', lineListService:true },
                    mockModuleDataBlockB = { moduleId: mockModule.id, period: periodB, moduleName: 'someModuleNameB', lineListService:true},
                    mockEventA = { eventDate: moment(periodA, 'GGGG[W]WW').toISOString() },
                    mockEventB = { eventDate: moment(periodB, 'GGGG[W]WW').toISOString()},
                    mockEventIds = ['mockEventIdA', 'mockEventIdB', 'mockEventIdC'];

                moduleDataBlockFactory.createForModule.and.returnValue(utils.getPromise(q, [mockModuleDataBlockA, mockModuleDataBlockB]));
                eventService.getEvents.and.returnValue(utils.getPromise(q, [mockEventA, mockEventB]));
                eventService.getEventIds.and.returnValue(utils.getPromise(q, mockEventIds));

                runConsumer();

                expect(moduleDataBlockMerger.mergeAndSaveToLocalDatabase).toHaveBeenCalledWith(mockModuleDataBlockA, undefined, undefined, undefined, [mockEventA], mockEventIds);
                expect(moduleDataBlockMerger.mergeAndSaveToLocalDatabase).toHaveBeenCalledWith(mockModuleDataBlockB, undefined, undefined, undefined, [mockEventB], mockEventIds);
            });

            it('should merge and save multiple modules', function() {
                var mockModuleA = { id: 'mockModuleIdA' },
                    mockModuleB = { id: 'mockModuleIdB' };

                orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, [mockModuleA, mockModuleB]));

                runConsumer();
                expect(moduleDataBlockFactory.createForModule).toHaveBeenCalledWith(mockModuleA.id, periodRange);
                expect(moduleDataBlockFactory.createForModule).toHaveBeenCalledWith(mockModuleB.id, periodRange);
            });

            it('should retrieve the change log for each module', function() {
                var changeLogKey = ['dataValues', mockProjectId, mockModule.id].join(':');

                runConsumer();
                expect(changeLogRepository.get).toHaveBeenCalledWith(changeLogKey);
            });

            it('should update the change log for each module after merging all data', function() {
                var changeLogKey = ['dataValues', mockProjectId, mockModule.id].join(':');

                runConsumer();
                expect(changeLogRepository.upsert).toHaveBeenCalledWith(changeLogKey, 'someTime');
            });

            it('should not update the change log if at least one module failed', function() {
                dataService.downloadData.and.returnValue(utils.getRejectedPromise(q, {}));

                runConsumer();
                expect(changeLogRepository.upsert).not.toHaveBeenCalled();
            });

            it('should continue to merge and save modules even if one module failed', function() {
                var period = '2016W21',
                    mockModuleA = { id: 'mockModuleIdA' },
                    mockModuleB = { id: 'mockModuleIdB' },
                    mockModuleC = { id: 'mockModuleIdC' },
                    mockModuleDataBlockA = { moduleId: mockModuleA.id, period: period, moduleName: 'someModuleName' },
                    mockModuleDataBlockB = { moduleId: mockModuleB.id, period: period, moduleName: 'someModuleName' },
                    mockModuleDataBlockC = { moduleId: mockModuleC.id, period: period, moduleName: 'someModuleName' };

                orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, [mockModuleA, mockModuleB, mockModuleC]));

                moduleDataBlockFactory.createForModule.and.callFake(function (moduleId) {
                    var mockModuleDataBlocks = [mockModuleDataBlockA, mockModuleDataBlockB, mockModuleDataBlockC];
                    return utils.getPromise(q, _.filter(mockModuleDataBlocks, { moduleId: moduleId }));
                });

                dataService.downloadData.and.callFake(function(moduleId) {
                    return moduleId == mockModuleB.id ? utils.getRejectedPromise(q, {}) : utils.getPromise(q, []);
                });

                runConsumer();
                expect(moduleDataBlockMerger.mergeAndSaveToLocalDatabase).toHaveBeenCalledWith(mockModuleDataBlockA, undefined, undefined, undefined, undefined, undefined);
                expect(moduleDataBlockMerger.mergeAndSaveToLocalDatabase).not.toHaveBeenCalledWith(mockModuleDataBlockB, undefined, undefined, undefined, undefined, undefined);
                expect(moduleDataBlockMerger.mergeAndSaveToLocalDatabase).toHaveBeenCalledWith(mockModuleDataBlockC, undefined, undefined, undefined, undefined, undefined);
            });

            it('should not continue to merge and save modules if a module has failed because of loss in network connectivity', function() {
                    var period = '2016W21',
                        mockModuleA = { id: 'mockModuleIdA' },
                        mockModuleB = { id: 'mockModuleIdB' },
                        mockModuleDataBlockA = { moduleId: mockModuleA.id, period: period, moduleName: 'someModuleName' },
                        mockModuleDataBlockB = { moduleId: mockModuleB.id, period: period, moduleName: 'someModuleName' };

                    orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, [mockModuleA, mockModuleB]));

                    moduleDataBlockFactory.createForModule.and.callFake(function (moduleId) {
                        var mockModuleDataBlocks = [mockModuleDataBlockA, mockModuleDataBlockB];
                        return utils.getPromise(q, _.filter(mockModuleDataBlocks, { moduleId: moduleId }));
                    });

                    dataService.downloadData.and.callFake(function(moduleId) {
                        return moduleId == mockModuleB.id ? utils.getRejectedPromise(q, { errorCode: 'NETWORK_UNAVAILABLE'}) : utils.getPromise(q, []);
                    });

                    runConsumer();
                    expect(moduleDataBlockMerger.mergeAndSaveToLocalDatabase).not.toHaveBeenCalledWith(mockModuleDataBlockB, undefined, undefined, undefined, undefined, undefined);
                    expect(moduleDataBlockMerger.mergeAndSaveToLocalDatabase).not.toHaveBeenCalledWith(mockModuleDataBlockA, undefined, undefined, undefined, undefined, undefined);
                });

            it('should get the system info server data', function () {
                runConsumer();
                expect(systemInfoService.getServerDate).toHaveBeenCalled();
            });
        });
    });