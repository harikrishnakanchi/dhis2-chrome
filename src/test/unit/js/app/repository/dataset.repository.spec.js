define(["datasetRepository", "angularMocks", "utils"], function(DatasetRepository, mocks, utils) {
    describe("dataset repository", function() {
        var db, mockStore, datasetRepository, q, scope;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            var mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;
            scope = $rootScope.$new();

            datasetRepository = new DatasetRepository(mockDB.db);
        }));

        it("should get all data sets", function() {
            var allDataSets = [{
                "id": 123
            }];
            mockStore.getAll.and.returnValue(allDataSets);

            var result = datasetRepository.getAll();

            expect(mockStore.getAll).toHaveBeenCalled();
            expect(result).toEqual(allDataSets);
        });

        it("should get datasets for OrgUnit", function() {
            var expectedDatasets = [{
                'id': 'ds1'
            }];
            mockStore.each.and.returnValue(utils.getPromise(q, expectedDatasets));

            var actualValues;
            datasetRepository.getAllForOrgUnit("ou1").then(function(data) {
                actualValues = data;
            });

            scope.$apply();

            expect(actualValues).toEqual(expectedDatasets);
        });


        it("should update data sets", function() {
            var datasets = [{
                "id": "DS_Physio",
                "organisationUnits": [{
                    "name": "Mod1",
                    "id": "hvybNW8qEov"
                }]
            }];

            var result = datasetRepository.upsert(datasets);

            var expectedDatasets = [{
                "id": "DS_Physio",
                "organisationUnits": [{
                    "name": "Mod1",
                    "id": "hvybNW8qEov"
                }],
                "orgUnitIds": ["hvybNW8qEov"]
            }];

            expect(mockStore.upsert).toHaveBeenCalledWith(expectedDatasets);
        });

        it("should get dataset specified by id", function() {
            var result;

            var dataset = {
                'id': 'ds1'
            };

            mockStore.find.and.returnValue(utils.getPromise(q, dataset));

            datasetRepository.get('ds1').then(function(data) {
                result = data;
            });
            scope.$apply();

            expect(mockStore.find).toHaveBeenCalledWith('ds1');
            expect(result).toEqual(dataset);
        });

        it("should get all the dataset ids", function() {
            var result;

            var allDataSets = [{
                "id": 123
            }];
            mockStore.getAll.and.returnValue(utils.getPromise(q, allDataSets));

            datasetRepository.getAllDatasetIds().then(function(data) {
                result = data;
            });
            scope.$apply();

            expect(mockStore.getAll).toHaveBeenCalled();
            expect(result).toEqual([123]);
        });
    });
});
