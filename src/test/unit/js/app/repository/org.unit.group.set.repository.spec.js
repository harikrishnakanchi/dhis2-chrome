define(["orgUnitGroupSetRepository", "angularMocks", "utils"], function(OrgUnitGroupSetRepository, mocks, utils) {
    describe("orgunitgroup repository", function() {
        var mockStore, scope, orgUnitGroupSetRepository;

        beforeEach(mocks.inject(function($q, $rootScope) {
            scope = $rootScope.$new();
            var mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;
            orgUnitGroupSetRepository = new OrgUnitGroupSetRepository(mockDB.db, $q);
        }));

        it("should get all org unit group sets", function() {
            var allOrgunitGroupSets = [{
                id: 123,
                organisationUnitGroups: [{ id: 'oug1' }]
            }];
            
            var allOrgunitGroups = [{ id: 'oug1', name: 'orgUnitGroup 1' }];

            mockStore.getAll.and.returnValues(allOrgunitGroupSets, allOrgunitGroups);

            var expectedResult = [{
                id: 123,
                organisationUnitGroups: [allOrgunitGroups[0]]
            }];

            orgUnitGroupSetRepository.getAll().then(function (result) {
                expect(mockStore.getAll).toHaveBeenCalled();
                expect(expectedResult).toEqual(result);
            });

            scope.$apply();
        });
    });
});
