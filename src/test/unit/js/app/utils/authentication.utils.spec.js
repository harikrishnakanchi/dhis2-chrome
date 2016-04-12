define(["authenticationUtils"], function(authenticationUtils) {
    describe("authenticationUtils", function() {
        describe("shouldRedirectToLogin", function() {
            var mockRootScope, mockLocation;
            beforeEach(function() {
                mockRootScope = { "isLoggedIn": false };
                mockLocation = {path: jasmine.createSpy("path").and.returnValue('/productKeyPage')};
            });

            it("returns false if user is already logged in", function() {
                mockRootScope.isLoggedIn = true;
                expect(authenticationUtils.shouldRedirectToLogin(mockRootScope, mockLocation)).toBe(false);
            });

            it("returns false if user is accessing product key page", function() {
                expect(authenticationUtils.shouldRedirectToLogin(mockRootScope, mockLocation)).toBe(false);
            });

            it("returns true if user is not logged in already and is not accessing product key page", function() {
                mockLocation = {path: jasmine.createSpy("path").and.returnValue('/somePage')};
                expect(authenticationUtils.shouldRedirectToLogin(mockRootScope, mockLocation)).toBe(true);
            });

            it("returns false if rootscope.isLoogedIn undefined", function() {
                mockRootScope = {};
                expect(authenticationUtils.shouldRedirectToLogin(mockRootScope, mockLocation)).toBe(false);
            });
        });
    });
});
