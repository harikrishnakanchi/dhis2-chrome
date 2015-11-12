define(["selectProjectPreferenceController", "angularMocks", "utils", "lodash", "orgUnitRepository", "userPreferenceRepository", "systemSettingRepository"],
    function(SelectProjectPreferenceController, mocks, utils, _, OrgUnitRepository, UserPreferenceRepository, SystemSettingRepository) {
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

                systemSettingRepository = new SystemSettingRepository();
                spyOn(systemSettingRepository, "getAllowedOrgUnits").and.returnValue([]);
                spyOn(systemSettingRepository, "getProductKeyLevel").and.returnValue("");

                orgUnitRepository = new OrgUnitRepository();
                spyOn(orgUnitRepository, "getAllProjects").and.returnValue(utils.getPromise(q, allProjects));
                spyOn(orgUnitRepository, "get").and.returnValue(utils.getPromise(q, {}));
                spyOn(orgUnitRepository, "findAllByParent").and.returnValue(utils.getPromise(q, {}));

                selectProjectPreferenceController = new SelectProjectPreferenceController(rootScope, scope, hustle, location, orgUnitRepository, userPreferenceRepository, systemSettingRepository);
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

            it("should call save preference when product key has just one project", function() {
                systemSettingRepository.getAllowedOrgUnits.and.returnValue([{
                    "id": "proj1",
                    "name": "project"
                }]);

                systemSettingRepository.getProductKeyLevel.and.returnValue("project");

                orgUnitRepository.get.and.returnValue(utils.getPromise(q, {
                    "id": "proj1",
                    "name": "project"
                }));

                selectProjectPreferenceController = new SelectProjectPreferenceController(rootScope, scope, hustle, location, orgUnitRepository, userPreferenceRepository, systemSettingRepository);

                scope.$apply();

                expect(userPreferenceRepository.save).toHaveBeenCalled();
                expect(scope.selectedProject.originalObject).toEqual({
                    "id": "proj1",
                    "name": "project"
                });
            });

            it("should call findAllByParent when product key is of country level", function() {
                systemSettingRepository.getAllowedOrgUnits.and.returnValue([{
                    "id": "country1",
                    "name": "country"
                }]);

                systemSettingRepository.getProductKeyLevel.and.returnValue("country");

                selectProjectPreferenceController = new SelectProjectPreferenceController(rootScope, scope, hustle, location, orgUnitRepository, userPreferenceRepository, systemSettingRepository);

                scope.$apply();

                expect(orgUnitRepository.findAllByParent).toHaveBeenCalled();

            });
        });
    });
