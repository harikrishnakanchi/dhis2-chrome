define(["datasetTransformer", "testData", "lodash"], function(datasetTransformer, testData, _) {
    xdescribe("datasetTransformer", function() {
        it("should enrich datasets", function() {

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

            var actualEnrichedDatasets = datasetTransformer.enrichDatasets(datasets, sections, dataelements, ['DE3']);
            expect(actualEnrichedDatasets.length).toBe(2);
            expect(actualEnrichedDatasets[0].sections.length).toBe(2);
            expect(actualEnrichedDatasets[0].sections).toContain(expectedSectionsForOpd[0]);
            expect(actualEnrichedDatasets[0].sections).toContain(expectedSectionsForOpd[1]);
            expect(actualEnrichedDatasets[1].sections.length).toBe(1);
            expect(actualEnrichedDatasets[1].sections).toContain(expectedSectionsForVacc[0]);
        });

        it("should get datasets associated with org units", function() {

            var dataset1 = {
                "id": "DS1",
                "organisationUnits": [{
                    "name": "Mod1",
                    "id": "Mod1Id"
                }, {
                    "name": "Mod2",
                    "id": "Mod2Id"
                }]
            };
            var dataset2 = {
                "id": "DS2",
                "organisationUnits": [{
                    "name": "Mod3",
                    "id": "Mod3Id"
                }, {
                    "name": "Mod2",
                    "id": "Mod2Id"
                }]
            };
            var dataset3 = {
                "id": "DS3",
                "organisationUnits": [{
                    "name": "Mod3",
                    "id": "Mod3Id"
                }, {
                    "name": "Mod1",
                    "id": "Mod1Id"
                }]
            };
            var orgUnit = {
                "name": "Mod2",
                "id": "Mod2Id"
            };

            var datasets = [dataset1, dataset2];

            var actualDatasets = datasetTransformer.getAssociatedDatasets(orgUnit.id, datasets);

            expect(actualDatasets).toEqual([dataset1, dataset2]);
        });
    });
});
