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

        it("should update data sets", function() {
            var datasets = [{
                "id": "DS_Physio",
                "organisationUnits": [{
                    "name": "Mod1",
                    "id": "hvybNW8qEov"
                }]
            }];

            var result = dataSetRepository.upsert(datasets);

            expect(mockStore.upsert).toHaveBeenCalledWith(datasets);
        });
    });
});