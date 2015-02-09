define(["datasetTransformer", "testData", "lodash"], function(datasetTransformer, testData, _) {
    describe("datasetTransformer", function() {

        it("should enrich datasets", function() {

            var datasets, sections, dataelements;
            datasets = testData.get("dataSets");
            sections = testData.get("sections");
            dataelements = testData.get("dataElements");

            var expectedEnrichedDatasets = [{
                name: 'OPD',
                id: 'DS_OPD',
                organisationUnits: [{
                    id: 'mod1'
                }],
                attributeValues: [{
                    attribute: {
                        id: 'wFC6joy3I8Q',
                        code: 'isNewDataModel'
                    },
                    value: 'false'
                }],
                dataElements: [],
                sections: [{
                    id: 'Sec1',
                    dataSet: {
                        name: 'OPD',
                        id: 'DS_OPD'
                    },
                    isIncluded: true,
                    dataElements: [{
                        id: 'DE1',
                        name: 'DE1 - ITFC',
                        isIncluded: true,
                        formName: 'DE1'
                    }, {
                        id: 'DE2',
                        name: 'DE2 - ITFC',
                        isIncluded: true,
                        formName: 'DE2'
                    }, {
                        id: 'DE4',
                        name: 'DE4 - ITFC',
                        isIncluded: true,
                        formName: 'DE4'
                    }]
                }, {
                    id: 'Sec2',
                    dataSet: {
                        name: 'OPD',
                        id: 'DS_OPD'
                    },
                    isIncluded: true,
                    dataElements: [{
                        id: 'DE1',
                        name: 'DE1 - ITFC',
                        isIncluded: true,
                        formName: 'DE1'
                    }]
                }]
            }, {
                name: 'Vaccination',
                id: 'Vacc',
                organisationUnits: [{
                    id: 'mod2'
                }],
                attributeValues: [{
                    attribute: {
                        id: 'wFC6joy3I8Q',
                        code: 'isNewDataModel'
                    },
                    value: 'true'
                }],
                dataElements: [],
                sections: [{
                    id: 'Sec3',
                    dataSet: {
                        name: 'Vaccination',
                        id: 'Vacc'
                    },
                    isIncluded: false,
                    dataElements: [{
                        id: 'DE3',
                        name: 'DE3 - ITFC',
                        isIncluded: false,
                        formName: 'DE3'
                    }]
                }]
            }];

            expect(datasetTransformer.enrichDatasets(datasets, sections, dataelements, ['DE3'])).toEqual(expectedEnrichedDatasets);
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