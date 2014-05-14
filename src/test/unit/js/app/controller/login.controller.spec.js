define(["loginController", "angularMocks", "utils"], function(LoginController, mocks, utils) {
    describe("dashboard controller", function() {
        var rootScope, loginController, scope, location, db, q, fakeUserStore, fakeUserCredentialsStore;

        beforeEach(mocks.inject(function($rootScope, $location, $q) {
            scope = $rootScope.$new();
            rootScope = $rootScope;
            location = $location;
            q = $q;

            db = {
                objectStore: function() {}
            };

            fakeUserStore = {
                "find": function() {}
            };

            fakeUserCredentialsStore = {
                "find": function() {}
            };

            spyOn(location, 'path');

            spyOn(db, 'objectStore').and.callFake(function(storeName) {
                if (storeName === "users")
                    return fakeUserStore;
                if (storeName === "localUserCredentials")
                    return fakeUserCredentialsStore;
            });

            spyOn(fakeUserStore, 'find').and.returnValue(utils.getPromise(q, {
                "id": "xYRvx4y7Gm9",
                "userCredentials": {
                    "username": "admin"
                }
            }));

            spyOn(fakeUserCredentialsStore, 'find').and.returnValue(utils.getPromise(q, {
                "username": "admin",
                "password": "5f4dcc3b5aa765d61d8327deb882cf99"
            }));

            loginController = new LoginController(scope, $rootScope, location, db, q);
        }));

        it("should login user with valid credentials and redirect to dashboard", function() {
            scope.username = "Admin";
            scope.password = "password";

            scope.login();
            scope.$apply();

            expect(fakeUserStore.find).toHaveBeenCalledWith("admin");
            expect(fakeUserCredentialsStore.find).toHaveBeenCalledWith("admin");
            expect(rootScope.currentUser.userCredentials.username).toEqual('admin');
            expect(rootScope.isLoggedIn).toEqual(true);
            expect(location.path).toHaveBeenCalledWith("/dashboard");
            expect(scope.invalidCredentials).toEqual(false);
        });

        it("should not login user with invalid password", function() {
            scope.username = "admin";
            scope.password = "password1234";

            scope.login();
            scope.$apply();

            expect(rootScope.isLoggedIn).toEqual(undefined);
            expect(location.path).not.toHaveBeenCalled();
            expect(scope.invalidCredentials).toEqual(true);
        });

        it("should not login user with invalid username", function() {
            fakeUserStore = {
                "find": function() {
                    return utils.getPromise(q, undefined);
                }
            };

            scope.username = "admin123";
            scope.password = "password";

            scope.login();
            scope.$apply();

            expect(rootScope.isLoggedIn).toEqual(undefined);
            expect(location.path).not.toHaveBeenCalled();
            expect(scope.invalidCredentials).toEqual(true);
        });

        it("should prompt for setting password if username exists but the usercredentials does not", function() {
            fakeUserStore = {
                "find": function() {
                    return utils.getPromise(q, {
                        "id": "xYRvx4y7Gm9",
                        "userCredentials": {
                            "username": "newuser"
                        }
                    });
                }
            };

            fakeUserCredentialsStore = {
                "find": function() {
                    return utils.getPromise(q, undefined);
                }
            };

            scope.username = "newuser";
            scope.password = "password123";

            scope.login();
            scope.$apply();

            expect(rootScope.isLoggedIn).toEqual(undefined);
            expect(location.path).not.toHaveBeenCalled();

            expect(scope.invalidCredentials).toEqual(false);
            expect(scope.promptForPassword).toEqual(true);
        });

    });
});