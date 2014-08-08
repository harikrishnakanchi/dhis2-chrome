define(["systemSettingsTransformer"], function(systemSettingsTransformer) {
    describe("system settings", function() {

        var modules, parent, expectedSystemSettings;

        it("should construct system settings", function() {
            modules = [{
                name: "mod1 name",
                id: "mod1",
                datasets: [{
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

            expectedSystemSettings = {
                "excludedDataElements": {
                    "mod1": ["2"]
                }
            };
            expect(systemSettingsTransformer.constructSystemSettings(modules)).toEqual(expectedSystemSettings);
        });
    });
});