define(["systemSettingsTransformer"], function(systemSettingsTransformer) {
    describe("system settings", function() {

        var modules, parent, expectedSystemSettings;


        beforeEach(function() {

            modules = [{
                name: "test1",
                id: 1,
                selectedDataElements: {
                    "123456": true,
                    "123457": false,
                    "123458": true,
                    "123459": true,
                    "123452": false,
                    "123450": true,
                    "123451": true,
                }
            }];

            parent = {
                name: "testParent",
                id: 1
            };

            expectedSystemSettings = {
                "excludedDataElements": {
                    "1": ["123452", "123457"]
                }
            };
        });

        it("should construct system settings", function() {
            expect(systemSettingsTransformer.constructSystemSettings(modules, parent)).toEqual(expectedSystemSettings);
        });
    });
});