define(["loginController", "angularMocks", "utils", "sessionHelper", "userPreferenceRepository", "orgUnitRepository", "systemSettingRepository"], function(LoginController, mocks, utils, SessionHelper, UserPreferenceRepository, OrgUnitRepository, SystemSettingRepository) {
    describe("login controller", function() {
        var rootScope, loginController, scope, location, db, q, fakeUserStore, fakeUserCredentialsStore, fakeUserStoreSpy, sessionHelper, hustle, userPreferenceRepository;

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
                        "username": username,
                        "userRoles": [{
                            "name": "Superadmin"
                        }]
                    },
                    "organisationUnits": [{
                        "id": 123
                    }]
                });
            });

            spyOn(fakeUserCredentialsStore, 'find').and.callFake(function(username) {
                if (username === "projectadmin")
                    return utils.getPromise(q, {
                        "username": "projectadmin",
                        "password": "5f4dcc3b5aa765d61d8327deb882cf99",
                        "userRoles": [{
                            "name": "Superuser"
                        }]
                    });
                if (username === "superadmin")
                    return utils.getPromise(q, {
                        "username": "superadmin",
                        "password": "7536ad6ce98b48f23a1bf8f74f53da83",
                        "userRoles": [{
                            "name": "Superadmin"
                        }]
                    });
                return utils.getPromise(q, {
                    "username": "project_user",
                    "password": "caa63a86bbc63b2ae67ef0a069db7fb9",
                    "userRoles": [{
                        "name": "Coordination Level Approver"
                    }]
                });
            });

            sessionHelper = new SessionHelper();
            spyOn(sessionHelper, "login").and.returnValue(utils.getPromise(q, {}));

            userPreferenceRepository = new UserPreferenceRepository();
            spyOn(userPreferenceRepository, "getCurrentProjects").and.returnValue(utils.getPromise(q, []));

            systemSettingRepository = new SystemSettingRepository();
            spyOn(systemSettingRepository, "getAllowedOrgUnits").and.returnValue([]);
            spyOn(systemSettingRepository, "getProductKeyLevel").and.returnValue("");

            orgUnitRepository = new OrgUnitRepository();
            spyOn(orgUnitRepository, "get").and.returnValue(utils.getPromise(q, {}));

            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));

            loginController = new LoginController(rootScope, scope, location, db, q, sessionHelper, hustle, userPreferenceRepository, orgUnitRepository, systemSettingRepository);
        }));

        it("should set invalid access as true when their is project level product key and there is no common org unit", function() {
            scope.username = "superadmin";
            scope.password = "msfsuperadmin";

            systemSettingRepository.getProductKeyLevel.and.returnValue("project");
            systemSettingRepository.getAllowedOrgUnits.and.returnValue([{"id" : 22}]);

            scope.login();
            scope.$apply();

            expect(scope.invalidAccess).toEqual(true);
        });

        it("should set invalid access as false when their is project level product key and there is common org unit", function() {
            scope.username = "superadmin";
            scope.password = "msfsuperadmin";

            systemSettingRepository.getProductKeyLevel.and.returnValue("project");
            systemSettingRepository.getAllowedOrgUnits.and.returnValue([{"id" : 123}]);

            scope.login();
            scope.$apply();

            expect(scope.invalidAccess).toEqual(false);
        });

        it("should set invalid access as true when their is country level product key and there is no common org unit for coordinator level approver", function() {
            scope.username = "project_user";
            scope.password = "msfuser";

            fakeUserStoreSpy.and.callFake(function(username) {
                return utils.getPromise(q, {
                    "id": "xYRvx4y7Gm9",
                    "userCredentials": {
                        "username": username,
                        "userRoles": [{
                            "name": "Coordination Level Approver"
                        }]
                    },
                    "organisationUnits": [{
                        "id": 123
                    }]
                });
            });

            systemSettingRepository.getProductKeyLevel.and.returnValue("country");
            systemSettingRepository.getAllowedOrgUnits.and.returnValue([{"id" : 22}]);

            scope.login();
            scope.$apply();

            expect(scope.invalidAccess).toEqual(true);
        });

        it("should set invalid access as false when their is country level product key and there is common org unit", function() {
            scope.username = "superadmin";
            scope.password = "msfsuperadmin";
            orgUnitRepository.get.and.returnValue(utils.getPromise(q, {"parent": {"id": 123}}));
            systemSettingRepository.getProductKeyLevel.and.returnValue("country");
            systemSettingRepository.getAllowedOrgUnits.and.returnValue([{"id" : 123}]);

            scope.login();
            scope.$apply();

            expect(scope.invalidAccess).toEqual(false);
        });

        it("should set invalid access as true when their is country level product key and there is no common org unit", function() {
            scope.username = "superadmin";
            scope.password = "msfsuperadmin";
            orgUnitRepository.get.and.returnValue(utils.getPromise(q, {"parent": {"id": 12}}));
            systemSettingRepository.getProductKeyLevel.and.returnValue("country");
            systemSettingRepository.getAllowedOrgUnits.and.returnValue([{"id" : 123}]);

            scope.login();
            scope.$apply();

            expect(scope.invalidAccess).toEqual(true);
        });

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

        it("should login project admin user with valid credentials and redirect to orgunits", function() {
            scope.username = "projectadmin";
            scope.password = "password";

            rootScope.hasRoles.and.returnValue(true);

            scope.login();
            scope.$apply();

            expect(fakeUserStore.find).toHaveBeenCalledWith("projectadmin");
            expect(fakeUserCredentialsStore.find).toHaveBeenCalledWith("projectadmin");
            expect(location.path).toHaveBeenCalledWith("/orgUnits");
            expect(scope.invalidCredentials).toEqual(false);
        });

        it("should not login msfadmin user with invalid password", function() {
            scope.username = "projectadmin";
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

        it("should start sync project data if the current user's projects are different from previous user's projects", function() {
            var previousOrgUnits = ['id1', 'id2', 'id3', 'id4'];
            var currentOrgUnits = ['id5'];

            var callIndex = 0;
            userPreferenceRepository.getCurrentProjects.and.callFake(function() {
                callIndex++;
                if (callIndex == 1)
                    return utils.getPromise(q, previousOrgUnits);

                if (callIndex == 2)
                    return utils.getPromise(q, currentOrgUnits);

                return utils.getPromise(q, []);
            });

            scope.username = "projectadmin";
            scope.password = "password";

            scope.login();
            scope.$apply();

            expect(hustle.publish).toHaveBeenCalledWith({
                "type": "downloadProjectData",
                "data": []
            }, "dataValues");
        });
    });
});
