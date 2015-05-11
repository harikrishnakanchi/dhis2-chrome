define(["notificationDialogController", "angularMocks"], function(NotificationDialogController, mocks) {
    describe("notificationDialogController", function() {
        var scope, modalInstance, notificationDialogController;

        beforeEach(mocks.inject(function($rootScope) {
            scope = $rootScope.$new();
            modalInstance = {
                'close': function() {},
                'dismiss': function() {}
            };
            scope.notificationMessages = {
                "okLabel": "ok",
                "notificationTitle": "title",
                "notificationMessage": "confirmationMessage"
            };
            scope.resourceBundle = {
                "okLabel": "ok"
            };
            notificationDialogController = new NotificationDialogController(scope, modalInstance);

        }));

        it("should close the modal for OK", function() {
            spyOn(modalInstance, "dismiss");
            scope.ok();

            expect(modalInstance.dismiss).toHaveBeenCalledWith('cancel');
        });
    });
});
