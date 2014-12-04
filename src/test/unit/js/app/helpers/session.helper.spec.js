define(["sessionHelper", "angularMocks"], function(SessionHelper, mocks) {
    describe("session helper", function() {
        var rootScope;

        beforeEach(mocks.inject(function($rootScope) {
            rootScope = $rootScope;
            sessionHelper = new SessionHelper(rootScope);
        }));

        it("should logout user", function() {
            rootScope.currentUser = {
                "userName": "some user"
            };
            rootScope.isLoggedIn = true;

            sessionHelper.logout();

            expect(rootScope.currentUser).toBeUndefined();
            expect(rootScope.isLoggedIn).toBeFalsy();
        });
    });
});
