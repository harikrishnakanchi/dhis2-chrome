define(['downloadModuleDataBlocksConsumer', 'dataService', 'approvalService', 'datasetRepository', 'userPreferenceRepository', 'changeLogRepository', 'orgUnitRepository', 'moduleDataBlockFactory',
        'moduleDataBlockMerger', 'angularMocks', 'dateUtils', 'utils'],
    function(DownloadModuleDataBlocksConsumer, DataService, ApprovalService, DataSetRepository, UserPreferenceRepository, ChangeLogRepository, OrgUnitRepository, ModuleDataBlockFactory,
             ModuleDataBlockMerger, mocks, dateUtils, utils) {
        
        var downloadModuleDataBlocksConsumer, dataService, approvalService,
            userPreferenceRepository, datasetRepository, changeLogRepository, orgUnitRepository,
            moduleDataBlockFactory, moduleDataBlockMerger,
            q, scope, dataSetId, periodRange, projectIds, mockModule, mockOriginOrgUnits, mockOriginOrgUnitIds, someMomentInTime;

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
                mockOriginOrgUnitIds = _.pluck(mockOriginOrgUnits, 'id');
                projectIds = ['projectId'];
                dataSetId = 'someDataSetId';
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
                spyOn(datasetRepository, 'getAll').and.returnValue(utils.getPromise(q, [{ id: dataSetId }]));

                userPreferenceRepository = new UserPreferenceRepository();
                spyOn(userPreferenceRepository, 'getCurrentUsersProjectIds').and.returnValue(utils.getPromise(q, projectIds));

                changeLogRepository =  new ChangeLogRepository();
                spyOn(changeLogRepository, 'get').and.returnValue(utils.getPromise(q, someMomentInTime));

                moduleDataBlockFactory = new ModuleDataBlockFactory();
                spyOn(moduleDataBlockFactory, 'createForModule').and.returnValue(utils.getPromise(q, []));

                moduleDataBlockMerger = new ModuleDataBlockMerger();
                spyOn(moduleDataBlockMerger, 'mergeAndSaveToLocalDatabase').and.returnValue(utils.getPromise(q, {}));

                downloadModuleDataBlocksConsumer = new DownloadModuleDataBlocksConsumer(dataService, approvalService, datasetRepository,
                    userPreferenceRepository, changeLogRepository, orgUnitRepository, moduleDataBlockFactory, moduleDataBlockMerger, q);
            }));

            var runConsumer = function() {
                downloadModuleDataBlocksConsumer.run();
                scope.$apply();
            };

            it('should download data values from DHIS for each module', function() {
                runConsumer();
                expect(dataService.downloadData).toHaveBeenCalledWith(mockModule.id, [dataSetId], periodRange, someMomentInTime);
            });

            it('should download completion data from DHIS for each module', function () {
                runConsumer();
                expect(approvalService.getCompletionData).toHaveBeenCalledWith(mockModule.id, mockOriginOrgUnitIds, [dataSetId]);
            });

            it('should download approval data from DHIS for each module', function () {
                runConsumer();
                expect(approvalService.getApprovalData).toHaveBeenCalledWith(mockModule.id, [dataSetId], periodRange);
            });

            it('should instantiate module data blocks for each module', function() {
                runConsumer();
                expect(moduleDataBlockFactory.createForModule).toHaveBeenCalledWith(mockModule.id, periodRange);
            });

            it('should merge and save each module data block', function() {
                var periodA = '2016W20',
                    periodB = '2016W21',
                    mockModuleDataBlockA = { orgUnit: mockModule.id, period: periodA, moduleName: 'someModuleName' },
                    mockModuleDataBlockB = { orgUnit: mockModule.id, period: periodB, moduleName: 'someModuleName' },
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
        });
    });