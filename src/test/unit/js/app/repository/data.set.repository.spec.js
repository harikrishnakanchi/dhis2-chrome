define(["dataSetRepository", "dataSetTransformer", "testData", "angularMocks", "utils"], function(DataSetRepository, dataSetTransformer, testData, mocks, utils) {
    describe("dataSetRepository", function() {
        var mockStore, dataSetRepository, q, scope;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();

            var mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;

            dataSetRepository = new DataSetRepository(mockDB.db, q);
        }));

        it("should transform and get all dataSets after filtering out current dataSets", function() {
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

            var actualDataSets, actualCatOptCombos;
            dataSetRepository.getAll().then(function(dataSets) {
                actualDataSets = dataSets;
            });
            scope.$apply();

            expect(actualDataSets.length).toEqual(1);
            expect(actualDataSets[0].id).toEqual("ds1");
            expect(actualDataSets[0].attributeValues).toBeUndefined();
        });

        it("should get all unique dataSets by orgUnitIds after filtering out current dataSets", function() {
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

            var actualDataSets;
            dataSetRepository.findAllForOrgUnits(["ou1", "ou2"]).then(function(dataSets) {
                actualDataSets = dataSets;
            });
            scope.$apply();

            expect(actualDataSets.length).toEqual(2);
            expect(actualDataSets[0].id).toEqual("ds1");
            expect(actualDataSets[1].id).toEqual("ds2");
            expect(actualDataSets[0].attributeValues).toBeUndefined();
            expect(actualDataSets[1].attributeValues).toBeUndefined();
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
