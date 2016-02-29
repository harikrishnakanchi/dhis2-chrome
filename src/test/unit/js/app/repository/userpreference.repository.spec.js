define(["userPreferenceRepository", "angularMocks", "utils", "moment", "orgUnitRepository"], function(UserPreferenceRepository, mocks, utils, moment, OrgUnitRepository) {
    describe("User Preference repository", function() {
        var db, mockStore, q, scope, orgUnitRepository, userPreferenceRepository;

        beforeEach(mocks.inject(function($q, $rootScope) {
            var mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;
            scope = $rootScope.$new();
            q = $q;

            orgUnitRepository = new OrgUnitRepository();
            spyOn(orgUnitRepository, "getAllModulesInOrgUnits");
            spyOn(orgUnitRepository, "getAllOpUnitsInOrgUnits");
            spyOn(orgUnitRepository, "findAllByParent");

            var userPrefs = [{
                "username": "new_user",
                "lastUpdated": moment("2015-08-24").toISOString(),
                "organisationUnits": [{
                    "id": "proj1"
                }]
            }];

            mockStore.getAll.and.returnValue(utils.getPromise(q, userPrefs));

            userPreferenceRepository = new UserPreferenceRepository(mockDB.db, orgUnitRepository);
        }));

        it("should get user preferences", function() {
            var pref = {
                "username": "blah"
            };
            mockStore.find.and.returnValue(utils.getPromise(q, pref));

            userPreferenceRepository.get("blah").then(function(data) {
                expect(data).toEqual(pref);
            });
            scope.$apply();

            expect(mockStore.find).toHaveBeenCalledWith("blah");
        });

        it("should save user preferences", function() {
            var userPreference = {
                "username": "user@user.com",
                "locale": "en",
                "organisationUnits": [{
                    "id": "123"
                }]
            };
            userPreferenceRepository.save(userPreference);

            expect(mockStore.upsert).toHaveBeenCalledWith(userPreference);
        });

        describe('getCurrentUsersModules', function() {
            it('should get current users modules', function() {
                var userModulesInRepo = [{
                    'id': 'mod1'
                }, {
                    'id': 'mod2'
                }, {
                    'id': 'mod3'
                }];
                orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, userModulesInRepo));

                var actualUserModules;
                userPreferenceRepository.getCurrentUsersModules().then(function(data) {
                    actualUserModules = data;
                });
                scope.$apply();

                expect(orgUnitRepository.getAllModulesInOrgUnits).toHaveBeenCalledWith(['proj1']);
                expect(actualUserModules).toEqual(userModulesInRepo);
            });
        });

        describe('getCurrentUsersOriginOrgUnitIds', function() {
            it('should get all patient origin org units for users modules', function() {
                var userModules = [{
                    'id': 'mod1'
                }, {
                    'id': 'mod2'
                }];

                var originOrgUnits = [{
                    'id': 'o1',
                    'name': 'o1'
                }, {
                    'id': 'o2',
                    'name': 'o2'
                }];

                orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, userModules));
                orgUnitRepository.findAllByParent.and.returnValue(utils.getPromise(q, originOrgUnits));

                var actualResult;
                userPreferenceRepository.getCurrentUsersOriginOrgUnitIds().then(function(data) {
                    actualResult = data;
                });
                scope.$apply();

                expect(orgUnitRepository.getAllModulesInOrgUnits).toHaveBeenCalledWith(['proj1']);
                expect(orgUnitRepository.findAllByParent).toHaveBeenCalledWith(['mod1', 'mod2']);
                expect(actualResult).toEqual(['o1', 'o2']);
            });
        });

        describe('getCurrentUsersProjectIds', function() {
            it('should get current user projects', function() {
                var userPrefs = [{
                    'username': 'msfadmin',
                    'lastUpdated': '',
                    'organisationUnits': []
                }, {
                    'username': 'new_user',
                    'lastUpdated': moment('2015-08-24').toISOString(),
                    'organisationUnits': [{
                        'id': 'proj1'
                    }]
                }, {
                    'username': 'new2_user',
                    'lastUpdated': moment('2015-08-23').toISOString(),
                    'organisationUnits': [{
                        'id': 'proj2'
                    }]
                }];

                mockStore.getAll.and.returnValue(utils.getPromise(q, userPrefs));
                var actualUserProjects;
                userPreferenceRepository.getCurrentUsersProjectIds().then(function(data) {
                    actualUserProjects = data;
                });
                scope.$apply();

                expect(actualUserProjects).toEqual(["proj1"]);
            });
        });
    });
});
