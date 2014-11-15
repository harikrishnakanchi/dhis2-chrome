define(["programTransformer"], function(programTransformer) {
    describe("program transformer", function() {
        it("should add modules to program", function() {
            var allPrograms = [{
                "id": "ll1",
                "name": "Line List1",
                "orgUnitIds": [
                    "org1"
                ],
                "organisationUnits": [{
                    "id": "org1",
                    "name": "org unit 1"
                }]
            }];

            var programWiseModules = {
                "ll1": [{
                    "name": "Module1"
                }]
            };

            var enrichedModules = [{
                "id": "mod1",
                "name": "Module1"
            }];

            var expectedPrograms = [{
                "id": "ll1",
                "name": "Line List1",
                "orgUnitIds": [
                    "org1", "mod1"
                ],
                "organisationUnits": [{
                    "id": "org1",
                    "name": "org unit 1"
                }, {
                    "id": "mod1",
                    "name": "Module1"
                }]
            }];

            var actualPrograms = programTransformer.addModules(allPrograms, programWiseModules, enrichedModules);
            expect(actualPrograms).toEqual(expectedPrograms);
        });
    });
});