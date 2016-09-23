define(['associateOrgunitToProgramConsumer', 'utils', 'angularMocks', 'programService'], function (AssociateOrgunitToProgramConsumer, utils, mocks, ProgramService) {
    describe("associateOrgunitToProgram", function() {
        var associateOrgunitToProgramConsumer, message, programService, q, scope;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();

            programService = new ProgramService();
            spyOn(programService, "assignOrgUnitToProgram").and.returnValue(utils.getPromise(q, {}));

            associateOrgunitToProgramConsumer = new AssociateOrgunitToProgramConsumer(programService, q);
        }));

        it("should save each orgUnit to each dataset", function() {
            message = {
                data: {
                    data: {
                        orgUnitIds: ['someOrgUnitId', 'someOtherOrgUnitId'],
                        programIds: ['someProgramId', 'someOtherProgramId']
                    },
                    type: "associateProgram"
                }
            };

            associateOrgunitToProgramConsumer.run(message);
            scope.$apply();

            expect(programService.assignOrgUnitToProgram).toHaveBeenCalledWith('someProgramId', 'someOrgUnitId');
            expect(programService.assignOrgUnitToProgram).toHaveBeenCalledWith('someProgramId', 'someOtherOrgUnitId');
            expect(programService.assignOrgUnitToProgram).toHaveBeenCalledWith('someOtherProgramId', 'someOrgUnitId');
            expect(programService.assignOrgUnitToProgram).toHaveBeenCalledWith('someOtherProgramId', 'someOtherOrgUnitId');
        });
    });
});