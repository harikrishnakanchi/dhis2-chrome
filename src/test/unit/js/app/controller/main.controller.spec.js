define(["mainController", "angularMocks"], function(MainController, mocks) {
    describe("dashboard controller", function() {
        var rootScope, mainController, scope;

        beforeEach(mocks.inject(function($rootScope) {
            scope = $rootScope.$new();
            rootScope = $rootScope;
            mainController = new MainController(scope, $rootScope, {
                get: function() {
                    return {
                        success: function() {}
                    }
                }
            });
        }));


        it("should logout user", function() {
            rootScope.isLoggedIn = true;

            scope.logout();

            expect(rootScope.isLoggedIn).toEqual(false);
        });
    });
});