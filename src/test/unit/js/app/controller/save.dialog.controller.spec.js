define(["saveDialogController", "angularMocks"], function(SaveDialogController, mocks) {
    describe("saveDialogController", function() {
        var scope, modalInstance, saveDialogController;

        beforeEach(mocks.inject(function($rootScope) {
            scope = $rootScope.$new();
            modalInstance = {
                'close': function() {},
                'dismiss': function() {}
            };
            saveDialogController = new SaveDialogController(scope, modalInstance);

        }));

        it("should close the modal for OK", function() {
            spyOn(modalInstance, "close");
            scope.ok();

            expect(modalInstance.close).toHaveBeenCalled();
        });

        it("should dismiss the modal for Cancel", function() {
            spyOn(modalInstance, "dismiss");
            scope.cancel();

            expect(modalInstance.dismiss).toHaveBeenCalledWith('cancel');
        });
    });
});