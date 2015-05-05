define(["orgUnitGroupSetRepository", "angularMocks", "utils"], function(OrgUnitGroupSetRepository, mocks, utils) {
    describe("orgunitgroup repository", function() {
        var db, mockStore, scope, orgUnitGroupSetRepository;

        beforeEach(mocks.inject(function($q, $rootScope) {
            scope = $rootScope.$new();
            var mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;
            orgUnitGroupSetRepository = new OrgUnitGroupSetRepository(mockDB.db);
        }));

        it("should get all org unit group sets", function() {
            var allOrgunitGroupSets = [{
                "id": 123
            }];
            mockStore.getAll.and.returnValue(allOrgunitGroupSets);

            var result = orgUnitGroupSetRepository.getAll();

            expect(mockStore.getAll).toHaveBeenCalled();
            expect(result).toEqual(allOrgunitGroupSets);
        });
    });
});
