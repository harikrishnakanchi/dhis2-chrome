define(['downloadModuleDataBlocksConsumer', 'dataService', 'approvalService', 'datasetRepository', 'userPreferenceRepository', 'changeLogRepository', 'orgUnitRepository', 'moduleDataBlockFactory', 'angularMocks', 'dateUtils', 'utils'],
    function(DownloadModuleDataBlocksConsumer, DataService, ApprovalService, DataSetRepository, UserPreferenceRepository, ChangeLogRepository, OrgUnitRepository, ModuleDataBlockFactory,
             mocks, dateUtils, utils) {
        
        var downloadModuleDataBlocksConsumer, dataService, approvalService, userPreferenceRepository, datasetRepository, moduleDataBlockFactory, changeLogRepository, orgUnitRepository,
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
                spyOn(moduleDataBlockFactory, 'createForProject').and.returnValue(utils.getPromise(q, []));

                downloadModuleDataBlocksConsumer = new DownloadModuleDataBlocksConsumer(dataService, approvalService, datasetRepository,
                    userPreferenceRepository, moduleDataBlockFactory, changeLogRepository, orgUnitRepository);
            }));

            it('should download data values from DHIS for one module', function() {
                downloadModuleDataBlocksConsumer.run();
                scope.$apply();

                expect(dataService.downloadData).toHaveBeenCalledWith(mockModule.id, [dataSetId], periodRange, someMomentInTime);
            });

            it('should download completion data from DHIS for one module', function () {
                downloadModuleDataBlocksConsumer.run();
                scope.$apply();

                expect(approvalService.getCompletionData).toHaveBeenCalledWith(mockModule.id, mockOriginOrgUnitIds, [dataSetId]);
            });
        });
    });