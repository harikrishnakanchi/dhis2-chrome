define(["programRepository", "dataElementRepository", "angularMocks", "utils", "customAttributes", "timecop", "moment", "lodash"], function(ProgramRepository, DataElementRepository, mocks, utils, customAttributes, timecop, moment, _) {
    describe("programRepository", function() {
        var scope, q,
            programRepository, dataElementRepository, mockStore,
            mockProgram, mockDataElementA, someMomentInTime;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope;

            spyOn(customAttributes, 'getAttributeValue');
            spyOn(customAttributes, 'getBooleanAttributeValue').and.returnValue(true);

            var mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;

            mockStore.getAll.and.returnValue(utils.getPromise(q, []));
            mockStore.each.and.returnValue(utils.getPromise(q, []));
            mockStore.find.and.returnValue(utils.getPromise(q, undefined));

            dataElementRepository = new DataElementRepository(mockDB.db);
            spyOn(dataElementRepository, 'get');

            mockDataElementA = {
                id: 'dataElementIdA',
                name: 'mockDataElementNameA'
            };

            mockProgram = {
                id: 'someProgramId',
                name: 'mockProgramName',
                organisationUnits: [{
                    id: 'someOrgUnitId'
                }],
                programStages: [{
                    programStageSections: [{
                        programStageDataElements: [{
                            dataElement: { id: mockDataElementA.id}}]
                    }]
                }]
            };

            someMomentInTime = moment('2014-05-30T12:43:54.972Z');
            Timecop.install();
            Timecop.freeze(someMomentInTime);

            programRepository = new ProgramRepository(mockDB.db, q, dataElementRepository);
        }));

        afterEach(function() {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        describe('getProgramForOrgUnit', function () {
            beforeEach(function () {
                mockStore.find.and.returnValue(utils.getPromise(q, mockProgram));
                customAttributes.getAttributeValue.and.returnValue('someServiceCode');
            });

            it("should get Programs for OrgUnit", function() {
                programRepository.getProgramForOrgUnit('someOrgUnitId').then(function(program) {
                    expect(program.id).toEqual(mockProgram.id);
                });

                scope.$apply();
            });

            it('should parse the service code of the program', function () {
                programRepository.getProgramForOrgUnit('someOrgUnitId').then(function(program) {
                    expect(program.serviceCode).toEqual('someServiceCode');
                });

                scope.$apply();
            });

            it('should return undefined if orgUnit has no programs', function () {
                mockStore.find.and.returnValue(utils.getPromise(q, undefined));

                programRepository.getProgramForOrgUnit('someOrgUnitId').then(function(program) {
                    expect(program).toBeUndefined();
                });

                scope.$apply();
            });
        });

        describe('upsert', function () {
            it('should save programs with clientLastUpdated and orgUnitIds for indexing', function() {
                var expectedProgramForUpsert = _.merge({
                    orgUnitIds: _.map(mockProgram.organisationUnits, 'id'),
                    clientLastUpdated: someMomentInTime.toISOString()
                }, mockProgram);

                programRepository.upsert(mockProgram);
                scope.$apply();

                expect(mockStore.upsert).toHaveBeenCalledWith([expectedProgramForUpsert]);
            });
        });

        describe('get', function () {
            beforeEach(function () {
                customAttributes.getAttributeValue.and.returnValue('someServiceCode');
                mockStore.find.and.returnValue(utils.getPromise(q, mockProgram));
                dataElementRepository.get.and.returnValue(utils.getPromise(q, mockDataElementA));
            });

            it("should get program", function() {
                programRepository.get(mockProgram.id).then(function(program) {
                    var programStageDataElements = _.first(_.first(program.programStages).programStageSections).programStageDataElements;
                    expect(programStageDataElements).toEqual([{
                        dataElement: _.merge({ isIncluded: true }, mockDataElementA)
                    }]);
                });

                scope.$apply();
            });

            it('should parse the service code of the program', function () {
                var mockProgram = {
                    id: 'someProgramId'
                };

                programRepository.get(mockProgram.id).then(function (program) {
                    expect(program.serviceCode).toEqual('someServiceCode');
                });

                scope.$apply();
            });

            it("should get program with excluded data elements", function() {
                var excludedDataElementIds = ['mockExcludedDataElementId'];

                programRepository.get(mockProgram.id, excludedDataElementIds).then(function(program) {
                    var programStageDataElements = _.first(_.first(program.programStages).programStageSections).programStageDataElements;
                    expect(_.first(programStageDataElements).isIncluded).toBeFalsy();
                });

                scope.$apply();
            });
        });

        describe('getAll', function () {
            it('should parse the service code of the programs', function () {
                customAttributes.getAttributeValue.and.returnValue('someServiceCode');
                customAttributes.getBooleanAttributeValue.and.returnValue(true);

                var allPrograms = [{
                    id: 'someProgramId'
                }];
                mockStore.getAll.and.returnValue(utils.getPromise(q, allPrograms));

                programRepository.getAll().then(function(programs) {
                    expect(_.first(programs).serviceCode).toEqual('someServiceCode');
                });

                scope.$apply();
            });

            it('should filter out old data model programs', function() {
                customAttributes.getBooleanAttributeValue.and.returnValue(false);
                mockStore.getAll.and.returnValue(utils.getPromise(q, [mockProgram]));

                programRepository.getAll().then(function(programs) {
                    expect(programs).toEqual([]);
                });

                scope.$apply();
            });

        });

        describe('findAll', function () {
            beforeEach(function () {
                mockStore.each.and.returnValue(utils.getPromise(q, [mockProgram]));

                customAttributes.getAttributeValue.and.returnValue('someServiceCode');
            });

            it('should find all programs', function() {
                programRepository.findAll(['someProgramId']).then(function (programs) {
                    expect(_.map(programs, 'id')).toEqual([mockProgram.id]);
                });
                scope.$apply();
            });

            it('should parse the service code of the programs', function () {
                programRepository.findAll(['someProgramId']).then(function(programs) {
                    expect(_.first(programs).serviceCode).toEqual('someServiceCode');
                });

                scope.$apply();
            });
        });

        describe('associateOrgUnits', function () {
            it("should associate org units to programs", function() {
                var orgUnitsToAssociate = [{
                    id: 'orgUnitIdA',
                    name: 'orgUnitNameA'
                }];

                programRepository.associateOrgUnits(mockProgram, orgUnitsToAssociate).then(function (programs) {
                    expect(_.first(programs).orgUnitIds).toEqual(['someOrgUnitId', 'orgUnitIdA']);
                });
                scope.$apply();
            });
        });
    });
});