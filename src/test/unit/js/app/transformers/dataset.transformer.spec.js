define(["datasetTransformer", "testData", "lodash"], function(datasetTransformer, testData, _) {
    describe("dataset", function() {

        var datasets, sections, dataelements, data, expectedEnrichedDatasets, systemSettings, expectedFilteredDatasets, enrichedDatasets;

        beforeEach(function() {

            datasets = testData["dataSets"];
            sections = testData["sections"];
            dataelements = testData["dataElements"];
            data = [datasets, sections, dataelements];
            systemSettings = {
                excludedDataElements: {
                    "Module1": ['DE3']
                }
            };
            expectedEnrichedDatasets = [{
                name: 'OPD',
                id: 'DS_OPD',
                organisationUnits: [{
                    id: 'Module1'
                }],
                dataElements: [],
                sections: [{
                    id: 'Sec1',
                    dataSet: {
                        name: 'OPD',
                        id: 'DS_OPD',
                        organisationUnits: [{
                            id: 'Module1'
                        }]
                    },
                    dataElements: [{
                        id: 'DE1',
                        name: 'DE1 - ITFC',
                        formName: 'DE1'
                    }, {
                        id: 'DE2',
                        name: 'DE2 - ITFC',
                        formName: 'DE2'
                    }, {
                        id: 'DE4',
                        name: 'DE4 - ITFC',
                        formName: 'DE4'
                    }]
                }, {
                    id: 'Sec2',
                    dataSet: {
                        name: 'OPD',
                        id: 'DS_OPD',
                        organisationUnits: [{
                            id: 'Module1'
                        }]
                    },
                    dataElements: [{
                        id: 'DE1',
                        name: 'DE1 - ITFC',
                        formName: 'DE1'
                    }]
                }]
            }, {
                name: 'Vaccination',
                id: 'Vacc',
                organisationUnits: [{
                    id: 'Module2'
                }],
                dataElements: [],
                sections: [{
                    id: 'Sec3',
                    dataSet: {
                        name: 'Vaccination',
                        id: 'Vacc',
                        organisationUnits: [{
                            id: 'Module2'
                        }]
                    },
                    dataElements: [{
                        id: 'DE3',
                        name: 'DE3 - ITFC',
                        formName: 'DE3'
                    }]
                }]
            }];

            expectedFilteredDatasets = [{
                name: 'OPD',
                id: 'DS_OPD',
                organisationUnits: [{
                    id: 'Module1'
                }],
                dataElements: [],
                sections: [{
                    id: 'Sec1',
                    dataSet: {
                        name: 'OPD',
                        id: 'DS_OPD',
                        organisationUnits: [{
                            id: 'Module1'
                        }]
                    },
                    dataElements: [{
                        id: 'DE1',
                        name: 'DE1 - ITFC',
                        formName: 'DE1'
                    }, {
                        id: 'DE2',
                        name: 'DE2 - ITFC',
                        formName: 'DE2'
                    }, {
                        id: 'DE4',
                        name: 'DE4 - ITFC',
                        formName: 'DE4'
                    }]
                }, {
                    id: 'Sec2',
                    dataSet: {
                        name: 'OPD',
                        id: 'DS_OPD',
                        organisationUnits: [{
                            id: 'Module1'
                        }]
                    },
                    dataElements: [{
                        id: 'DE1',
                        name: 'DE1 - ITFC',
                        formName: 'DE1'
                    }]
                }]
            }, {
                name: 'Vaccination',
                id: 'Vacc',
                organisationUnits: [{
                    id: 'Module2'
                }],
                dataElements: [],
                sections: []
            }];

            enrichedDatasets = _.cloneDeep(expectedEnrichedDatasets);

        });



        it("should enrich datasets", function() {
            expect(datasetTransformer.enrichDatasets(data)).toEqual(expectedEnrichedDatasets);
        });

        it("should get filtered datasets", function() {
            expect(datasetTransformer.getFilteredDatasets(enrichedDatasets, systemSettings, "Module1")).toEqual(expectedFilteredDatasets);
        });

    });

});