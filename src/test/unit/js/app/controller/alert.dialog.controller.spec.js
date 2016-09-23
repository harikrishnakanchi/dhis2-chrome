define(['angularMocks', 'alertDialogController'], function (mocks, AlertDialogController) {
    describe('AlertDialogController', function () {
        var alertDialogController, scope, modalInstance;

        beforeEach(mocks.inject(function ($rootScope){
            scope = $rootScope.$new();
            scope.modalMessages = {
                "ok" : "ok",
                "confirmationMessage" : "confirmationMessage"
            };
            modalInstance = {
                close: function () {}
            };

            alertDialogController = new AlertDialogController(scope, modalInstance);
        }));

        it('should close the modal on dismiss', function () {
            spyOn(modalInstance, 'close');
            scope.ok();

            expect(modalInstance.close).toHaveBeenCalled();
        });
    });
});