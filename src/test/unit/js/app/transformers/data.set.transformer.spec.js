define(["dataSetTransformer", "testData", "lodash"], function(datasetTransformer, testData, _) {
    describe("datasetTransformer", function() {
        describe('mapDatasetForView', function () {
            var createMockDataset = function (attributeValue) {
                return {
                    id: 'someDatasetId',
                    attributeValues: [attributeValue]
                };
            }, createMockAttribute = function (mockCode, mockValue) {
                return {
                    value: mockValue,
                    attribute: {
                        code: mockCode
                    }
                };
            };

            it("should set isAggregateService for aggregate dataset", function() {
                var linelistAttribute = createMockDataset('isLineListService', 'true');

                var aggregateDatasetForView = datasetTransformer.mapDatasetForView(createMockDataset(linelistAttribute));
                expect(aggregateDatasetForView.isAggregateService).toBeTruthy();
            });

            it("should set isLinelistService for linelist dataset", function() {
                var linelistAttribute = createMockAttribute('isLineListService', 'true');

                var linelistDatasetForView = datasetTransformer.mapDatasetForView(createMockDataset(linelistAttribute));
                expect(linelistDatasetForView.isLineListService).toBeTruthy();
            });

            it("should set isOriginDataSet on dataset", function() {
                var originAttribute = createMockAttribute('isOriginDataset', 'true');

                var originDatasetForView = datasetTransformer.mapDatasetForView(createMockDataset(originAttribute));
                expect(originDatasetForView.isOriginDataset).toBeTruthy();
            });

            it("should set isNewDataModel as false for dataset", function() {
                var newDataModelAttribute = createMockAttribute('isNewDataModel', 'false');

                var currentDatasetForView = datasetTransformer.mapDatasetForView(createMockDataset(newDataModelAttribute));
                expect(currentDatasetForView.isNewDataModel).toBeFalsy();
            });

            it("should set isReferralDataset ", function() {
                var referralAttribute = createMockAttribute('isReferralDataset', 'true');

                var referralDatasetForView = datasetTransformer.mapDatasetForView(createMockDataset(referralAttribute));
                expect(referralDatasetForView.isReferralDataset).toBeTruthy();
            });

            it("should map population dataset for view", function () {
                var populationAttribute = createMockAttribute('isPopulationDataset', 'true');

                var populationDatasetForView = datasetTransformer.mapDatasetForView(createMockDataset(populationAttribute));
                expect(populationDatasetForView.isPopulationDataset).toBeTruthy();
            });
        });

        it("should enrich datasets with sections and dataelements", function() {

            var datasets, sections, dataelements;
            var allDataSetsFromTestData = testData.get("dataSets");
            datasets = [allDataSetsFromTestData[0], allDataSetsFromTestData[1]];
            sections = testData.get("sections");
            dataelements = testData.get("dataElements");

            var expectedSectionsForOpd = [{
                "id": "Sec1",
                "name": "Section 1",
                "sortOrder": 0,
                "shouldHideTotals" : true,
                "isIncluded": true,
                "dataElements": [{
                    "id": "DE1",
                    "code": "DE1_code",
                    "name": "DE1 - ITFC",
                    "subSection": "Default",
                    "isIncluded": true,
                    "formName": "DE1",
                    "shouldHideTotals" : true,
                    "isMandatory": true,
                    "description": "some desc1",
                    "categoryCombo": {
                        "id": "CC1",
                        "name": "CatCombo1"
                    }
                }, {
                    "id": "DE2",
                    "code": "DE2_code",
                    "name": "DE2 - ITFC",
                    "isIncluded": true,
                    "subSection": "Default",
                    "formName": "DE2",
                    "isMandatory": false,
                    "shouldHideTotals" : false,
                    "description": "some desc2",
                    "categoryCombo": {
                        "id": "CC2",
                        "name": "CatCombo2"
                    }
                }, {
                    "id": "DE4",
                    "code": "DE4_code",
                    "name": "DE4 - ITFC",
                    "isIncluded": true,
                    "subSection": "Default",
                    "isMandatory": false,
                    "shouldHideTotals" : false,
                    "formName": "DE4",
                    "categoryCombo": {
                        "id": "CC2",
                        "name": "CatCombo2"
                    }
                }]
            }, {
                "id": "Sec2",
                "name": "Section 2",
                "sortOrder": 1,
                "isIncluded": true,
                "shouldHideTotals" : true,
                "dataElements": [{
                    "id": "DE1",
                    "code": "DE1_code",
                    "name": "DE1 - ITFC",
                    "subSection": "Default",
                    "isIncluded": true,
                    "shouldHideTotals" : true,
                    "isMandatory": true,
                    "formName": "DE1",
                    "description": "some desc1",
                    "categoryCombo": {
                        "id": "CC1",
                        "name": "CatCombo1"
                    }
                }]
            }];

            var expectedSectionsForVacc = [{
                "id": "Sec3",
                "name": "Section 3",
                "sortOrder": 0,
                "isIncluded": false,
                "shouldHideTotals" : false,
                "dataElements": [{
                    "id": "DE3",
                    "code": "DE3_code",
                    "subSection": "Default",
                    "isMandatory": false,
                    "name": "DE3 - ITFC",
                    "shouldHideTotals" : false,
                    "isIncluded": false,
                    "formName": "DE3",
                    "description": "some desc3",
                    "categoryCombo": {
                        "id": "CC2",
                        "name": "CatCombo2"
                    }
                }]
            }];

            var actualEnrichedDatasets = datasetTransformer.enrichWithSectionsAndDataElements(datasets, sections, dataelements, ['DE3']);
            expect(actualEnrichedDatasets.length).toBe(2);
            expect(actualEnrichedDatasets[0].sections.length).toBe(2);
            expect(actualEnrichedDatasets[0].sections).toContain(expectedSectionsForOpd[0]);
            expect(actualEnrichedDatasets[0].sections).toContain(expectedSectionsForOpd[1]);
            expect(actualEnrichedDatasets[1].sections.length).toBe(1);
            expect(actualEnrichedDatasets[1].sections).toContain(expectedSectionsForVacc[0]);
        });

        it("should set associated program ids on data elements where available", function() {
            var originDataset = {
                "id": "ds1",
                "attributeValues": [{
                    "attribute": {
                        "code": "isOriginDataset"
                    },
                    "value": "true"
                }],
                "sections": [{
                    "id": "Sec1"
                }]
            };

            var sections = [{
                "id": "Sec1",
                "dataElements": [{
                    "id": "DE1"
                }, {"id": "DE2"
                }]
            }];

            var dataElements = [{
                "id": "DE1",
                "attributeValues": [{
                    "attribute": {
                        "code": "associatedProgram"
                    },
                    "value": ""
                }]
            }, {
                "id": "DE2",
                "attributeValues": [{
                    "attribute": {
                        "code": "associatedProgram"
                    },
                    "value": "a0a11378e0e"
                }]
            }];


            var actualEnrichedDatasets = datasetTransformer.enrichWithSectionsAndDataElements([originDataset], sections, dataElements);

            expect(actualEnrichedDatasets[0].sections[0].dataElements[0].associatedProgramId).toBeUndefined();
            expect(actualEnrichedDatasets[0].sections[0].dataElements[1].associatedProgramId).toEqual("a0a11378e0e");
        });

        it("should enrich datasets with category option combinations", function() {
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

            var allCategoryCombos = testData.get("categoryCombos");
            var allCategories = testData.get("categories");
            var allCategoryOptionCombos = testData.get("categoryOptionCombos");
            var enrichedDatasets = datasetTransformer.enrichWithCategoryOptionCombinations(dataSets, allCategoryCombos, allCategories, allCategoryOptionCombos);

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
            expect(enrichedDatasets[0].sections[0].headers).toEqual(expectedSectionHeaders);
            expect(enrichedDatasets[0].sections[0].categoryOptionComboIds).toEqual(['1', '2', '3', '4']);
        });

        it("should enrich data elements with the dataElement Group", function() {

            var datasets, sections, dataelements;
            var allDataSetsFromTestData = testData.get("dataSets");
            datasets = [allDataSetsFromTestData[0], allDataSetsFromTestData[1]];
            sections = testData.get("sections");
            dataelements = testData.get("dataElements");
            var dataElementGroups = [{
                'name': 'Group 1 module_creation',
                'dataElements': [{
                    'id': "DE1"
                }]
            }];
            var expectedSectionsForOpd = [{
                "id": "Sec1",
                "name": "Section 1",
                "sortOrder": 0,
                "isIncluded": true,
                "dataElements": [{
                    "id": "DE1",
                    "code": "DE1_code",
                    "name": "DE1 - ITFC",
                    "isIncluded": true,
                    "formName": "DE1",
                    "categoryCombo": {
                        "id": "CC1",
                        "name": "CatCombo1"
                    }
                }, {
                    "id": "DE2",
                    "code": "DE2_code",
                    "name": "DE2 - ITFC",
                    "isIncluded": true,
                    "formName": "DE2",
                    "categoryCombo": {
                        "id": "CC2",
                        "name": "CatCombo2"
                    }
                }, {
                    "id": "DE4",
                    "code": "DE4_code",
                    "name": "DE4 - ITFC",
                    "isIncluded": true,
                    "formName": "DE4",
                    "categoryCombo": {
                        "id": "CC2",
                        "name": "CatCombo2"
                    }
                }]
            }, {
                "id": "Sec2",
                "name": "Section 2",
                "sortOrder": 1,
                "isIncluded": true,
                "dataElements": [{
                    "id": "DE1",
                    "code": "DE1_code",
                    "name": "DE1 - ITFC",
                    "isIncluded": true,
                    "formName": "DE1",
                    "categoryCombo": {
                        "id": "CC1",
                        "name": "CatCombo1"
                    }
                }]
            }];

            var expectedSectionsForVacc = [{
                "id": "Sec3",
                "name": "Section 3",
                "sortOrder": 0,
                "isIncluded": false,
                "dataElements": [{
                    "id": "DE3",
                    "code": "DE3_code",
                    "name": "DE3 - ITFC",
                    "isIncluded": false,
                    "formName": "DE3",
                    "categoryCombo": {
                        "id": "CC2",
                        "name": "CatCombo2"
                    }
                }]
            }];

            var actualEnrichedDatasets = datasetTransformer.enrichWithSectionsAndDataElements(datasets, sections, dataelements, ['DE3'], dataElementGroups);
            expect(actualEnrichedDatasets.length).toBe(2);
            expect(actualEnrichedDatasets[0].sections[0].dataElements[0].subSection).toBe('Group 1');
            expect(actualEnrichedDatasets[0].sections[0].dataElements[1].subSection).toBe('Default');

        });
    });
});
