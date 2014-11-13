define(["programRepository", "angularMocks", "utils"], function(ProgramRepository, mocks, utils) {
    describe("programRepository", function() {
        var scope, q, programRepository;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope;

            var mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;
            programRepository = new ProgramRepository(mockDB.db);
        }));

        it("should get Programs for OrgUnit", function() {
            var programDataForOrgUnit = [{
                'id': 'p1'
            }];
            mockStore.each.and.returnValue(utils.getPromise(q, programDataForOrgUnit));

            var actualValues;
            programRepository.getProgramsForOrgUnit("ou1").then(function(programData) {
                actualValues = programData;
            });

            scope.$apply();

            expect(actualValues).toEqual(programDataForOrgUnit);
        });

        it("should get program", function() {
            var programId = "program1";
            programRepository.getProgram(programId);
            scope.$apply();

            expect(mockStore.find).toHaveBeenCalledWith(programId);
        });

        it("should save org hierarchy", function() {
            var program = [{
                "id": "prg1",
                "name": "program1",
                "organisationUnits": [{
                    "id": "orgUnit1",
                    "name": "orgUnit1"
                }]
            }];

            programRepository.upsert(program).then(function(data) {
                expect(data).toEqual(program);
            });
            expect(mockStore.upsert).toHaveBeenCalledWith(program);
        });
    });
});