define(['moduleDataBlockFactory', 'orgUnitRepository', 'moduleDataBlock', 'utils', 'angularMocks'],
    function (ModuleDataBlockFactory, OrgUnitRepository, ModuleDataBlock, utils, mocks) {
        var q, scope, moduleDataBlockFactory, orgUnitRepository;
        var projectId, periodRange, defaultPeriodForTesting;

        describe('ModuleDataBlockFactory', function() {
            describe('createForProject', function() {
                var createModuleDataBlocksFromFactory = function() {
                    var returnedObjects = null;
                    moduleDataBlockFactory.createForProject(projectId, periodRange).then(function (data) {
                        returnedObjects = data;
                    });
                    scope.$apply();
                    return returnedObjects;
                };

                beforeEach(mocks.inject(function ($q, $rootScope) {
                    q = $q;
                    scope = $rootScope.$new();

                    orgUnitRepository = new OrgUnitRepository();
                    spyOn(orgUnitRepository, "getAllModulesInOrgUnits").and.returnValue(utils.getPromise(q, []));

                    spyOn(ModuleDataBlock, 'create').and.returnValue('mockModuleDataBlock');

                    projectId = 'myProjectId';
                    defaultPeriodForTesting = '2016W20';
                    periodRange = [defaultPeriodForTesting];

                    moduleDataBlockFactory = new ModuleDataBlockFactory(orgUnitRepository);
                }));

                it('should create module data block for one module in project', function() {
                    var moduleOrgUnit = {};
                    orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, [moduleOrgUnit]));

                    var mockModuleDataBlock = 'myModuleDataBlock';
                    ModuleDataBlock.create.and.returnValue(mockModuleDataBlock);

                    var returnedObjects = createModuleDataBlocksFromFactory();

                    expect(orgUnitRepository.getAllModulesInOrgUnits).toHaveBeenCalledWith(projectId);
                    expect(ModuleDataBlock.create).toHaveBeenCalledWith(moduleOrgUnit, defaultPeriodForTesting, {}, {}, {});
                    expect(returnedObjects).toEqual([mockModuleDataBlock]);
                });

                it('should create module data blocks for multiple modules in project', function() {
                    var moduleOrgUnitA = {}, moduleOrgUnitB = {};
                    orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, [moduleOrgUnitA, moduleOrgUnitB]));

                    var returnedObjects = createModuleDataBlocksFromFactory();

                    expect(ModuleDataBlock.create).toHaveBeenCalledWith(moduleOrgUnitA, defaultPeriodForTesting, {}, {}, {});
                    expect(ModuleDataBlock.create).toHaveBeenCalledWith(moduleOrgUnitB, defaultPeriodForTesting, {}, {}, {});
                    expect(returnedObjects.length).toEqual(2);
                });

                it('should create module data block for multiple periods', function() {
                    var moduleOrgUnit = {};
                    orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, [moduleOrgUnit]));

                    periodRange = ['2016W20', '2016W21', '2016W22'];

                    var returnedObjects = createModuleDataBlocksFromFactory();

                    expect(ModuleDataBlock.create).toHaveBeenCalledWith(moduleOrgUnit, '2016W20', {}, {}, {});
                    expect(ModuleDataBlock.create).toHaveBeenCalledWith(moduleOrgUnit, '2016W21', {}, {}, {});
                    expect(ModuleDataBlock.create).toHaveBeenCalledWith(moduleOrgUnit, '2016W22', {}, {}, {});
                    expect(returnedObjects.length).toEqual(3);
                });
            });
        });
});