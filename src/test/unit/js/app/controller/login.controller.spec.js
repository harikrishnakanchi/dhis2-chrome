define(["loginController", "angularMocks", "utils", "userPreferenceRepository"], function(LoginController, mocks, utils, UserPreferenceRepository) {
    describe("login controller", function() {
        var rootScope, loginController, scope, location, db, q, fakeUserStore, fakeUserCredentialsStore, userPreferenceStore, userPreferenceRepository, hustle, fakeUserStoreSpy;

        beforeEach(module("hustle"));

        beforeEach(mocks.inject(function($rootScope, $location, $q, $hustle) {
            scope = $rootScope.$new();
            rootScope = $rootScope;
            location = $location;
            hustle = $hustle;
            q = $q;
            userPreferenceRepository = new UserPreferenceRepository();
            spyOn(userPreferenceRepository, 'get').and.returnValue(utils.getPromise(q, {}));

            db = {
                objectStore: function() {}
            };

            fakeUserStore = {
                "find": function() {}
            };

            fakeUserCredentialsStore = {
                "find": function() {}
            };

            userPreferenceStore = {
                "find": function() {}
            };

            spyOn(location, 'path');

            spyOn(db, 'objectStore').and.callFake(function(storeName) {
                if (storeName === "users")
                    return fakeUserStore;
                if (storeName === "localUserCredentials")
                    return fakeUserCredentialsStore;
                if (storeName === "userPreferences")
                    return userPreferenceStore;
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

            spyOn(userPreferenceStore, 'find').and.returnValue(utils.getPromise(q, {}));
            spyOn(userPreferenceRepository, 'save').and.returnValue(utils.getPromise(q, {}));
            spyOn(hustle, "publish");

            loginController = new LoginController(scope, $rootScope, location, db, q, hustle, userPreferenceRepository);
        }));

        it("should login admin user with valid credentials and redirect to dashboard", function() {
            scope.username = "MSFAdmin";
            scope.password = "password";

            scope.login();
            scope.$apply();

            expect(fakeUserStore.find).toHaveBeenCalledWith("msfadmin");
            expect(fakeUserCredentialsStore.find).toHaveBeenCalledWith("msfadmin");
            expect(rootScope.currentUser.userCredentials.username).toEqual("msfadmin");
            expect(rootScope.isLoggedIn).toEqual(true);
            expect(location.path).toHaveBeenCalledWith("/dashboard");
            expect(scope.invalidCredentials).toEqual(false);
            expect(userPreferenceRepository.save).toHaveBeenCalledWith({
                username: "msfadmin",
                locale: undefined,
                orgUnits: [{
                    "id": 123
                }]
            });
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

            expect(rootScope.currentUser.userCredentials.username).toEqual('someprojectuser');
            expect(rootScope.isLoggedIn).toEqual(true);
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
