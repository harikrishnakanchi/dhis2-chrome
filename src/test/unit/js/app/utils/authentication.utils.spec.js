define(["authenticationUtils"], function(authenticationUtils) {
    describe("authenticationUtils", function() {
        describe("shouldRedirectToLogin", function() {
            var mockRootScope, newUrl;
            beforeEach(function() {
                mockRootScope = { "isLoggedIn": false };
                newUrl = "some.Base.Url.#/anotherPage";
            });

            it("returns false if user is already logged in", function() {
                mockRootScope.isLoggedIn = true;
                expect(authenticationUtils.shouldRedirectToLogin(mockRootScope, newUrl)).toBe(false);
            });

            it("returns false if user is accessing product key page", function() {
                newUrl = "some.Base.Url.#/productKeyPage";
                expect(authenticationUtils.shouldRedirectToLogin(mockRootScope, newUrl)).toBe(false);
            });

            it("returns true if user is not logged in already and is not accessing product key page", function() {
                expect(authenticationUtils.shouldRedirectToLogin(mockRootScope, newUrl)).toBe(true);
            });
        });
    });
});
