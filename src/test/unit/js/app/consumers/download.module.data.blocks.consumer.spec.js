define(['downloadModuleDataBlocksConsumer', 'dataService', 'approvalService', 'datasetRepository', 'changeLogRepository', 'orgUnitRepository', 'moduleDataBlockFactory',
        'moduleDataBlockMerger', 'angularMocks', 'dateUtils', 'utils', 'timecop'],
    function(DownloadModuleDataBlocksConsumer, DataService, ApprovalService, DataSetRepository, ChangeLogRepository, OrgUnitRepository, ModuleDataBlockFactory,
             ModuleDataBlockMerger, mocks, dateUtils, utils, timecop) {
        
        var downloadModuleDataBlocksConsumer, dataService, approvalService,
            userPreferenceRepository, datasetRepository, changeLogRepository, orgUnitRepository,
            moduleDataBlockFactory, moduleDataBlockMerger,
            q, scope, aggregateDataSet, periodRange, projectIds, mockModule, mockOriginOrgUnits, someMomentInTime, message;

        describe('downloadModuleDataBlocksConsumer', function() {
            beforeEach(mocks.inject(function($rootScope, $q) {
                q = $q;
                scope = $rootScope.$new();

                mockModule = {
                    id: 'someModuleId'
                };
                mockOriginOrgUnits = [{
                    id: 'someOriginId'
                }];
                projectIds = ['projectId'];
                message = {
                    data : {
                        data: projectIds
                    }
                };
                aggregateDataSet = {
                    id: 'someAggregateDataSetId',
                    isLineListService: false
                };
                periodRange = ['2016W20', '2016W21'];
                someMomentInTime = '2016-05-20T15:48:00.888Z';

                spyOn(dateUtils, "getPeriodRange").and.returnValue(periodRange);

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

                changeLogRepository =  new ChangeLogRepository();
                spyOn(changeLogRepository, 'get').and.returnValue(utils.getPromise(q, someMomentInTime));
                spyOn(changeLogRepository, 'upsert').and.returnValue(utils.getPromise(q, {}));

                moduleDataBlockFactory = new ModuleDataBlockFactory();
                spyOn(moduleDataBlockFactory, 'createForModule').and.returnValue(utils.getPromise(q, []));

                moduleDataBlockMerger = new ModuleDataBlockMerger();
                spyOn(moduleDataBlockMerger, 'mergeAndSaveToLocalDatabase').and.returnValue(utils.getPromise(q, {}));

                downloadModuleDataBlocksConsumer = new DownloadModuleDataBlocksConsumer(dataService, approvalService, datasetRepository,
                    changeLogRepository, orgUnitRepository, moduleDataBlockFactory, moduleDataBlockMerger, q);
            }));

            var runConsumer = function() {
                downloadModuleDataBlocksConsumer.run(message);
                scope.$apply();
            };

            it('should download data values from DHIS for each module', function() {
                runConsumer();
                expect(dataService.downloadData).toHaveBeenCalledWith(mockModule.id, [aggregateDataSet.id], periodRange, someMomentInTime);
            });

            it('should download completion data from DHIS for each module', function () {
                runConsumer();
                expect(approvalService.getCompletionData).toHaveBeenCalledWith(mockModule.id, mockOriginOrgUnits, [aggregateDataSet.id], periodRange);
            });

            it('should download approval data from DHIS for each module', function () {
                runConsumer();
                expect(approvalService.getApprovalData).toHaveBeenCalledWith(mockModule.id, [aggregateDataSet.id], periodRange);
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

                expect(datasetRepository.findAllForOrgUnits).toHaveBeenCalledWith([mockOriginForA.id, mockModuleA.id]);
                expect(datasetRepository.findAllForOrgUnits).toHaveBeenCalledWith([mockOriginForB.id, mockModuleB.id]);
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
                expect(moduleDataBlockMerger.mergeAndSaveToLocalDatabase).toHaveBeenCalledWith(mockModuleDataBlockA, [mockDhisDataValueA], mockDhisCompletionA, mockDhisApprovalA);
                expect(moduleDataBlockMerger.mergeAndSaveToLocalDatabase).toHaveBeenCalledWith(mockModuleDataBlockB, [mockDhisDataValueB], mockDhisCompletionB, mockDhisApprovalB);
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
                expect(moduleDataBlockMerger.mergeAndSaveToLocalDatabase).toHaveBeenCalledWith(mockModuleDataBlockA, [mockDhisDataValueA], undefined, undefined);
                expect(moduleDataBlockMerger.mergeAndSaveToLocalDatabase).toHaveBeenCalledWith(mockModuleDataBlockB, [mockDhisDataValueB], undefined, undefined);
            });

            it('should merge and save multiple modules', function() {
                var mockModuleA = { id: 'mockModuleIdA' },
                    mockModuleB = { id: 'mockModuleIdB' };

                orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, [mockModuleA, mockModuleB]));

                runConsumer();
                expect(moduleDataBlockFactory.createForModule).toHaveBeenCalledWith(mockModuleA.id, periodRange);
                expect(moduleDataBlockFactory.createForModule).toHaveBeenCalledWith(mockModuleB.id, periodRange);
            });

            it('should update the change log after merging all data', function() {
                var changeLogKey = 'dataValues:' + projectIds.join(';'),
                    currentTime = '2016-05-21T00:00:00.000Z';

                Timecop.install();
                Timecop.freeze(currentTime);

                runConsumer();
                expect(changeLogRepository.upsert).toHaveBeenCalledWith(changeLogKey, currentTime);
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
                expect(moduleDataBlockMerger.mergeAndSaveToLocalDatabase).toHaveBeenCalledWith(mockModuleDataBlockA, undefined, undefined, undefined);
                expect(moduleDataBlockMerger.mergeAndSaveToLocalDatabase).not.toHaveBeenCalledWith(mockModuleDataBlockB, undefined, undefined, undefined);
                expect(moduleDataBlockMerger.mergeAndSaveToLocalDatabase).toHaveBeenCalledWith(mockModuleDataBlockC, undefined, undefined, undefined);
            });
        });
    });