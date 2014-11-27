define(["orgUnitGroupRepository", "angularMocks", "utils"], function(OrgUnitGroupRepository, mocks, utils) {
    describe("orgunitgroup repository", function() {
        var db, mockStore, orgUnitGroupRepository;

        beforeEach(mocks.inject(function($q) {
            var mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;
            orgUnitGroupRepository = new OrgUnitGroupRepository(mockDB.db);
        }));

        it("should save get all data sets", function() {
            var allOrgunitGroups = [{
                "id": 123
            }];
            mockStore.getAll.and.returnValue(allOrgunitGroups);

            var result = orgUnitGroupRepository.getAll();

            expect(mockStore.getAll).toHaveBeenCalled();
            expect(result).toEqual(allOrgunitGroups);
        });
    });
});