define(['moduleDataBlockFactory', 'orgUnitRepository', 'dataRepository', 'programEventRepository', 'approvalDataRepository', 'moduleDataBlock', 'utils', 'angularMocks'],
    function (ModuleDataBlockFactory, OrgUnitRepository, DataRepository, ProgramEventRepository, ApprovalDataRepository, ModuleDataBlock, utils, mocks) {
        var q, scope, moduleDataBlockFactory, orgUnitRepository, dataRepository, programEventRepository, approvalDataRepository;
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

                    programEventRepository = new ProgramEventRepository();
                    spyOn(programEventRepository, 'getEventsFromPeriod').and.returnValue(utils.getPromise(q, {}));

                    spyOn(ModuleDataBlock, 'create').and.returnValue('mockModuleDataBlock');

                    approvalDataRepository = new ApprovalDataRepository();
                    spyOn(approvalDataRepository, 'getApprovalDataForPeriodsOrgUnits').and.returnValue(utils.getPromise(q, {}));

                    projectId = 'myProjectId';
                    defaultPeriodForTesting = '2016W20';
                    periodRange = [defaultPeriodForTesting];

                    moduleDataBlockFactory = new ModuleDataBlockFactory(q, orgUnitRepository, dataRepository, programEventRepository, approvalDataRepository);
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

                    expect(dataRepository.getDataValuesForOrgUnitsAndPeriods).toHaveBeenCalledWith(['ou1'], [defaultPeriodForTesting]);
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

                it('should create module data block with line list events for origins', function() {
                    var lineListEvents = [{
                        someEventInfo: 'someEventDetails',
                        orgUnit: 'origin1',
                        period: '2016W20'
                    }];
                    programEventRepository.getEventsFromPeriod.and.returnValue(utils.getPromise(q, lineListEvents));

                    var moduleOrgUnit = { id: 'ou1' };
                    orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, [moduleOrgUnit]));

                    var originOrgUnit = { id: 'origin1', parent: moduleOrgUnit };
                    orgUnitRepository.findAllByParent.and.returnValue(utils.getPromise(q, [originOrgUnit]));

                    var returnedObjects = createModuleDataBlocksFromFactory();

                    expect(orgUnitRepository.findAllByParent).toHaveBeenCalledWith(['ou1']);
                    expect(programEventRepository.getEventsFromPeriod).toHaveBeenCalledWith(defaultPeriodForTesting, ['origin1']);
                    expect(ModuleDataBlock.create).toHaveBeenCalledWith(moduleOrgUnit, defaultPeriodForTesting, {}, lineListEvents, {});
                    expect(returnedObjects.length).toEqual(1);
                });

                it('should create module data blocks with line list events for multiple periods', function() {
                    var lineListEventA = {
                        someEventInfo: 'someEventDetails',
                        orgUnit: 'origin1',
                        period: '2016W01'
                    }, lineListEventB = {
                        someEventInfo: 'someEventDetails',
                        orgUnit: 'origin1',
                        period: '2016W02'
                    }, lineListEventC = {
                        someEventInfo: 'someEventDetails',
                        orgUnit: 'origin2',
                        period: '2016W01'
                    };
                    programEventRepository.getEventsFromPeriod.and.returnValue(utils.getPromise(q, [lineListEventA, lineListEventB, lineListEventC]));

                    periodRange = ['2016W01', '2016W02'];

                    var moduleOrgUnit1 = { id: 'ou1' };
                    var moduleOrgUnit2 = { id: 'ou2' };
                    orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, [moduleOrgUnit1, moduleOrgUnit2]));

                    var originOrgUnitA = { id: 'origin1', parent: moduleOrgUnit1 };
                    var originOrgUnitB = { id: 'origin2', parent: moduleOrgUnit2 };
                    orgUnitRepository.findAllByParent.and.returnValue(utils.getPromise(q, [originOrgUnitA, originOrgUnitB]));

                    var returnedObjects = createModuleDataBlocksFromFactory();

                    expect(ModuleDataBlock.create).toHaveBeenCalledWith(moduleOrgUnit1, '2016W01', {}, [lineListEventA], {});
                    expect(ModuleDataBlock.create).toHaveBeenCalledWith(moduleOrgUnit1, '2016W02', {}, [lineListEventB], {});
                    expect(ModuleDataBlock.create).toHaveBeenCalledWith(moduleOrgUnit2, '2016W01', {}, [lineListEventC], {});
                    expect(ModuleDataBlock.create).toHaveBeenCalledWith(moduleOrgUnit2, '2016W02', {}, {}, {});
                    expect(returnedObjects.length).toEqual(4);
                });

                it('should create module data block with approval data', function() {
                    var approvalData = [{
                        someApprovalInfo: 'someApprovalDetails',
                        orgUnit: 'ou1',
                        period: '2016W20'
                    }];
                    approvalDataRepository.getApprovalDataForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, approvalData));

                    var moduleOrgUnit = { id: 'ou1' };
                    orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, [moduleOrgUnit]));

                    var returnedObjects = createModuleDataBlocksFromFactory();

                    expect(approvalDataRepository.getApprovalDataForPeriodsOrgUnits).toHaveBeenCalledWith(defaultPeriodForTesting, defaultPeriodForTesting, ['ou1']);
                    expect(ModuleDataBlock.create).toHaveBeenCalledWith(moduleOrgUnit, defaultPeriodForTesting, {}, {}, approvalData[0]);
                    expect(returnedObjects.length).toEqual(1);
                });

                it('should create module data block with approval data for multiple periods', function() {
                    var approvalDataA = {
                        someApprovalInfo: 'someApprovalDetails',
                        orgUnit: 'ou1',
                        period: '2016W01'
                    }, approvalDataB = {
                        someApprovalInfo: 'someApprovalDetails',
                        orgUnit: 'ou2',
                        period: '2016W01'
                    }, approvalDataC = {
                        someApprovalInfo: 'someApprovalDetails',
                        orgUnit: 'ou2',
                        period: '2016W02'
                    };
                    approvalDataRepository.getApprovalDataForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, [approvalDataA, approvalDataB, approvalDataC]));

                    periodRange = ['2016W01', '2016W02'];

                    var moduleOrgUnit1 = { id: 'ou1' };
                    var moduleOrgUnit2 = { id: 'ou2' };
                    orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, [moduleOrgUnit1, moduleOrgUnit2]));

                    var returnedObjects = createModuleDataBlocksFromFactory();

                    expect(approvalDataRepository.getApprovalDataForPeriodsOrgUnits).toHaveBeenCalledWith(periodRange[0], periodRange[1], ['ou1', 'ou2']);
                    expect(ModuleDataBlock.create).toHaveBeenCalledWith(moduleOrgUnit1, '2016W01', {}, {}, approvalDataA);
                    expect(ModuleDataBlock.create).toHaveBeenCalledWith(moduleOrgUnit1, '2016W02', {}, {}, {});
                    expect(ModuleDataBlock.create).toHaveBeenCalledWith(moduleOrgUnit2, '2016W01', {}, {}, approvalDataB);
                    expect(ModuleDataBlock.create).toHaveBeenCalledWith(moduleOrgUnit2, '2016W02', {}, {}, approvalDataC);
                    expect(returnedObjects.length).toEqual(4);
                });
            });
        });
});