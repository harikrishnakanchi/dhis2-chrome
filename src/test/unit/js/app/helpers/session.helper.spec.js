define(["sessionHelper", "angularMocks", "utils", "userPreferenceRepository", "orgUnitRepository", "moment", "storageService"],
    function(SessionHelper, mocks, utils, UserPreferenceRepository, OrgUnitRepository, moment, StorageService) {
        describe("session helper", function() {
            var rootScope, q, location, userPreferenceRepository, user, orgUnitRepository,
                currentTime, sessionHelper, storageService;

            beforeEach(mocks.inject(function($rootScope, $q, $location) {
                rootScope = $rootScope;
                q = $q;
                location = $location;

                rootScope.hasRoles = jasmine.createSpy("hasRoles").and.returnValue(true);

                userPreferenceRepository = new UserPreferenceRepository();
                spyOn(userPreferenceRepository, "get").and.returnValue(utils.getPromise(q, {}));
                spyOn(userPreferenceRepository, "save").and.returnValue(utils.getPromise(q, {}));

                orgUnitRepository = new OrgUnitRepository();
                spyOn(orgUnitRepository, "findAllByParent").and.returnValue(utils.getPromise(q, []));

                storageService = new StorageService();
                spyOn(storageService, 'clear');

                user = {
                    "id": "xYRvx4y7Gm9",
                    "userCredentials": {
                        "disabled": false,
                        "username": "coordination@approver.level",
                        "userRoles": [{
                            "name": "Coordination Level Approver"
                        }]
                    },
                    "organisationUnits": [{
                        "id": 123,
                        "name": "Some Country"
                    }]
                };

                sessionHelper = new SessionHelper(rootScope, q, userPreferenceRepository, orgUnitRepository, location, storageService);

                currentTime = moment().toISOString();
                Timecop.install();
                Timecop.freeze(currentTime);
            }));

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            it("should logout user, save user preferences, clear sessionStorage and invalidate session", function() {
                rootScope.locale = "en";
                rootScope.currentUser = {
                    "userCredentials": user.userCredentials,
                    "orgunits": [],
                    "selectedProject": undefined
                };
                rootScope.isLoggedIn = true;

                sessionHelper.logout();
                rootScope.$apply();

                expect(userPreferenceRepository.save).toHaveBeenCalled();
                expect(rootScope.currentUser).toBeUndefined();
                expect(rootScope.isLoggedIn).toBeFalsy();
                expect(storageService.clear).toHaveBeenCalled();
            });

            it("should login user and load session with default locale 'en' if user is logging in for first time", function() {
                var expectedUser = {
                    "userCredentials": user.userCredentials,
                    "organisationUnits": [],
                    "selectedProject": undefined
                };

                userPreferenceRepository.get.and.returnValue(utils.getPromise(q, undefined));

                sessionHelper.login(user);
                rootScope.$apply();

                expect(rootScope.isLoggedIn).toBeTruthy();
                expect(rootScope.currentUser).toEqual(expectedUser);
                expect(userPreferenceRepository.save).toHaveBeenCalled();
            });

            it("should login user and load session with default orgunits as Country's projects if user (coordination approver) is logging in for first time", function() {
                var projects = [{
                    "id": "P1",
                    "name": "Project1",
                    "parent": {
                        "id": 123,
                        "name": "Some Country"
                    }
                }];

                var expectedUser = {
                    "userCredentials": user.userCredentials,
                    "organisationUnits": projects,
                    "selectedProject": projects[0]
                };

                orgUnitRepository.findAllByParent.and.returnValue(utils.getPromise(q, projects));
                userPreferenceRepository.get.and.returnValue(utils.getPromise(q, undefined));

                sessionHelper.login(user);
                rootScope.$apply();

                expect(rootScope.isLoggedIn).toBeTruthy();
                expect(rootScope.currentUser).toEqual(expectedUser);
                expect(userPreferenceRepository.save).toHaveBeenCalled();
            });

            it("should login user and load session with default orgunits as user's assigned orgunits if user (other roles) is logging in for first time", function() {
                user.organisationUnits = [{
                    "id": "P1",
                    "name": "Project1"
                }];

                var expectedUser = {
                    "userCredentials": user.userCredentials,
                    "organisationUnits": user.organisationUnits,
                    "selectedProject": user.organisationUnits[0]
                };

                rootScope.hasRoles.and.returnValue(false);
                userPreferenceRepository.get.and.returnValue(utils.getPromise(q, undefined));

                sessionHelper.login(user);
                rootScope.$apply();

                expect(rootScope.isLoggedIn).toBeTruthy();
                expect(rootScope.currentUser).toEqual(expectedUser);
                expect(userPreferenceRepository.save).toHaveBeenCalled();
            });

            it("should login projectadmin user and load orgUnits from userpreferences as user's organisationUnits", function() {
                user.organisationUnits = undefined;
                user.userCredentials.username = "projectadmin";

                var orgUnit = {
                    "id": 123,
                    "name": "Some Country"
                };

                var preferences = {
                    "locale" : "en",
                    "organisationUnits": [orgUnit],
                    "selectedProject": orgUnit
                };

                var expectedUser = {
                    "userCredentials": user.userCredentials,
                    "organisationUnits": preferences.organisationUnits,
                    "selectedProject": orgUnit
                };

                rootScope.hasRoles.and.returnValues(false, true);
                userPreferenceRepository.get.and.returnValue(utils.getPromise(q, preferences));

                sessionHelper.login(user);
                rootScope.$apply();

                expect(rootScope.currentUser).toEqual(expectedUser);
                expect(userPreferenceRepository.get).toHaveBeenCalled();
            });

            it("should save session state", function() {
                rootScope.currentUser = user;
                rootScope.locale = "en";
                rootScope.$apply();

                sessionHelper.saveSessionState();

                var expectedState = {
                    "username": "coordination@approver.level",
                    "organisationUnits": [{
                        "id": 123,
                        "name": "Some Country"
                    }],
                    "selectedProject": undefined,
                    "lastUpdated": currentTime,
                    "userRoles": [{ name: 'Coordination Level Approver' }]
                };

                expect(userPreferenceRepository.save).toHaveBeenCalledWith(expectedState);
            });
        });
    });
