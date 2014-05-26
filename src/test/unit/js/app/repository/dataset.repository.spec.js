define(["dataSetRepository", "angularMocks", "utils"], function(DataSetRepository, mocks, utils) {
    describe("dataset repository", function() {
        var db, mockStore, dataSetRepository;

        beforeEach(mocks.inject(function($q) {
            var mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;
            dataSetRepository = new DataSetRepository(mockDB.db);
        }));

        it("should save get all data sets", function() {
            var allDataSets = [{
                "id": 123
            }];
            mockStore.getAll.and.returnValue(allDataSets);

            var result = dataSetRepository.getAll();

            expect(mockStore.getAll).toHaveBeenCalled();
            expect(result).toEqual(allDataSets);
        });
    });
});