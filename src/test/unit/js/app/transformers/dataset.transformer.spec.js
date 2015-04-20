define(["datasetTransformer", "testData", "lodash"], function(datasetTransformer, testData, _) {
    describe("datasetTransformer", function() {

        it("should map aggregate dataset for view", function() {
            var aggregateDataset = {
                "id": "ds1",
                "name": "Aggregate Dataset",
                "organisationUnits": [{
                    "id": "ou1"
                }],
                "attributeValues": [{
                    "attribute": {
                        "code": "isNewDataModel"
                    },
                    "value": "true"
                }, {
                    "attribute": {
                        "code": "isOriginDataset"
                    },
                    "value": "false"
                }, {
                    "attribute": {
                        "code": "isLineListService"
                    },
                    "value": "false"
                }]
            };

            var aggregateDatasetForView = datasetTransformer.mapDatasetForView(aggregateDataset);

            var expectedDataset = {
                "id": "ds1",
                "name": "Aggregate Dataset",
                "organisationUnits": [{
                    "id": "ou1"
                }],
                "isAggregateService": true,
                "isLineListService": false,
                "isOriginDataset": false,
                "isNewDataModel": true
            };

            expect(aggregateDatasetForView).toEqual(expectedDataset);
        });

        it("should map linelist dataset for view", function() {
            var linelistDataset = {
                "id": "ds1",
                "name": "Line List Dataset",
                "organisationUnits": [{
                    "id": "ou1"
                }],
                "attributeValues": [{
                    "attribute": {
                        "code": "isNewDataModel"
                    },
                    "value": "true"
                }, {
                    "attribute": {
                        "code": "isOriginDataset"
                    },
                    "value": "false"
                }, {
                    "attribute": {
                        "code": "isLineListService"
                    },
                    "value": "true"
                }]
            };

            var linelistDatasetForView = datasetTransformer.mapDatasetForView(linelistDataset);

            var expectedDataset = {
                "id": "ds1",
                "name": "Line List Dataset",
                "organisationUnits": [{
                    "id": "ou1"
                }],
                "isAggregateService": false,
                "isLineListService": true,
                "isOriginDataset": false,
                "isNewDataModel": true
            };

            expect(linelistDatasetForView).toEqual(expectedDataset);
        });

        it("should map origin dataset for view", function() {
            var originDataset = {
                "id": "ds1",
                "name": "Origin Dataset",
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
                }, {
                    "attribute": {
                        "code": "isOriginDataset"
                    },
                    "value": "true"
                }, {
                    "attribute": {
                        "code": "isLineListService"
                    },
                    "value": "false"
                }]
            };

            var originDatasetForView = datasetTransformer.mapDatasetForView(originDataset);

            var expectedDataset = {
                "id": "ds1",
                "name": "Origin Dataset",
                "organisationUnits": [{
                    "id": "ou1"
                }, {
                    "id": "ou2"
                }],
                "isAggregateService": false,
                "isLineListService": false,
                "isOriginDataset": true,
                "isNewDataModel": true
            };

            expect(originDatasetForView).toEqual(expectedDataset);
        });

        it("should map current dataset for view", function() {

            var currentDataset = {
                "id": "ds1",
                "name": "V1 Dataset",
                "organisationUnits": [{
                    "id": "ou1"
                }],
                "attributeValues": [{
                    "attribute": {
                        "code": "isNewDataModel"
                    },
                    "value": "false"
                }, {
                    "attribute": {
                        "code": "isOriginDataset"
                    },
                    "value": "false"
                }, {
                    "attribute": {
                        "code": "isLineListService"
                    },
                    "value": "false"
                }]
            };

            var currentDatasetForView = datasetTransformer.mapDatasetForView(currentDataset);

            var expectedDataset = {
                "id": "ds1",
                "name": "V1 Dataset",
                "organisationUnits": [{
                    "id": "ou1"
                }],
                "isAggregateService": true,
                "isLineListService": false,
                "isOriginDataset": false,
                "isNewDataModel": false
            };

            expect(currentDatasetForView).toEqual(expectedDataset);
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
                "isIncluded": true,
                "dataElements": [{
                    "id": "DE1",
                    "name": "DE1 - ITFC",
                    "isIncluded": true,
                    "formName": "DE1",
                    "categoryCombo": {
                        "id": "CC1",
                        "name": "CatCombo1"
                    }
                }, {
                    "id": "DE2",
                    "name": "DE2 - ITFC",
                    "isIncluded": true,
                    "formName": "DE2",
                    "categoryCombo": {
                        "id": "CC2",
                        "name": "CatCombo2"
                    }
                }, {
                    "id": "DE4",
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
                    "name": "DE3 - ITFC",
                    "isIncluded": false,
                    "formName": "DE3",
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
                "name": "Origin Dataset",
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
                }, {
                    "attribute": {
                        "code": "isOriginDataset"
                    },
                    "value": "true"
                }, {
                    "attribute": {
                        "code": "isLineListService"
                    },
                    "value": "false"
                }],
                "sections": [{
                    "id": "Sec1"
                }]
            };

            var sections = [{
                "id": "Sec1",
                "name": "Origin",
                "sortOrder": 0,
                "dataSet": _.pick(originDataset, ['name', 'id']),
                "dataElements": [{
                    "id": "DE1",
                    "name": "Number of Patients - Origin - Origin Dataset"
                }, {
                    "id": "DE2",
                    "name": "Number of Patients (Burn Unit) - Origin - Origin Dataset"
                }]
            }];

            var dataElements = [{
                "id": "DE1",
                "name": "Number of Patients - Origin - Origin Dataset",
                "shortName": "NumPatients",
                "formName": "Number of Patients",
                "categoryCombo": {
                    "id": "default"
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "associatedProgram",
                        "id": "uDpmgVfegeR",
                        "name": "Associated Program"
                    },
                    "value": ""
                }]
            }, {
                "id": "DE2",
                "name": "Number of Patients (Burn Unit) - Origin - Origin Dataset",
                "shortName": "NumPatients",
                "formName": "Number of Patients (Burn Unit)",
                "categoryCombo": {
                    "id": "default"
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "associatedProgram",
                        "id": "uDpmgVfegeR",
                        "name": "Associated Program"
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

    });
});
