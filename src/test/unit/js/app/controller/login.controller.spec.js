define(["loginController", "angularMocks", "utils", "sessionHelper"], function(LoginController, mocks, utils, SessionHelper) {
    describe("login controller", function() {
        var rootScope, loginController, scope, location, db, q, fakeUserStore, fakeUserCredentialsStore, fakeUserStoreSpy, sessionHelper, hustle;

        beforeEach(module('hustle'));
        beforeEach(mocks.inject(function($rootScope, $location, $q, $hustle) {
            scope = $rootScope.$new();
            rootScope = $rootScope;
            location = $location;
            hustle = $hustle;
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

            rootScope = {
                "hasRoles": jasmine.createSpy("hasRoles").and.returnValue(false)
            };
            spyOn(location, 'path');

            spyOn(db, 'objectStore').and.callFake(function(storeName) {
                if (storeName === "users")
                    return fakeUserStore;
                if (storeName === "localUserCredentials")
                    return fakeUserCredentialsStore;
            });

            fakeUserStoreSpy = spyOn(fakeUserStore, 'find');
            fakeUserStoreSpy.and.callFake(function(username) {
                return utils.getPromise(q, {
                    "id": "xYRvx4y7Gm9",
                    "userCredentials": {
                        "username": username
                    },
                    "organisationUnits": [{
                        "id": 123
                    }]
                });
            });

            spyOn(fakeUserCredentialsStore, 'find').and.callFake(function(username) {
                if (username === "msfadmin")
                    return utils.getPromise(q, {
                        "username": "msfadmin",
                        "password": "5f4dcc3b5aa765d61d8327deb882cf99"
                    });
                if (username === "superadmin")
                    return utils.getPromise(q, {
                        "username": "superadmin",
                        "password": "7536ad6ce98b48f23a1bf8f74f53da83"
                    });
                return utils.getPromise(q, {
                    "username": "project_user",
                    "password": "caa63a86bbc63b2ae67ef0a069db7fb9"
                });
            });

            sessionHelper = new SessionHelper();
            spyOn(sessionHelper, "login").and.returnValue(utils.getPromise(q, {}));
            loginController = new LoginController(rootScope, scope, location, db, q, sessionHelper, hustle);
        }));

        it("should login super admin user with valid credentials and redirect to orgUnits", function() {
            scope.username = "superadmin";
            scope.password = "msfsuperadmin";

            rootScope.hasRoles.and.returnValue(true);

            scope.login();
            scope.$apply();

            expect(fakeUserStore.find).toHaveBeenCalledWith("superadmin");
            expect(fakeUserCredentialsStore.find).toHaveBeenCalledWith("superadmin");
            expect(location.path).toHaveBeenCalledWith("/orgUnits");
            expect(scope.invalidCredentials).toEqual(false);
        });

        it("should not login super admin user with invalid password", function() {
            scope.username = "superadmin";
            scope.password = "password1234";

            scope.login();
            scope.$apply();

            expect(rootScope.isLoggedIn).toEqual(undefined);
            expect(location.path).not.toHaveBeenCalled();
            expect(scope.invalidCredentials).toEqual(true);
        });

        it("should login admin user with valid credentials and redirect to orgunits", function() {
            scope.username = "MSFAdmin";
            scope.password = "password";

            rootScope.hasRoles.and.returnValue(true);

            scope.login();
            scope.$apply();

            expect(fakeUserStore.find).toHaveBeenCalledWith("msfadmin");
            expect(fakeUserCredentialsStore.find).toHaveBeenCalledWith("msfadmin");
            expect(location.path).toHaveBeenCalledWith("/orgUnits");
            expect(scope.invalidCredentials).toEqual(false);
        });

        it("should not login msfadmin user with invalid password", function() {
            scope.username = "msfadmin";
            scope.password = "password1234";

            scope.login();
            scope.$apply();

            expect(rootScope.isLoggedIn).toEqual(undefined);
            expect(location.path).not.toHaveBeenCalled();
            expect(scope.invalidCredentials).toEqual(true);
        });

        it("should login project user with valid credentials and redirect to dashboard", function() {
            scope.username = "someProjectUser";
            scope.password = "msfuser";

            scope.login();
            scope.$apply();

            expect(location.path).toHaveBeenCalledWith("/dashboard");
            expect(scope.invalidCredentials).toEqual(false);
        });

        it("should not login project user with invalid password", function() {
            scope.username = "someProjectUser";
            scope.password = "msfuser1234";

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

    });
});
