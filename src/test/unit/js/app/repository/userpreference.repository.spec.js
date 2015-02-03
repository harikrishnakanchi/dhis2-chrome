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

        it("should get all modules id for logged in user", function() {
            var userPrefs = [{
                "orgUnits": [{
                    "id": "pro1Id",
                    "name": "Pro1"
                }, {
                    "id": "pro2Id",
                    "name": "Pro2"
                }]
            }, {
                "orgUnits": [{
                    "id": "pro3Id",
                    "name": "Pro3"
                }]
            }, {
                "orgUnits": [{
                    "id": "pro1Id",
                    "name": "Pro1"
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
            expect(actualUserModules).toEqual(["mod1", "mod2", "mod3"]);
        });
    });
});
