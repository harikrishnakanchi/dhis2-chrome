define(["uploadProgramConsumer", "programRepository", "programService", "angularMocks"], function(UploadProgramConsumer, ProgramRepository, ProgramService, mocks) {
    describe("Upload Program consumer", function() {
        var consumer, programService, program1, program2, scope, q;

        beforeEach(mocks.inject(function($q, $rootScope) {
            programRepository = new ProgramRepository();

            programService = new ProgramService();
            spyOn(programService, "upsert");

            scope = $rootScope.$new();
            q = $q;
            program1 = {
                "id": "id123",
                "name": "program1",
                "kind": "SINGLE_EVENT_WITHOUT_REGISTRATION",
                "organisationUnits": [{
                    "id": "org1",
                    "name": "org unit 1"
                }]
            };

            program2 = {
                "id": "id124",
                "name": "program2",
                "kind": "SINGLE_EVENT_WITHOUT_REGISTRATION",
                "organisationUnits": [{
                    "id": "org2",
                    "name": "org unit 2"
                }]
            };

            spyOn(programRepository, "get").and.callFake(function(id) {
                var idbData = {
                    "id123": program1,
                    "id124": program2
                };
                return idbData[id];
            });

        }));

        it("should upload projects", function() {
            var message = {
                data: {
                    data: [{
                        id: "id123",
                        name: "program1"
                    }, {
                        id: "id124",
                        name: "program2p"
                    }],
                    type: "uploadProgram"
                }
            };

            consumer = new UploadProgramConsumer(programService, programRepository, q);
            consumer.run(message);
            scope.$apply();
            expect(programService.upsert).toHaveBeenCalledWith([program1, program2]);
        });
    });
});
