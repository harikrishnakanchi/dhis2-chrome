define(["dataElementRepository", "angularMocks", "utils"], function(DataElementRepository, mocks, utils) {
    describe("data element repository", function() {
        var db, mockStore, dataElementRepository;
        beforeEach(mocks.inject(function($q, $rootScope) {
            var mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;
            dataElementRepository = new DataElementRepository(mockDB.db);
        }));

        it("should get all data elements", function() {
            dataElementRepository.getAll();
            
            expect(mockStore.getAll).toHaveBeenCalled();
        });

       
    });
});