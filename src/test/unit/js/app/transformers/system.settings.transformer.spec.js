define(["systemSettingsTransformer"], function(systemSettingsTransformer) {
    describe("system settings", function() {

        var modules, parent, expectedSystemSettings;

        it("should construct system settings for aggregate modules", function() {
            modules = [{
                name: "mod1 name",
                id: "mod1",
                associatedDatasets: [{
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
                }]
            }];

            expect(systemSettingsTransformer.constructSystemSettings(modules)).toEqual({
                "mod1": ["2"]
            });
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

            expect(systemSettingsTransformer.excludedDataElementsForLinelistModule(enrichedProgram)).toEqual(
                ["2"]
            );
        });
    });
});