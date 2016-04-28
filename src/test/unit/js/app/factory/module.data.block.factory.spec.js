define(['moduleDataBlockFactory', 'orgUnitRepository', 'moduleDataBlock', 'utils', 'angularMocks'],
    function (ModuleDataBlockFactory, OrgUnitRepository, ModuleDataBlock, utils, mocks) {
        var q, scope, moduleDataBlockFactory, orgUnitRepository;
        var projectId, startPeriod, endPeriod;

        fdescribe('ModuleDataBlockFactory', function() {
            describe('createForProject', function() {
                var createModuleDataBlocksFromFactory = function() {
                    var returnedObjects = null;
                    moduleDataBlockFactory.createForProject(projectId, startPeriod, endPeriod).then(function (data) {
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
                    startPeriod = '2016W20';
                    endPeriod = '2016W20';

                    moduleDataBlockFactory = new ModuleDataBlockFactory(orgUnitRepository);
                }));

                it('should create module data block for module in project for one period', function() {
                    var moduleOrgUnit = {};
                    orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, [moduleOrgUnit]));

                    var mockModuleDataBlock = 'myModuleDataBlock';
                    ModuleDataBlock.create.and.returnValue(mockModuleDataBlock);

                    var returnedObjects = createModuleDataBlocksFromFactory();

                    expect(orgUnitRepository.getAllModulesInOrgUnits).toHaveBeenCalledWith(projectId);
                    expect(ModuleDataBlock.create).toHaveBeenCalledWith(moduleOrgUnit, startPeriod, {}, {}, {});
                    expect(returnedObjects).toEqual([mockModuleDataBlock]);
                });

                it('should create module data block for multiple modules in project for one period', function() {
                    var moduleOrgUnitA = {}, moduleOrgUnitB = {};
                    orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, [moduleOrgUnitA, moduleOrgUnitB]));

                    var returnedObjects = createModuleDataBlocksFromFactory();

                    expect(ModuleDataBlock.create).toHaveBeenCalledWith(moduleOrgUnitA, startPeriod, {}, {}, {});
                    expect(ModuleDataBlock.create).toHaveBeenCalledWith(moduleOrgUnitB, startPeriod, {}, {}, {});
                    expect(returnedObjects.length).toEqual(2);
                });
            });
        });
});