define(["programConsumer"], function(ProgramConsumer) {
    describe("program consumer", function() {
        var consumer, programService, message, program;

        beforeEach(function() {
            programService = jasmine.createSpyObj({}, ['upload']);

            program = {
                "id": "id123",
                "name": "program1",
                "kind": "SINGLE_EVENT_WITHOUT_REGISTRATION",
                "organisationUnits": [{
                    "id": "org1",
                    "name": "org unit 1"
                }]
            };

            message = {
                data: {
                    data: program,
                    type: "uploadProgram"
                }
            };
            consumer = new ProgramConsumer(programService);
        });

        it("should create system settings for a project", function() {
            consumer.run(message);
            expect(programService.upload).toHaveBeenCalledWith(program);
        });
    });
});