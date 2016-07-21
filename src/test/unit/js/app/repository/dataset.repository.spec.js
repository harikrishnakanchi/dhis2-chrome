define(["datasetRepository", "datasetTransformer", "testData", "angularMocks", "utils"], function(DatasetRepository, datasetTransformer, testData, mocks, utils) {
    describe("dataset repository", function() {
        var mockStore, datasetRepository, q, scope;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();

            var mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;

            datasetRepository = new DatasetRepository(mockDB.db, q);
        }));

        it("should transform and get all datasets after filtering out current datasets", function() {
            var allDataSets = [{
                "id": "ds1",
                "attributeValues": [{
                    "attribute": {
                        "code": "isNewDataModel"
                    },
                    "value": "true"
                }]
            }, {
                "id": "ds2",
                "attributeValues": [{
                    "attribute": {
                        "code": "isNewDataModel"
                    },
                    "value": "false"
                }]
            }];

            mockStore.getAll.and.returnValue(utils.getPromise(q, allDataSets));

            var actualDatasets, actualCatOptCombos;
            datasetRepository.getAll().then(function(datasets) {
                actualDatasets = datasets;
            });
            scope.$apply();

            expect(actualDatasets.length).toEqual(1);
            expect(actualDatasets[0].id).toEqual("ds1");
            expect(actualDatasets[0].attributeValues).toBeUndefined();
        });

        it("should get all unique datasets by orgUnitIds after filtering out current datasets", function() {
            var allDataSetsForOu1 = [{
                "id": "ds1",
                "organisationUnits": [{
                    "id": "ou1"
                }],
                "attributeValues": [{
                    "attribute": {
                        "code": "isNewDataModel"
                    },
                    "value": "true"
                }]
            }, {
                "id": "ds2",
                "organisationUnits": [{
                    "id": "ou1"
                }, {
                    "id": "ou2"
                }],
                "attributeValues": [{
                    "attribute": {
                        "code": "isNewDataModel"
                    },
                    "value": "true"
                }]
            }];

            var allDataSetsForOu2 = [{
                "id": "ds2",
                "organisationUnits": [{
                    "id": "ou1"
                }, {
                    "id": "ou2"
                }],
                "attributeValues": [{
                    "attribute": {
                        "code": "isNewDataModel"
                    },
                    "value": "true"
                }]
            }, {
                "id": "ds3",
                "organisationUnits": [{
                    "id": "ou2"
                }],
                "attributeValues": [{
                    "attribute": {
                        "code": "isNewDataModel"
                    },
                    "value": "false"
                }]
            }];

            mockStore.each.and.returnValue(utils.getPromise(q, allDataSetsForOu1.concat(allDataSetsForOu2)));

            var actualDatasets;
            datasetRepository.findAllForOrgUnits(["ou1", "ou2"]).then(function(datasets) {
                actualDatasets = datasets;
            });
            scope.$apply();

            expect(actualDatasets.length).toEqual(2);
            expect(actualDatasets[0].id).toEqual("ds1");
            expect(actualDatasets[1].id).toEqual("ds2");
            expect(actualDatasets[0].attributeValues).toBeUndefined();
            expect(actualDatasets[1].attributeValues).toBeUndefined();
        });

        it("should get datasets with sections and dataElements", function() {
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

            var actualDatasets;

            datasetRepository.includeDataElements(dataSets, ["DE1"]).then(function(data) {
                actualDatasets = data;
            });

            scope.$apply();

            expect(actualDatasets.length).toBe(1);
            expect(actualDatasets[0].id).toBe("DS_OPD");
            expect(actualDatasets[0].sections.length).toBe(2);
            expect(actualDatasets[0].sections[0].id).toBe("Sec1");
            expect(actualDatasets[0].sections[0].isIncluded).toBe(true);
            expect(actualDatasets[0].sections[1].id).toBe("Sec2");
            expect(actualDatasets[0].sections[1].isIncluded).toBe(false);
            expect(actualDatasets[0].sections[0].dataElements.length).toBe(3);
            expect(actualDatasets[0].sections[0].dataElements[0].id).toBe("DE1");
            expect(actualDatasets[0].sections[0].dataElements[0].isIncluded).toBe(false);
            expect(actualDatasets[0].sections[0].dataElements[1].id).toBe("DE2");
            expect(actualDatasets[0].sections[0].dataElements[1].isIncluded).toBe(true);
            expect(actualDatasets[0].sections[0].dataElements[2].id).toBe("DE4");
            expect(actualDatasets[0].sections[0].dataElements[2].isIncluded).toBe(true);
        });

        it("should get datasets with sections headers", function() {
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

            var actualDatasets;

            datasetRepository.includeCategoryOptionCombinations(dataSets).then(function(data) {
                actualDatasets = data;
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
            expect(actualDatasets[0].sections[0].headers).toEqual(expectedSectionHeaders);
            expect(actualDatasets[0].sections[0].categoryOptionComboIds).toEqual(['1', '2', '3', '4']);
            expect(actualDatasets[0].sections[0].categoryOptionComboIdsForTotals).toEqual(['2', '3', '4']);
        });

        it("should upsert datasets downloaded from dhis", function() {
            var datasets = [{
                "id": "ds1",
                "name": "NeoNat",
                "organisationUnits": [{
                    "id": "ou1",
                    "name": "ou1"
                }]
            }];
            datasetRepository.upsertDhisDownloadedData(datasets);
            scope.$apply();

            var expectedDatasetUpsert = [{
                "id": "ds1",
                "name": "NeoNat",
                "organisationUnits": [{
                    "id": "ou1",
                    "name": "ou1"
                }],
                "orgUnitIds": ["ou1"]
            }];
            expect(mockStore.upsert).toHaveBeenCalledWith(expectedDatasetUpsert);
        });

        it("should upsert datasets downloaded from dhis with given sections", function() {
            var datasets = [{
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

            datasetRepository.upsertDhisDownloadedData(datasets, sections);
            scope.$apply();

            var expectedDatasetUpsert = [{
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
            expect(mockStore.upsert).toHaveBeenCalledWith(expectedDatasetUpsert);
        });

        it("should associate org units to datasets", function() {
            var datasets = [{
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

            var expectedDatasetUpsert = [{
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

            mockStore.each.and.returnValue(utils.getPromise(q, datasets));
            datasetRepository.associateOrgUnits(["ds1"], orgunits);
            scope.$apply();

            expect(mockStore.upsert).toHaveBeenCalledWith(expectedDatasetUpsert);
        });
    });
});
