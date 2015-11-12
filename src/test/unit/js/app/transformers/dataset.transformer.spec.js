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
                "isNewDataModel": true,
                "isReferralDataset": false,
                "isPopulationDataset": false
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
                "isNewDataModel": true,
                "isReferralDataset": false,
                "isPopulationDataset": false
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
                "isNewDataModel": true,
                "isReferralDataset": false,
                "isPopulationDataset": false
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
                "isNewDataModel": false,
                "isReferralDataset": false,
                "isPopulationDataset": false
            };

            expect(currentDatasetForView).toEqual(expectedDataset);
        });

        it("should map referral locations dataset for view", function() {
            var populationDataDataset = {
                "id": "ds1",
                "name": "Referral Locations Dataset",
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
                }, {
                    "attribute": {
                        "code": "isReferralDataset"
                    },
                    "value": "true"
                }]
            };

            var populationDatasetForView = datasetTransformer.mapDatasetForView(populationDataDataset);

            var expectedDataset = {
                "id": "ds1",
                "name": "Referral Locations Dataset",
                "organisationUnits": [{
                    "id": "ou1"
                }],
                "isAggregateService": false,
                "isLineListService": false,
                "isOriginDataset": false,
                "isNewDataModel": true,
                "isReferralDataset": true,
                "isPopulationDataset": false
            };

            expect(populationDatasetForView).toEqual(expectedDataset);
        });

        it("should map population dataset for view", function() {
            var referralLocationsDataset = {
                "id": "ds1",
                "name": "Population Data Dataset",
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
                }, {
                    "attribute": {
                        "code": "isPopulationDataset"
                    },
                    "value": "true"
                }]
            };

            var referralDatasetForView = datasetTransformer.mapDatasetForView(referralLocationsDataset);

            var expectedDataset = {
                "id": "ds1",
                "name": "Population Data Dataset",
                "organisationUnits": [{
                    "id": "ou1"
                }],
                "isAggregateService": false,
                "isLineListService": false,
                "isOriginDataset": false,
                "isNewDataModel": true,
                "isReferralDataset": false,
                "isPopulationDataset": true
            };

            expect(referralDatasetForView).toEqual(expectedDataset);
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
                    "code": "DE1_code",
                    "name": "DE1 - ITFC",
                    "subSection": "Default",
                    "isIncluded": true,
                    "formName": "DE1",
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
                    "subSection": "Default",
                    "isIncluded": true,
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
                "dataElements": [{
                    "id": "DE3",
                    "code": "DE3_code",
                    "subSection": "Default",
                    "isMandatory": false,
                    "name": "DE3 - ITFC",
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
                "code": "DE1_code",
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
                "code": "DE2_code",
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
