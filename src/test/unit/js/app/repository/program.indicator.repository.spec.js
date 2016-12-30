define(['angularMocks', 'utils', 'programIndicatorRepository'], function (mocks, utils, ProgramIndicatorRepository) {
    var programIndicatorRepository, objectStore, mockDB, q, scope;
    describe('ProgramIndicatorRepository', function () {
        beforeEach(mocks.inject(function ($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();
            mockDB = utils.getMockDB(q);
            objectStore = mockDB.objectStore;
            programIndicatorRepository = new ProgramIndicatorRepository(mockDB.db, q);
        }));

        it('should getAll the programIndicators', function () {
            programIndicatorRepository.getAll();
            expect(objectStore.getAll).toHaveBeenCalled();
        });

        it('should enrich programIndicators from store', function () {
            var programIndicator = { id: 'someProgramIndicatorId' };

            var programIndicatorsFromDB = [{
                id: 'someProgramIndicatorId',
                shortName: 'shortName',
                name: 'someName',
                description: 'someDescription',
                someOtherField : 'someFieldValue'
            }];

            spyOn(programIndicatorRepository, 'getAll').and.returnValue(utils.getPromise(q, programIndicatorsFromDB));
            var expectedProgramIndicator = {
                id: 'someProgramIndicatorId',
                shortName: 'shortName',
                name: 'someName',
                description: 'someDescription'
            };

            programIndicatorRepository.enrichWithProgramIndicatorDetails([programIndicator]).then(function () {
                expect(programIndicator).toEqual(expectedProgramIndicator);
            });
            scope.$apply();
        });
    });
});