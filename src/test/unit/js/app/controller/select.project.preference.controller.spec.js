define(["selectProjectPreferenceController", "angularMocks", "utils", "lodash", "orgUnitRepository", "userPreferenceRepository"],
    function(SelectProjectPreferenceController, mocks, utils, _, OrgUnitRepository, UserPreferenceRepository) {
        describe("referral locations controller", function() {
            var scope, allProjects, rootScope, hustle, location, userPreferenceRepository, orgUnitRepository, userPreference, q;

            beforeEach(module("hustle"));
            beforeEach(mocks.inject(function($rootScope, $q, $hustle, $location) {
                scope = $rootScope.$new();
                hustle = $hustle;
                rootScope = $rootScope;
                location = $location;
                q = $q;

                allProjects = [{
                    "id": "1",
                    "name": "zeg"
                }, {
                    "id": "2",
                    "name": "abc"
                }];

                rootScope.currentUser = {
                    "firstName": "test1",
                    "lastName": "test1last",
                    "locale": "en",
                    "userCredentials": {
                        "username": "dataentryuser",
                        "userRoles": [{
                            "id": "hxNB8lleCsl",
                            "name": 'Superuser'
                        }, {
                            "id": "hxNB8lleCsl",
                            "name": 'blah'
                        }]
                    },
                    "organisationUnits": [{
                        "id": "proj_1",
                        "name": "MISSIONS EXPLOS"
                    }, {
                        "id": "test1",
                        "name": "MISSIONS EXPLOS123"
                    }, {
                        "id": "test2",
                        "name": "MISSIONS EXPLOS345"
                    }]
                };

                userPreference = {
                    "organisationUnits": [],
                    "selectedProject": {}
                };

                userPreferenceRepository = new UserPreferenceRepository();
                spyOn(userPreferenceRepository, "get").and.returnValue(utils.getPromise(q, userPreference));
                spyOn(userPreferenceRepository, "save").and.returnValue(utils.getPromise(q, {}));

                orgUnitRepository = new OrgUnitRepository();
                spyOn(orgUnitRepository, "getAllProjects").and.returnValue(utils.getPromise(q, allProjects));
                selectProjectPreferenceController = new SelectProjectPreferenceController(rootScope, scope, hustle, location, orgUnitRepository, userPreferenceRepository);
            }));

            it("should save the selected project", function() {
                scope.selectedProject = {
                    "originalObject": {
                        "id": 1,
                        "name": "Test Project"
                    }
                };

                var sortedProjects = [{
                    "id": "2",
                    "name": "abc"
                }, {
                    "id": "1",
                    "name": "zeg"
                }];

                scope.savePreference();

                scope.$apply();

                expect(scope.allProjects).toEqual(sortedProjects);
                expect(rootScope.currentUser.selectedProject).toEqual({
                    "id": 1,
                    "name": "Test Project"
                });

            });
        });
    });
