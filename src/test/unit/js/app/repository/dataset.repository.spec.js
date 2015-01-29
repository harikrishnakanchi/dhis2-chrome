define(["dataSetRepository", "angularMocks", "utils"], function(DataSetRepository, mocks, utils) {
    describe("dataset repository", function() {
        var db, mockStore, dataSetRepository, q, scope;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            var mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;
            scope = $rootScope.$new();

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

        it("should get all the dataset ids", function() {

            var allDataSets = [{
                "id": 123
            }];
            mockStore.getAll.and.returnValue(utils.getPromise(q, allDataSets));

            dataSetRepository.getAllDatasetIds().then(function(data) {
                result = data;
            });
            scope.$apply();

            expect(mockStore.getAll).toHaveBeenCalled();
            expect(result).toEqual([123]);
        });
    });
});