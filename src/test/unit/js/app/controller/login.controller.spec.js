define(["loginController", "angularMocks", "utils"], function(LoginController, mocks, utils) {
    describe("dashboard controller", function() {
        var rootScope, loginController, scope, location, db, mockStore, q;

        beforeEach(mocks.inject(function($rootScope, $location, $q) {
            scope = $rootScope.$new();
            rootScope = $rootScope;
            location = $location;
            q = $q;
            mockStore = {
                find: function() {}
            };
            db = {
                objectStore: function() {
                    return mockStore;
                }
            };
            spyOn(location, 'path');

            loginController = new LoginController(scope, $rootScope, location, db);
        }));

        it("should login user with valid credentials and redirect to dashboard", function() {
            spyOn(mockStore, 'find').and.returnValue(utils.getPromise(q, {
                "username": "admin",
                "password": "5f4dcc3b5aa765d61d8327deb882cf99"
            }));
            scope.username = "admin";
            scope.password = "password";

            scope.login();
            scope.$apply();

            expect(rootScope.username).toEqual('admin');
            expect(rootScope.isLoggedIn).toEqual(true);
            expect(location.path).toHaveBeenCalledWith("/dashboard");
            expect(scope.invalidCredentials).toEqual(undefined);
        });

        it("should not login user with invalid credentials", function() {
            spyOn(mockStore, 'find').and.returnValue(utils.getPromise(q, {
                "username": "admin",
                "password": "5f4dcc3b5aa765d61d8327deb882cf99"
            }));
            scope.username = "admin";
            scope.password = "password1234";

            scope.login();
            scope.$apply();

            expect(rootScope.isLoggedIn).toEqual(undefined);
            expect(location.path).not.toHaveBeenCalled();
            expect(scope.invalidCredentials).toEqual(true);
        });
    });
});