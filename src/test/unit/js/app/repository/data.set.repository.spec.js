define(["dataSetRepository", "dataSetTransformer", "categoryRepository", "testData", "angularMocks", "utils"], function(DataSetRepository, dataSetTransformer, CategoryRepository, testData, mocks, utils) {
    describe("dataSetRepository", function() {
        var mockDB, mockStore, dataSetRepository, q, scope, mockDataSets, categoryRepository;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();

            mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;

            mockDataSets = [{
                id: 'dataSetIdA',
                isNewDataModel: true
            }, {
                id: 'dataSetIdB',
                isNewDataModel: false
            }];

            spyOn(dataSetTransformer, 'mapDatasetForView').and.callFake(function (dataSet) { return dataSet; });
            spyOn(dataSetTransformer, 'enrichWithCategoryOptionCombinations').and.callFake(function (dataSet) { return dataSet; });

            categoryRepository = new CategoryRepository();
            spyOn(categoryRepository, 'getAllCategoryCombos').and.returnValue(utils.getPromise(q, testData.get('categoryCombos')));
            spyOn(categoryRepository, 'getAllCategories').and.returnValue(utils.getPromise(q, testData.get('categories')));
            spyOn(categoryRepository, 'getAllCategoryOptionCombos').and.returnValue(utils.getPromise(q, testData.get('categoryOptionCombos')));

            dataSetRepository = new DataSetRepository(mockDB.db, q, categoryRepository);
        }));

        describe('getAll', function () {
            it('should transform and get all dataSets after filtering out current dataSets', function() {
                mockStore.getAll.and.returnValue(utils.getPromise(q, mockDataSets));

                dataSetRepository.getAll().then(function(dataSets) {
                    expect(_.map(dataSets, 'id')).toEqual(['dataSetIdA']);
                });
                scope.$apply();
            });
        });

        describe('findAllForOrgUnits', function () {
            it('should get all unique and newDataModel dataSets for the specified orgUnits', function() {
                var orgUnits = [{
                    id: 'someOrgUnitA',
                    dataSets: [{ id: 'dataSetIdA' }, { id: 'dataSetIdB' }]
                }, {
                    id: 'someOrgUnitB',
                    dataSets: [{ id: 'dataSetIdA' }]
                }];

                mockStore.each.and.returnValue(utils.getPromise(q, mockDataSets));

                dataSetRepository.findAllForOrgUnits(orgUnits).then(function(dataSets) {
                    expect(_.map(dataSets, 'id')).toEqual(['dataSetIdA']);
                });
                scope.$apply();
            });
        });

        it("should get dataSets with sections and dataElements", function() {
            var dataSets = [{
                "name": "OPD",
                "id": "DS_OPD",
                "organisationUnits": [{
                    "id": "mod1"
                }],
                "sections": [{
                    "id": "Sec1"
                }, {
                    "id": "Sec2"
                }]
            }];

            mockStore.each.and.callFake(function(query) {
                if (query.inList[0] === "Sec1")
                    return utils.getPromise(q, testData.get("sections"));
                if (query.inList[0] === "DE1")
                    return utils.getPromise(q, testData.get("dataElements"));
            });

            var actualDataSets;

            dataSetRepository.includeDataElements(dataSets, ["DE1"]).then(function(data) {
                actualDataSets = data;
            });

            scope.$apply();

            expect(actualDataSets.length).toBe(1);
            expect(actualDataSets[0].id).toBe("DS_OPD");
            expect(actualDataSets[0].sections.length).toBe(2);
            expect(actualDataSets[0].sections[0].id).toBe("Sec1");
            expect(actualDataSets[0].sections[0].isIncluded).toBe(true);
            expect(actualDataSets[0].sections[1].id).toBe("Sec2");
            expect(actualDataSets[0].sections[1].isIncluded).toBe(false);
            expect(actualDataSets[0].sections[0].dataElements.length).toBe(3);
            expect(actualDataSets[0].sections[0].dataElements[0].id).toBe("DE1");
            expect(actualDataSets[0].sections[0].dataElements[0].isIncluded).toBe(false);
            expect(actualDataSets[0].sections[0].dataElements[1].id).toBe("DE2");
            expect(actualDataSets[0].sections[0].dataElements[1].isIncluded).toBe(true);
            expect(actualDataSets[0].sections[0].dataElements[2].id).toBe("DE4");
            expect(actualDataSets[0].sections[0].dataElements[2].isIncluded).toBe(true);
        });

        it("should get dataSets with sections headers", function() {
            dataSetRepository.includeCategoryOptionCombinations(mockDataSets);
            scope.$apply();

            expect(dataSetTransformer.enrichWithCategoryOptionCombinations).toHaveBeenCalled();
        });

        describe('Upsert dataSets downloaded from dhis', function () {
            var mockDataSets;
            beforeEach(function () {
                  mockDataSets = [{
                    "id": "ds1",
                    "name": "NeoNat"
                }];
            });

            it("should upsert dataSets downloaded", function() {
                dataSetRepository.upsertDhisDownloadedData(mockDataSets);
                scope.$apply();

                var expectedDataSetUpsert = [{
                    "id": "ds1",
                    "name": "NeoNat"
                }];
                expect(mockStore.upsert).toHaveBeenCalledWith(expectedDataSetUpsert);
            });

            it("should upsert dataSets downloaded with given sections", function() {
                var sections = [{
                    "id": "s1",
                    "name": "section1",
                    "dataSet": {
                        "id": "ds1"
                    }
                }];

                dataSetRepository.upsertDhisDownloadedData(mockDataSets, sections);
                scope.$apply();

                var expectedDataSetUpsert = [{
                    "id": "ds1",
                    "name": "NeoNat",
                    "sections": [{
                        "id": "s1",
                        "name": "section1"
                    }]
                }];
                expect(mockStore.upsert).toHaveBeenCalledWith(expectedDataSetUpsert);
            });
        });
    });
});
