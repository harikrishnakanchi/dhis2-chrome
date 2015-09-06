define(["systemSettingsTransformer"], function(systemSettingsTransformer) {
    describe("system settings", function() {

        var modules, parent, expectedSystemSettings;

        it("should give excluded data elements for aggregate module", function() {
            var associatedDatasets = [{
                sections: [{
                    dataElements: [{
                        "id": "1",
                        "isIncluded": true
                    }, {
                        "id": "2",
                        "isIncluded": false
                    }, {
                        "id": "3",
                        "isIncluded": true
                    }]
                }]
            }];

            expect(systemSettingsTransformer.excludedDataElementsForAggregateModule(associatedDatasets)).toEqual([{
                "id": "2"
            }]);
        });

        it("should give excluded data elements for line list module", function() {
            var enrichedProgram = {
                programStages: [{
                    programStageSections: [{
                        programStageDataElements: [{
                            "dataElement": {
                                "id": "1",
                                "isIncluded": true
                            }
                        }, {
                            "dataElement": {
                                "id": "2",
                                "isIncluded": false
                            }
                        }, {
                            "dataElement": {
                                "id": "3",
                                "isIncluded": true
                            }
                        }]
                    }]
                }]
            };

            expect(systemSettingsTransformer.excludedDataElementsForLinelistModule(enrichedProgram)).toEqual([{
                "id": "2"
            }]);
        });
    });
});
