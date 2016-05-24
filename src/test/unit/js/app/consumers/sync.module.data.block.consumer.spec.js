define(['syncModuleDataBlockConsumer', 'datasetRepository', 'approvalService', 'orgUnitRepository', 'moduleDataBlockFactory', 'dataService', 'moduleDataBlockMerger', 'changeLogRepository', 'utils', 'angularMocks'],
    function (SyncModuleDataBlockConsumer, DataSetRepository, ApprovalService, OrgUnitRepository, ModuleDataBlockFactory, DataService, ModuleDataBlockMerger, ChangeLogRepository, utils, mocks) {
        var syncModuleDataBlockConsumer, moduleDataBlockFactory, dataSetRepository, dataService, approvalService, orgUnitRepository, moduleDataBlockMerger, changeLogRepository,
            scope, q,
            mockModule, mockPeriod, message, aggregateDataSet, mockOriginOrgUnits, mockOriginOrgUnitIds;

        describe('syncModuleDataBlockConsumer', function() {
            beforeEach(mocks.inject(function($rootScope, $q) {
                scope = $rootScope.$new();
                q = $q;

                mockModule = {
                    id: 'randomId',
                    name: 'randomName'
                };
                mockPeriod = '2016W20';
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

                mockOriginOrgUnits = [{
                    id: 'someOriginId'
                }];
                mockOriginOrgUnitIds = _.pluck(mockOriginOrgUnits, 'id');

                dataSetRepository = new DataSetRepository();
                spyOn(dataSetRepository, 'getAll').and.returnValue(utils.getPromise(q, [aggregateDataSet]));

                moduleDataBlockFactory = new ModuleDataBlockFactory();
                spyOn(moduleDataBlockFactory, 'createForModule').and.returnValue(utils.getPromise(q, {}));

                orgUnitRepository = new OrgUnitRepository();
                spyOn(orgUnitRepository, 'findAllByParent').and.returnValue(utils.getPromise(q, mockOriginOrgUnits));
                
                dataService = new DataService();
                spyOn(dataService, 'downloadData').and.returnValue(utils.getPromise(q, {}));

                approvalService = new ApprovalService();
                spyOn(approvalService, 'getCompletionData').and.returnValue(utils.getPromise(q, {}));
                spyOn(approvalService, 'getApprovalData').and.returnValue(utils.getPromise(q, {}));

                moduleDataBlockMerger = new ModuleDataBlockMerger();
                spyOn(moduleDataBlockMerger, 'mergeAndSaveToLocalDatabase').and.returnValue(utils.getPromise(q, {}));

                changeLogRepository =  new ChangeLogRepository();
                spyOn(changeLogRepository, 'upsert').and.returnValue(utils.getPromise(q, {}));

                syncModuleDataBlockConsumer = new SyncModuleDataBlockConsumer(moduleDataBlockFactory, dataService, dataSetRepository, approvalService, orgUnitRepository, moduleDataBlockMerger, changeLogRepository);
            }));

            var runConsumer = function () {
                syncModuleDataBlockConsumer.run(message);
                scope.$apply();
            };

            it('should instantiate a module data block for one module', function() {
                runConsumer();
                expect(moduleDataBlockFactory.createForModule).toHaveBeenCalledWith(mockModule.id, mockPeriod);
            });

            it('should download data values from DHIS for one module', function() {
                runConsumer();
                expect(dataService.downloadData).toHaveBeenCalledWith(mockModule.id, [aggregateDataSet.id], mockPeriod, null);
            });

            it('should download completion data from DHIS for one module', function () {
                runConsumer();
                expect(approvalService.getCompletionData).toHaveBeenCalledWith(mockModule.id, mockOriginOrgUnitIds, [aggregateDataSet.id], mockPeriod);
            });

            it('should download approval data from DHIS for one module', function () {
                runConsumer();
                expect(approvalService.getApprovalData).toHaveBeenCalledWith(mockModule.id, [aggregateDataSet.id], mockPeriod);
            });

            it('should merge and save module data block', function() {
                var period = '2016W20',
                    mockModuleDataBlock = { moduleId: mockModule.id, period: period, moduleName: 'someModuleName' },
                    mockDhisDataValue   = { orgUnit: mockModule.id, period: period, value: 'someValue' },
                    mockDhisCompletion  = { orgUnit: mockModule.id, period: period, isComplete: true },
                    mockDhisApproval    = { orgUnit: mockModule.id, period: period, isApproved: true };

                moduleDataBlockFactory.createForModule.and.returnValue(utils.getPromise(q, [mockModuleDataBlock]));
                dataService.downloadData.and.returnValue(utils.getPromise(q, [mockDhisDataValue]));
                approvalService.getCompletionData.and.returnValue(utils.getPromise(q, [mockDhisCompletion]));
                approvalService.getApprovalData.and.returnValue(utils.getPromise(q, [mockDhisApproval]));

                runConsumer();
                expect(moduleDataBlockMerger.mergeAndSaveToLocalDatabase).toHaveBeenCalledWith(mockModuleDataBlock, [mockDhisDataValue], mockDhisCompletion, mockDhisApproval);
            });
        });
    });

