define(["loginController", "angularMocks", "utils", "sessionHelper"], function(LoginController, mocks, utils, SessionHelper) {
    describe("login controller", function() {
        var rootScope, loginController, scope, location, db, q, fakeUserStore, fakeUserCredentialsStore, hustle, fakeUserStoreSpy, sessionHelper;

        beforeEach(module("hustle"));

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
                return utils.getPromise(q, {
                    "username": "project_user",
                    "password": "caa63a86bbc63b2ae67ef0a069db7fb9"
                });
            });

            spyOn(hustle, "publish");

            sessionHelper = new SessionHelper();
            spyOn(sessionHelper, "login").and.returnValue(utils.getPromise(q, {}));
            loginController = new LoginController(rootScope, scope, location, db, q, hustle, sessionHelper);
        }));

        it("should login admin user with valid credentials and redirect to dashboard", function() {
            scope.username = "MSFAdmin";
            scope.password = "password";

            scope.login();
            scope.$apply();

            expect(fakeUserStore.find).toHaveBeenCalledWith("msfadmin");
            expect(fakeUserCredentialsStore.find).toHaveBeenCalledWith("msfadmin");
            expect(location.path).toHaveBeenCalledWith("/dashboard");
            expect(scope.invalidCredentials).toEqual(false);
            expect(hustle.publish).toHaveBeenCalledWith({
                "type": "downloadData"
            }, "dataValues");
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

            expect(hustle.publish).toHaveBeenCalledWith({
                "type": "downloadData"
            }, "dataValues");
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
