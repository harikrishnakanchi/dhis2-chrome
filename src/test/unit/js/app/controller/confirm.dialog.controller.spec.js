define(["confirmDialogController", "angularMocks"], function(ConfirmDialogController, mocks) {
    describe("confirmDialogController", function() {
        var scope, modalInstance, confirmDialogController;

        beforeEach(mocks.inject(function($rootScope) {
            scope = $rootScope.$new();
            modalInstance = {
                'close': function() {},
                'dismiss': function() {}
            };
            confirmDialogController = new ConfirmDialogController(scope, modalInstance);

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