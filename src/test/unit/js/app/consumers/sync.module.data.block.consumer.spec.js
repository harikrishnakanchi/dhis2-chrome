define(['syncModuleDataBlockConsumer', "dataSetRepository", 'approvalService', 'orgUnitRepository', 'moduleDataBlockFactory', 'dataService', 'eventService', 'moduleDataBlockMerger', 'changeLogRepository', 'utils', 'angularMocks', 'dateUtils', 'properties'],
    function (SyncModuleDataBlockConsumer, DataSetRepository, ApprovalService, OrgUnitRepository, ModuleDataBlockFactory, DataService, EventService, ModuleDataBlockMerger, ChangeLogRepository, utils, mocks, dateUtils, properties) {
        var syncModuleDataBlockConsumer, moduleDataBlockFactory, dataSetRepository, dataService, eventService, approvalService, orgUnitRepository, moduleDataBlockMerger, changeLogRepository,
            scope, q,
            mockModule, mockPeriod, message, aggregateDataSet, mockOriginOrgUnits, lineListDataSet, periodRange, mockProject, someMomentInTime;

        describe('syncModuleDataBlockConsumer', function() {
            beforeEach(mocks.inject(function($rootScope, $q) {
                scope = $rootScope.$new();
                q = $q;

                mockProject = {
                    id: 'someProjectId'
                };
                mockModule = {
                    id: 'randomId',
                    name: 'randomName'
                };
                mockPeriod = '2016W20';
                someMomentInTime = '2016-06-30T15:59:59.888Z';
                message = {
                    data: {
                        data: {
                            moduleId: mockModule.id,
                            period: mockPeriod
                        }
                    }
                };
                aggregateDataSet = {
                    id: 'someAggregateDataSet',
                    isLineListService: false
                };

                lineListDataSet = {
                    id: 'someLineListDataSet',
                    isLineListService: true
                };

                mockOriginOrgUnits = [{
                    id: 'someOriginId'
                }];

                periodRange = ['2016W17', '2016W18'];
                spyOn(dateUtils, "getPeriodRangeInWeeks").and.returnValue(periodRange);

                dataSetRepository = new DataSetRepository();
                spyOn(dataSetRepository, 'findAllForOrgUnits').and.returnValue(utils.getPromise(q, [aggregateDataSet]));

                moduleDataBlockFactory = new ModuleDataBlockFactory();
                spyOn(moduleDataBlockFactory, 'create').and.returnValue(utils.getPromise(q, {}));

                orgUnitRepository = new OrgUnitRepository();
                spyOn(orgUnitRepository, 'get').and.returnValue(utils.getPromise(q, mockModule));
                spyOn(orgUnitRepository, 'findAllByParent').and.returnValue(utils.getPromise(q, mockOriginOrgUnits));
                spyOn(orgUnitRepository, 'getParentProject').and.returnValue(utils.getPromise(q, mockProject));

                dataService = new DataService();
                spyOn(dataService, 'downloadData').and.returnValue(utils.getPromise(q, {}));

                eventService = new EventService();
                spyOn(eventService, 'getEvents').and.returnValue(utils.getPromise(q, []));
                spyOn(eventService, 'getEventIds').and.returnValue(utils.getPromise(q, []));

                approvalService = new ApprovalService();
                spyOn(approvalService, 'getCompletionData').and.returnValue(utils.getPromise(q, {}));
                spyOn(approvalService, 'getApprovalData').and.returnValue(utils.getPromise(q, {}));

                moduleDataBlockMerger = new ModuleDataBlockMerger();
                spyOn(moduleDataBlockMerger, 'mergeAndSaveToLocalDatabase').and.returnValue(utils.getPromise(q, {}));
                spyOn(moduleDataBlockMerger, 'uploadToDHIS').and.returnValue(utils.getPromise(q, {}));

                changeLogRepository =  new ChangeLogRepository();
                spyOn(changeLogRepository, 'get').and.returnValue(utils.getPromise(q, someMomentInTime));

                syncModuleDataBlockConsumer = new SyncModuleDataBlockConsumer(moduleDataBlockFactory, dataService, eventService, dataSetRepository, approvalService, orgUnitRepository, changeLogRepository, moduleDataBlockMerger, q);
            }));

            var runConsumer = function () {
                syncModuleDataBlockConsumer.run(message);
                scope.$apply();
            };

            it('should load the module from the repository', function () {
                runConsumer();
                expect(orgUnitRepository.get).toHaveBeenCalledWith(mockModule.id);
            });

            it('should instantiate a module data block for one module', function() {
                runConsumer();
                expect(moduleDataBlockFactory.create).toHaveBeenCalledWith(mockModule.id, mockPeriod);
            });

            it('should retrieve the lastUpdated time for the project', function () {
                runConsumer();
                expect(changeLogRepository.get).toHaveBeenCalledWith('dataValues:' + mockProject.id + ":" + mockModule.id);
            });

            describe('download data for an aggregate module', function () {
                beforeEach(function () {
                    var mockAggregateModuleDataBlock = { lineListService: false };
                    moduleDataBlockFactory.create.and.returnValue(utils.getPromise(q, mockAggregateModuleDataBlock));
                });

                it('should download data values', function() {
                    runConsumer();
                    expect(dataService.downloadData).toHaveBeenCalledWith(mockModule.id, [aggregateDataSet.id], mockPeriod, someMomentInTime);
                });

                it('should not download data values for program summary dataSets', function() {
                    dataSetRepository.findAllForOrgUnits.and.returnValue(utils.getPromise(q, [aggregateDataSet, lineListDataSet]));
                    runConsumer();
                    expect(dataService.downloadData).toHaveBeenCalledWith(mockModule.id, [aggregateDataSet.id], mockPeriod, someMomentInTime);
                });

                it('should not download events', function (){
                    runConsumer();
                    expect(eventService.getEvents).not.toHaveBeenCalled();
                });

                it('should not download all event ids', function () {
                    expect(eventService.getEventIds).not.toHaveBeenCalled();
                });
            });

            describe('download data for a line list module', function () {
                beforeEach(function () {
                    var mockLineListModuleDataBlock = { lineListService: true };
                    moduleDataBlockFactory.create.and.returnValue(utils.getPromise(q, mockLineListModuleDataBlock));
                    runConsumer();
                });

                it('should not download data values', function() {
                    expect(dataService.downloadData).not.toHaveBeenCalled();
                });

                it('should download events', function (){
                    expect(eventService.getEvents).toHaveBeenCalledWith(mockModule.id, [mockPeriod], someMomentInTime);
                });

                it('should download all event ids for the specified number of weeks to sync', function () {
                    expect(dateUtils.getPeriodRangeInWeeks).toHaveBeenCalledWith(properties.projectDataSync.numWeeksToSync);
                    expect(eventService.getEventIds).toHaveBeenCalledWith(mockModule.id, periodRange);
                });
            });

            it('should download completion data from DHIS for one module', function () {
                runConsumer();
                expect(approvalService.getCompletionData).toHaveBeenCalledWith(mockModule.id, mockOriginOrgUnits, [aggregateDataSet.id], [mockPeriod]);
            });

            it('should download completion data from DHIS for lineList data sets', function () {
                dataSetRepository.findAllForOrgUnits.and.returnValue(utils.getPromise(q, [aggregateDataSet, lineListDataSet]));
                runConsumer();
                expect(approvalService.getCompletionData).toHaveBeenCalledWith(mockModule.id, mockOriginOrgUnits, [aggregateDataSet.id, lineListDataSet.id], [mockPeriod]);
            });

            it('should download approval data from DHIS for one module', function () {
                runConsumer();
                expect(approvalService.getApprovalData).toHaveBeenCalledWith(mockModule.id, [aggregateDataSet.id], [mockPeriod]);
            });

            it('should download approval data from DHIS for lineList data sets', function () {
                dataSetRepository.findAllForOrgUnits.and.returnValue(utils.getPromise(q, [aggregateDataSet, lineListDataSet]));
                runConsumer();
                expect(approvalService.getApprovalData).toHaveBeenCalledWith(mockModule.id, [aggregateDataSet.id, lineListDataSet.id], [mockPeriod]);
            });

            it('should download data and approval only for dataSets associated with each module and origin', function(){
                runConsumer();
                expect(dataSetRepository.findAllForOrgUnits).toHaveBeenCalledWith(mockOriginOrgUnits.concat(mockModule));
            });

            it('should merge and save module data block', function() {
                var period = '2016W20',
                    mockModuleDataBlock = { moduleId: mockModule.id, period: period, moduleName: 'someModuleName' },
                    mockDhisDataValue   = { orgUnit: mockModule.id, period: period, value: 'someValue' },
                    mockDhisCompletion  = { orgUnit: mockModule.id, period: period, isComplete: true },
                    mockDhisApproval    = { orgUnit: mockModule.id, period: period, isApproved: true };

                moduleDataBlockFactory.create.and.returnValue(utils.getPromise(q, mockModuleDataBlock));
                dataService.downloadData.and.returnValue(utils.getPromise(q, [mockDhisDataValue]));
                approvalService.getCompletionData.and.returnValue(utils.getPromise(q, [mockDhisCompletion]));
                approvalService.getApprovalData.and.returnValue(utils.getPromise(q, [mockDhisApproval]));

                runConsumer();
                expect(moduleDataBlockMerger.mergeAndSaveToLocalDatabase).toHaveBeenCalledWith(mockModuleDataBlock, [mockDhisDataValue], mockDhisCompletion, mockDhisApproval, undefined, undefined);
            });

            it('should merge and save events', function() {
                var mockModuleDataBlock = { lineListService: true },
                    mockEvents = [{event:'someEventId'}],
                    mockEventIds = ['someOtherEventId'];

                moduleDataBlockFactory.create.and.returnValue(utils.getPromise(q, mockModuleDataBlock));
                eventService.getEvents.and.returnValue(utils.getPromise(q, mockEvents));
                eventService.getEventIds.and.returnValue(utils.getPromise(q, mockEventIds));

                runConsumer();
                expect(moduleDataBlockMerger.mergeAndSaveToLocalDatabase).toHaveBeenCalledWith(mockModuleDataBlock, undefined, undefined, undefined, mockEvents, mockEventIds);
            });

            it('should re-instantiate the module data block a second time', function() {
                runConsumer();
                expect(moduleDataBlockFactory.create).toHaveBeenCalledTimes(2);
            });

            it('should upload module data block to DHIS', function() {
                var mockModuleDataBlockBeforeDownstreamSync = { lineListService: true, moduleName: 'beforeDownstreamSync', someCollection: ['someItem'] },
                    mockModuleDataBlockAfterDownstreamSync = { lineListService: true, moduleName: 'afterDownstreamSync' },
                    mockDhisCompletion  = { orgUnit: mockModule.id, period: mockPeriod, isComplete: true },
                    mockDhisApproval    = { orgUnit: mockModule.id, period: mockPeriod, isApproved: true },
                    mockEventIds = ['someEventId'],
                    moduleDataBlockFactoryHasBeenCalledBefore = false;

                moduleDataBlockFactory.create.and.callFake(function() {
                    var moduleDataBlock = moduleDataBlockFactoryHasBeenCalledBefore ? mockModuleDataBlockAfterDownstreamSync : mockModuleDataBlockBeforeDownstreamSync,
                        cloneOfModuleDataBlock = _.merge({}, moduleDataBlock);
                    moduleDataBlockFactoryHasBeenCalledBefore = true;
                    return utils.getPromise(q, cloneOfModuleDataBlock);
                });
                eventService.getEventIds.and.returnValue(utils.getPromise(q, mockEventIds));
                approvalService.getCompletionData.and.returnValue(utils.getPromise(q, [mockDhisCompletion]));
                approvalService.getApprovalData.and.returnValue(utils.getPromise(q, [mockDhisApproval]));

                runConsumer();
                expect(moduleDataBlockMerger.uploadToDHIS).toHaveBeenCalledWith(mockModuleDataBlockAfterDownstreamSync, mockDhisCompletion, mockDhisApproval, mockEventIds);
            });
        });
    });
