define(["loginController", "angularMocks", "utils", "sessionHelper", "userPreferenceRepository", "orgUnitRepository", "systemSettingRepository", "userRepository", "chromeUtils", "checkVersionCompatibility", "translationsService"],
    function (LoginController, mocks, utils, SessionHelper, UserPreferenceRepository, OrgUnitRepository, SystemSettingRepository, UserRepository, chromeUtils, CheckVersionCompatibility, TranslationsService) {
    describe("login controller", function () {
        var rootScope, loginController, scope, location, q, fakeUserStore, fakeUserCredentialsStore, fakeUserStoreSpy, sessionHelper, hustle, userPreferenceRepository, systemSettingRepository, userRepository, orgUnitRepository, checkVersionCompatibility, translationsService;

        beforeEach(module('hustle'));
        beforeEach(mocks.inject(function ($rootScope, $location, $q, $hustle) {
            scope = $rootScope.$new();
            rootScope = $rootScope;
            location = $location;
            hustle = $hustle;
            q = $q;

            rootScope = {
                "hasRoles": jasmine.createSpy("hasRoles").and.returnValue(false)
            };

            spyOn(location, 'path');

            userRepository = new UserRepository();
            spyOn(userRepository, "getUser").and.returnValue(utils.getPromise(q, {
                "id": "xYRvx4y7Gm9",
                "userCredentials": {
                    "username": "superadmin",
                    "userRoles": [{
                        "name": "Superadmin"
                    }]
                },
                "organisationUnits": [{
                    "id": 123
                }]
            }));

            spyOn(userRepository, "getUserCredentials").and.returnValue(utils.getPromise(q, {
                "username": "superadmin",
                "password": "7536ad6ce98b48f23a1bf8f74f53da83",
                "userRoles": [{
                    "name": "Superadmin"
                }]
            }));

            sessionHelper = new SessionHelper();
            spyOn(sessionHelper, "login").and.returnValue(utils.getPromise(q, {}));

            userPreferenceRepository = new UserPreferenceRepository();
            spyOn(userPreferenceRepository, "getCurrentUsersProjectIds").and.returnValue(utils.getPromise(q, []));
            spyOn(userPreferenceRepository, "getCurrentUsersUsername").and.returnValue(utils.getPromise(q, {}));

            systemSettingRepository = new SystemSettingRepository();
            spyOn(systemSettingRepository, "getAllowedOrgUnits").and.returnValue([]);
            spyOn(systemSettingRepository, "getProductKeyLevel").and.returnValue("");
            spyOn(systemSettingRepository, "get").and.returnValue(utils.getPromise(q, ["5.1", "6.0"]));
            spyOn(systemSettingRepository, "getLocale").and.returnValue(utils.getPromise(q, "en"));

            translationsService = new TranslationsService();
            spyOn(translationsService, "setLocale");

            spyOn(chromeUtils, "getPraxisVersion").and.returnValue("5.1");

            orgUnitRepository = new OrgUnitRepository();
            spyOn(orgUnitRepository, "get").and.returnValue(utils.getPromise(q, {}));

            spyOn(hustle, "publishOnce").and.returnValue(utils.getPromise(q, {}));

            checkVersionCompatibility = CheckVersionCompatibility(systemSettingRepository);
            loginController = new LoginController(rootScope, scope, location, q, sessionHelper, hustle, userPreferenceRepository, orgUnitRepository, systemSettingRepository, userRepository, checkVersionCompatibility, translationsService);
        }));

        it("should set invalid access as true when their is project level product key and there is no common org unit", function () {
            scope.username = "superadmin";
            scope.password = "msfsuperadmin";

            systemSettingRepository.getProductKeyLevel.and.returnValue("project");
            systemSettingRepository.getAllowedOrgUnits.and.returnValue([{"id": 22}]);

            scope.login();
            scope.$apply();

            expect(scope.invalidAccess).toEqual(true);
        });

        it("should set invalid access as false when their is project level product key and there is common org unit", function () {
            scope.username = "superadmin";
            scope.password = "msfsuperadmin";

            systemSettingRepository.getProductKeyLevel.and.returnValue("project");
            systemSettingRepository.getAllowedOrgUnits.and.returnValue([{"id": 123}]);

            scope.login();
            scope.$apply();

            expect(scope.invalidAccess).toEqual(false);
        });

        it("should set invalid access as true when their is country level product key and there is no common org unit for coordinator level approver", function () {
            scope.username = "project_user";
            scope.password = "msfuser";

            userRepository.getUser.and.returnValue(utils.getPromise(q, {
                "id": "xYRvx4y7Gm9",
                "userCredentials": {
                    "username": "some_user",
                    "userRoles": [{
                        "name": "Coordination Level Approver"
                    }]
                },
                "organisationUnits": [{
                    "id": 123
                }]
            }));

            systemSettingRepository.getProductKeyLevel.and.returnValue("country");
            systemSettingRepository.getAllowedOrgUnits.and.returnValue([{"id": 22}]);

            scope.login();
            scope.$apply();

            expect(scope.invalidAccess).toEqual(true);
        });

        it("should set invalid access as false when their is country level product key and there is common org unit", function () {
            scope.username = "superadmin";
            scope.password = "msfsuperadmin";
            orgUnitRepository.get.and.returnValue(utils.getPromise(q, {"parent": {"id": 123}}));
            systemSettingRepository.getProductKeyLevel.and.returnValue("country");
            systemSettingRepository.getAllowedOrgUnits.and.returnValue([{"id": 123}]);

            scope.login();
            scope.$apply();

            expect(scope.invalidAccess).toEqual(false);
        });

        it("should set invalid access as true when their is country level product key and there is no common org unit", function () {
            scope.username = "superadmin";
            scope.password = "msfsuperadmin";
            orgUnitRepository.get.and.returnValue(utils.getPromise(q, {"parent": {"id": 12}}));
            systemSettingRepository.getProductKeyLevel.and.returnValue("country");
            systemSettingRepository.getAllowedOrgUnits.and.returnValue([{"id": 123}]);

            scope.login();
            scope.$apply();

            expect(scope.invalidAccess).toEqual(true);
        });

        it("should login super admin user with valid credentials and redirect to orgUnits", function () {
            scope.username = "superadmin";
            scope.password = "msfsuperadmin";

            rootScope.hasRoles.and.returnValue(true);

            scope.login();
            scope.$apply();

            expect(location.path).toHaveBeenCalledWith("/orgUnits");
            expect(scope.invalidCredentials).toEqual(false);
        });

        it("should not login super admin user with invalid password", function () {
            scope.username = "superadmin";
            scope.password = "password1234";

            scope.login();
            scope.$apply();

            expect(rootScope.isLoggedIn).toEqual(undefined);
            expect(location.path).not.toHaveBeenCalled();
            expect(scope.invalidCredentials).toEqual(true);
        });

        it("should login project admin user with valid credentials and redirect to orgunits", function () {
            scope.username = "projectadmin";
            scope.password = "password";

            userRepository.getUserCredentials.and.returnValue(utils.getPromise(q, {
                "username": "projectadmin",
                "password": "5f4dcc3b5aa765d61d8327deb882cf99",
                "userRoles": [{
                    "name": "Projectadmin"
                }]
            }));

            rootScope.hasRoles.and.returnValue(true);

            scope.login();
            scope.$apply();

            expect(location.path).toHaveBeenCalledWith("/orgUnits");
            expect(scope.invalidCredentials).toEqual(false);
        });

        it("should not login msfadmin user with invalid password", function () {
            scope.username = "projectadmin";
            scope.password = "password1234";

            scope.login();
            scope.$apply();

            expect(rootScope.isLoggedIn).toEqual(undefined);
            expect(location.path).not.toHaveBeenCalled();
            expect(scope.invalidCredentials).toEqual(true);
        });

        it("should login project user with valid credentials and redirect to dashboard", function () {
            scope.username = "someProjectUser";
            scope.password = "msfuser";

            userRepository.getUserCredentials.and.returnValue(utils.getPromise(q, {
                "username": "project_user",
                "password": "caa63a86bbc63b2ae67ef0a069db7fb9",
                "userRoles": [{
                    "name": "Coordination Level Approver"
                }]
            }));
            scope.login();
            scope.$apply();

            expect(location.path).toHaveBeenCalledWith("/dashboard");
            expect(scope.invalidCredentials).toEqual(false);
        });

        it("should not login project user with invalid password", function () {
            scope.username = "someProjectUser";
            scope.password = "msfuser1234";

            scope.login();
            scope.$apply();

            expect(rootScope.isLoggedIn).toEqual(undefined);
            expect(location.path).not.toHaveBeenCalled();
            expect(scope.invalidCredentials).toEqual(true);
        });

        it("should not login user with invalid username", function () {
            fakeUserStore = {
                "find": function () {
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

        it("should start sync project data if the current user's projects are different from previous user's projects", function () {
            var previousOrgUnits = ['id1', 'id2', 'id3', 'id4'];
            var currentOrgUnits = ['id5'];

            var callIndex = 0;
            userPreferenceRepository.getCurrentUsersProjectIds.and.callFake(function () {
                callIndex++;
                if (callIndex == 1)
                    return utils.getPromise(q, previousOrgUnits);

                if (callIndex == 2)
                    return utils.getPromise(q, currentOrgUnits);

                return utils.getPromise(q, []);
            });

            scope.username = "projectadmin";
            scope.password = "password";

            userRepository.getUserCredentials.and.returnValue(utils.getPromise(q, {
                "username": "projectadmin",
                "password": "5f4dcc3b5aa765d61d8327deb882cf99",
                "userRoles": [{
                    "name": "Projectadmin"
                }]
            }));
            scope.login();
            scope.$apply();

            expect(hustle.publishOnce).toHaveBeenCalledWith({
                "type": "downloadProjectData",
                "data": []
            }, "dataValues");
        });

        it("should start sync project data if the currentUser and previousUsers are admin and non-admin users", function () {
            userPreferenceRepository.getCurrentUsersProjectIds.and.returnValue(utils.getPromise(q, ['id5']));

            scope.username = "ss153";
            scope.password = "password";

            userRepository.getUserCredentials.and.returnValue(utils.getPromise(q, {
                "username": "ss153",
                "password": "5f4dcc3b5aa765d61d8327deb882cf99",
                "userRoles": [{
                    "name": "Project Level Approver"
                }]
            }));

            var previousUser = {
                "id": "xYRvx4y7Gm9",
                "userCredentials": {
                    "username": "superadmin",
                    "userRoles": [{
                        "name": "Superadmin"
                    }]
                },
                "organisationUnits": [{
                    "id": 123
                }]
            };

            var currentUser = {
                "id": "xYRvx4y7Gm8",
                "userCredentials": {
                    "username": "ss153",
                    "userRoles": [{
                        "name": "Project Level Approver"
                    }]
                },
                "organisationUnits": [{
                    "id": 123
                }]
            };

            userRepository.getUser.and.returnValues(previousUser, currentUser);
            scope.login();
            scope.$apply();

            expect(hustle.publishOnce).toHaveBeenCalledWith({
                "type": "downloadProjectData",
                "data": []
            }, "dataValues");
        });

        it("should refresh translations after login", function () {
            scope.username = "projectadmin";
            scope.password = "password";

            userRepository.getUserCredentials.and.returnValue(utils.getPromise(q, {
                "username": "projectadmin",
                "password": "5f4dcc3b5aa765d61d8327deb882cf99",
                "userRoles": [{
                    "name": "Projectadmin"
                }]
            }));

            rootScope.hasRoles.and.returnValue(true);
            rootScope.setLocale = jasmine.createSpy('setLocale');

            scope.login();
            scope.$apply();

            expect(rootScope.setLocale).toHaveBeenCalledWith("en");
        });
    });
});
