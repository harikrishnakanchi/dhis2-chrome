define(["dataSetRepository", "dataSetTransformer", "testData", "angularMocks", "utils"], function(DataSetRepository, dataSetTransformer, testData, mocks, utils) {
    describe("dataSetRepository", function() {
        var mockDB, mockStore, dataSetRepository, q, scope, mockDataSets;

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

            dataSetRepository = new DataSetRepository(mockDB.db, q);
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
            var dataSets = [{
                "id": "DS_OPD",
                "sections": [{
                    "id": "Sec1",
                    "dataElements": [{
                        "id": "DE1",
                        "categoryCombo": {
                            "id": "CC1"
                        }
                    }]
                }]
            }];

            mockStore.getAll.and.callFake(function(query) {
                if (mockStore.storeName === "categoryCombos")
                    return utils.getPromise(q, testData.get("categoryCombos"));
                if (mockStore.storeName === "categories")
                    return utils.getPromise(q, testData.get("categories"));
                if (mockStore.storeName === "categoryOptionCombos")
                    return utils.getPromise(q, testData.get("categoryOptionCombos"));
            });

            var actualDataSets;

            dataSetRepository.includeCategoryOptionCombinations(dataSets).then(function(data) {
                actualDataSets = data;
            });

            scope.$apply();

            var expectedSectionHeaders = [
                [{
                    "id": "CO1",
                    "name": "Resident"
                }, {
                    "id": "CO2",
                    "name": "Migrant"
                }],
                [{
                    "id": "CO3",
                    "name": "LessThan5"
                }, {
                    "id": "CO4",
                    "name": "GreaterThan5"
                }, {
                    "id": "CO3",
                    "name": "LessThan5"
                }, {
                    "id": "CO4",
                    "name": "GreaterThan5"
                }]
            ];
            expect(actualDataSets[0].sections[0].headers).toEqual(expectedSectionHeaders);
            expect(actualDataSets[0].sections[0].categoryOptionComboIds).toEqual(['1', '2', '3', '4']);
            expect(actualDataSets[0].sections[0].categoryOptionComboIdsForTotals).toEqual(['2', '3', '4']);
        });

        it("should upsert dataSets downloaded from dhis", function() {
            var dataSets = [{
                "id": "ds1",
                "name": "NeoNat",
                "organisationUnits": [{
                    "id": "ou1",
                    "name": "ou1"
                }]
            }];
            dataSetRepository.upsertDhisDownloadedData(dataSets);
            scope.$apply();

            var expectedDataSetUpsert = [{
                "id": "ds1",
                "name": "NeoNat",
                "organisationUnits": [{
                    "id": "ou1",
                    "name": "ou1"
                }],
                "orgUnitIds": ["ou1"]
            }];
            expect(mockStore.upsert).toHaveBeenCalledWith(expectedDataSetUpsert);
        });

        it("should upsert dataSets downloaded from dhis with given sections", function() {
            var dataSets = [{
                "id": "ds1",
                "name": "NeoNat",
                "organisationUnits": [{
                    "id": "ou1",
                    "name": "ou1"
                }]
            }];

            var sections = [{
                "id": "s1",
                "name": "section1",
                "dataSet": {
                    "id": "ds1"
                }
            }];

            dataSetRepository.upsertDhisDownloadedData(dataSets, sections);
            scope.$apply();

            var expectedDataSetUpsert = [{
                "id": "ds1",
                "name": "NeoNat",
                "organisationUnits": [{
                    "id": "ou1",
                    "name": "ou1"
                }],
                "sections": [{
                    "id": "s1",
                    "name": "section1"
                }],
                "orgUnitIds": ["ou1"]
            }];
            expect(mockStore.upsert).toHaveBeenCalledWith(expectedDataSetUpsert);
        });

        it("should associate org units to dataSets", function() {
            var dataSets = [{
                "id": "ds1",
                "name": "NeoNat",
                "organisationUnits": [{
                    "id": "ou1",
                    "name": "ou1"
                }]
            }];

            var orgunits = [{
                "id": "ou1",
                "name": "ou1"
            }, {
                "id": "ou2",
                "name": "ou2"
            }];

            var expectedDataSetUpsert = [{
                "id": "ds1",
                "name": "NeoNat",
                "organisationUnits": [{
                    "id": "ou1",
                    "name": "ou1"
                }, {
                    "id": "ou2",
                    "name": "ou2"
                }],
                "orgUnitIds": ["ou1", "ou2"]
            }];

            mockStore.each.and.returnValue(utils.getPromise(q, dataSets));
            dataSetRepository.associateOrgUnits(["ds1"], orgunits);
            scope.$apply();

            expect(mockStore.upsert).toHaveBeenCalledWith(expectedDataSetUpsert);
        });

        it("should remove org units from dataSets", function () {
            var dataSets = [{
                "id": "ds1",
                "name": "NeoNat",
                "organisationUnits": [{
                    "id": "ou1",
                    "name": "ou1"
                }, {
                    "id": "ou2",
                    "name": "ou2"
                }]
            }];

            var orgunits = [{
                "id": "ou1",
                "name": "ou1"
            }];

            var expectedDataSetUpsert = [{
                "id": "ds1",
                "name": "NeoNat",
                "organisationUnits": [{
                    "id": "ou2",
                    "name": "ou2"
                }],
                "orgUnitIds": ["ou2"]
            }];

            mockStore.each.and.returnValue(utils.getPromise(q, dataSets));
            dataSetRepository.removeOrgUnits(["ds1"], ["ou1"]);
            scope.$apply();

            expect(mockStore.upsert).toHaveBeenCalledWith(expectedDataSetUpsert);
        });
    });
});
