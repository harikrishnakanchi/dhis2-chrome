define(['moduleDataBlockFactory', 'orgUnitRepository', 'dataRepository', 'moduleDataBlock', 'utils', 'angularMocks'],
    function (ModuleDataBlockFactory, OrgUnitRepository, DataRepository, ModuleDataBlock, utils, mocks) {
        var q, scope, moduleDataBlockFactory, orgUnitRepository, dataRepository;
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
                    spyOn(orgUnitRepository, 'getAllModulesInOrgUnits').and.returnValue(utils.getPromise(q, []));
                    spyOn(orgUnitRepository, "findAllByParent").and.returnValue(utils.getPromise(q, []));

                    dataRepository = new DataRepository();
                    spyOn(dataRepository, 'getDataValuesForOrgUnitsAndPeriods').and.returnValue(utils.getPromise(q, {}));

                    spyOn(ModuleDataBlock, 'create').and.returnValue('mockModuleDataBlock');

                    projectId = 'myProjectId';
                    defaultPeriodForTesting = '2016W20';
                    periodRange = [defaultPeriodForTesting];

                    moduleDataBlockFactory = new ModuleDataBlockFactory(q, orgUnitRepository, dataRepository);
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

                it('should create module data blocks for aggregate data values', function () {
                    var aggregateDataValue = {
                        period: '2016W20',
                        dataValues: [{
                            value: 'someValue'
                        }],
                        orgUnit: 'ou1'
                    };

                    var moduleOrgUnit = {id: 'ou1'};
                    orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, [moduleOrgUnit]));

                    dataRepository.getDataValuesForOrgUnitsAndPeriods.and.returnValue(utils.getPromise(q, [aggregateDataValue]));
                    var returnedObjects = createModuleDataBlocksFromFactory();

                    expect(ModuleDataBlock.create).toHaveBeenCalledWith(moduleOrgUnit, defaultPeriodForTesting, aggregateDataValue, {}, {});
                    expect(returnedObjects.length).toEqual(1);
                });

                it('should create module data blocks with aggregate data values for multiple periods', function () {
                    var aggregateDataValueA = {
                        period: '2016W01',
                        dataValues: [{
                            value: 'someValue'
                        }],
                        orgUnit: 'ou1'
                    }, aggregateDataValueB = {
                        period: '2016W02',
                        dataValues: [{
                            value: 'someValue'
                        }],
                        orgUnit: 'ou1'
                    }, aggregateDataValueC = {
                        period: '2016W02',
                        dataValues: [{
                            value: 'someValue'
                        }],
                        orgUnit: 'ou2'
                    };

                    periodRange = ['2016W01', '2016W02'];

                    var moduleOrgUnit1 = { id: 'ou1' };
                    var moduleOrgUnit2 = { id: 'ou2' };
                    orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, [moduleOrgUnit1, moduleOrgUnit2]));

                    dataRepository.getDataValuesForOrgUnitsAndPeriods.and.returnValue(utils.getPromise(q, [aggregateDataValueA, aggregateDataValueB, aggregateDataValueC]));
                    var returnedObjects = createModuleDataBlocksFromFactory();

                    expect(ModuleDataBlock.create).toHaveBeenCalledWith(moduleOrgUnit1, '2016W01', aggregateDataValueA, {}, {});
                    expect(ModuleDataBlock.create).toHaveBeenCalledWith(moduleOrgUnit1, '2016W02', aggregateDataValueB, {}, {});
                    expect(ModuleDataBlock.create).toHaveBeenCalledWith(moduleOrgUnit2, '2016W01', {}, {}, {});
                    expect(ModuleDataBlock.create).toHaveBeenCalledWith(moduleOrgUnit2, '2016W02', aggregateDataValueC, {}, {});
                    expect(returnedObjects.length).toEqual(4);
                });
            });
        });
});