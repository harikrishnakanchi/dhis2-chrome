define(["sessionHelper", "angularMocks", "utils", "userPreferenceRepository", "orgUnitRepository"],
    function(SessionHelper, mocks, utils, UserPreferenceRepository, OrgUnitRepository) {
        describe("session helper", function() {
            var rootScope, q, userPreferenceRepository, user, orgUnitRepository;

            beforeEach(mocks.inject(function($rootScope, $q) {
                rootScope = $rootScope;
                q = $q;

                rootScope.hasRoles = jasmine.createSpy("hasRoles").and.returnValue(true);

                userPreferenceRepository = new UserPreferenceRepository();
                spyOn(userPreferenceRepository, "get").and.returnValue(utils.getPromise(q, {}));
                spyOn(userPreferenceRepository, "save").and.returnValue(utils.getPromise(q, {}));

                orgUnitRepository = new OrgUnitRepository();
                spyOn(orgUnitRepository, "findAllByParent").and.returnValue(utils.getPromise(q, []));

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

                sessionHelper = new SessionHelper(rootScope, q, userPreferenceRepository, orgUnitRepository);
            }));

            it("should logout user, save user preferences and invalidate session", function() {
                rootScope.currentUser = {
                    "userCredentials": user.userCredentials,
                    "locale": "en",
                    "orgunits": [],
                    "selectedProject": undefined
                };
                rootScope.isLoggedIn = true;

                sessionHelper.logout();
                rootScope.$apply();

                expect(userPreferenceRepository.save).toHaveBeenCalled();
                expect(rootScope.currentUser).toBeUndefined();
                expect(rootScope.isLoggedIn).toBeFalsy();
            });

            it("should login user and load session with default locale 'en' if user is logging in for first time", function() {
                var expectedUser = {
                    "userCredentials": user.userCredentials,
                    "locale": "en",
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
                    "locale": "en",
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
                    "locale": "en",
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

            it("should save session state", function() {
                rootScope.currentUser = user;
                rootScope.currentUser.locale = "en";
                rootScope.$apply();

                sessionHelper.saveSessionState();

                var expectedState = {
                    "username": "coordination@approver.level",
                    "locale": "en",
                    "organisationUnits": [{
                        "id": 123,
                        "name": "Some Country"
                    }],
                    "selectedProject": undefined
                };

                expect(userPreferenceRepository.save).toHaveBeenCalledWith(expectedState);
            });
        });
    });
