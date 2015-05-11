define(["userPreferenceRepository", "angularMocks", "utils", "orgUnitRepository"], function(UserPreferenceRepository, mocks, utils, OrgUnitRepository) {
    describe("User Preference repository", function() {
        var db, mockStore, q, scope, orgUnitRepository;

        beforeEach(mocks.inject(function($q, $rootScope) {
            var mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;
            scope = $rootScope.$new();
            q = $q;

            orgUnitRepository = new OrgUnitRepository();
            spyOn(orgUnitRepository, "getAllModulesInOrgUnits").and.returnValue(utils.getPromise(q, ["mod1"]));

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

        it("should get all user preferences", function() {
            var allPrefs = [{
                "username": "blah"
            }];
            mockStore.getAll.and.returnValue(utils.getPromise(q, allPrefs));
            userPreferenceRepository.getAll().then(function(data) {
                expect(data).toEqual(allPrefs);
            });
            scope.$apply();
            expect(mockStore.getAll).toHaveBeenCalled();
        });

        it("should get all modules id", function() {
            var userPrefs = [{
                "username": "msfadmin",
                "locale": "en",
                "organisationUnits": []
            }, {
                "username": "new_user",
                "locale": "en",
                "organisationUnits": [{
                    "id": "proj1"
                }]
            }, {
                "username": "new2_user",
                "locale": "en",
                "organisationUnits": [{
                    "id": "proj2"
                }]
            }];

            orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, [{
                "id": "mod1"
            }, {
                "id": "mod2"
            }, {
                "id": "mod3"
            }]));

            mockStore.getAll.and.returnValue(utils.getPromise(q, userPrefs));

            var actualUserModules;
            userPreferenceRepository.getUserModuleIds().then(function(data) {
                actualUserModules = data;
            });

            scope.$apply();
            expect(orgUnitRepository.getAllModulesInOrgUnits).toHaveBeenCalledWith(['proj1', 'proj2']);
            expect(actualUserModules).toEqual(["mod1", "mod2", "mod3"]);
        });

        it("should get all patient origin org units for user's modules", function() {
            var originOrgUnits = [{
                "id": "o1",
                "name": "o1"
            }, {
                "id": "o2",
                "name": "o2"
            }];

            spyOn(userPreferenceRepository, "getUserModuleIds").and.returnValue(utils.getPromise(q, []));
            orgUnitRepository.findAllByParent = jasmine.createSpy("findAllByParent").and.returnValue(utils.getPromise(q, originOrgUnits));

            var expectedResults = ["o1", "o2"];
            var actualResult;

            userPreferenceRepository.getOriginOrgUnitIds().then(function(data) {
                actualResult = data;
            });

            scope.$apply();
            expect(actualResult).toEqual(expectedResults);
        });
    });
});
