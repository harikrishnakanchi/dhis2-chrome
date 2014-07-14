define(["selectProjectController", "angularMocks", "orgUnitRepository", "userRepository", "userPreferenceRepository", "utils"],
    function(SelectProjectController, mocks, OrgUnitRepository, UserRepository, UserPreferenceRepository, utils) {
        describe("select project controller", function() {
            var q, scope, selectProjectController, location, rootScope, orgUnitRepository, userRepository, userPreferenceRepository;
            beforeEach(mocks.inject(function($httpBackend, $rootScope, $location, $q) {
                orgUnitRepository = new OrgUnitRepository();
                userRepository = new UserRepository();
                userPreferenceRepository = new UserPreferenceRepository();
                scope = $rootScope.$new();
                location = $location;
                rootScope = $rootScope;
                q = $q;
                spyOn(orgUnitRepository, "getAllProjects").and.returnValue(utils.getPromise(q, [{
                    "id": 123
                }]));
                selectProjectController = new SelectProjectController(scope, location, rootScope, orgUnitRepository, userRepository, userPreferenceRepository);
                scope.project = {
                    "id": 123,
                    "name": "someProj"
                };
                rootScope.currentUser = {
                    "userCredentials": {
                        "username": "abcd"
                    },
                    "locale": "en",
                    "organisationUnits": []
                };

            }));

            it("should save user and preferences when project is updated", function() {
                spyOn(userRepository, "upsert").and.returnValue(utils.getPromise(q, {}));
                spyOn(userPreferenceRepository, "save");

                scope.save();
                rootScope.$apply();

                expect(userRepository.upsert).toHaveBeenCalledWith(rootScope.currentUser);
                expect(userPreferenceRepository.save).toHaveBeenCalledWith({
                    "username": "abcd",
                    "locale": "en",
                    "orgUnits": [scope.project]
                });
                expect(location.path()).toEqual("/dashboard");
            });

            it("should show error message if updating the user fails", function() {
                spyOn(userRepository, "upsert").and.returnValue(utils.getRejectedPromise(q, {}));
                spyOn(userPreferenceRepository, "save");

                scope.save();
                rootScope.$apply();

                expect(userPreferenceRepository.save).not.toHaveBeenCalled();
                expect(scope.saveFailed).toBeTruthy();
            });

            it("should be able to skip to dashboard", function() {
                scope.skip();
                expect(location.path()).toEqual("/dashboard");
            });
        });
    });