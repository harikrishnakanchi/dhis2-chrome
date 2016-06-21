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
            it('should return modules for current user', function() {
                var userPreference = {
                    username: 'someUsername',
                    lastUpdated: moment('2016-06-01').toISOString(),
                    organisationUnits: [{
                        id: 'someProjectId'
                    }]
                }, modules = [{
                    'id': 'someModuleId'
                }];
                mockStore.getAll.and.returnValue(utils.getPromise(q, [userPreference]));
                orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, modules));

                var result;
                userPreferenceRepository.getCurrentUsersModules().then(function(repositoryResponse) {
                    result = repositoryResponse;
                });
                scope.$apply();

                expect(orgUnitRepository.getAllModulesInOrgUnits).toHaveBeenCalledWith(_.pluck(userPreference.organisationUnits, 'id'));
                expect(result).toEqual(modules);
            });
        });

        describe('getCurrentUsersOriginOrgUnitIds', function() {
            it('should return all patient origin org units for current user', function() {
                var modules = [{
                    'id': 'someModuleId'
                }], originOrgUnits = [{
                    'id': 'someOriginId'
                }];

                orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, modules));
                orgUnitRepository.findAllByParent.and.returnValue(utils.getPromise(q, originOrgUnits));

                var result;
                userPreferenceRepository.getCurrentUsersOriginOrgUnitIds().then(function(repositoryResponse) {
                    result = repositoryResponse;
                });
                scope.$apply();

                expect(orgUnitRepository.findAllByParent).toHaveBeenCalledWith(_.pluck(modules, 'id'));
                expect(result).toEqual(_.pluck(originOrgUnits, 'id'));
            });
        });

        describe('getCurrentUserPreferences', function() {
            it('should return most recently updated user preference', function() {
                var userPreferenceA = {
                    username: 'someUsername',
                    lastUpdated: moment('2016-06-01').toISOString()
                }, userPreferenceB = {
                    username: 'someOtherUsername',
                    lastUpdated: moment('2016-06-08').toISOString()
                };
                mockStore.getAll.and.returnValue(utils.getPromise(q, [userPreferenceA, userPreferenceB]));

                var result;
                userPreferenceRepository.getCurrentUsersPreferences().then(function(repositoryResponse) {
                    result = repositoryResponse;
                });
                scope.$apply();

                expect(result).toEqual(userPreferenceB);
            });

            it('should return null if no user preferences exist', function() {
                mockStore.getAll.and.returnValue(utils.getPromise(q, []));

                var result;
                userPreferenceRepository.getCurrentUsersPreferences().then(function(repositoryResponse) {
                    result = repositoryResponse;
                });
                scope.$apply();

                expect(result).toBeNull();
            });

            it('should ignore user preferences whose lastUpdated value is an empty string', function() {
                var userPreference = {
                    username: 'someOtherUsername',
                    lastUpdated: ''
                };
                mockStore.getAll.and.returnValue(utils.getPromise(q, [userPreference]));

                var result;
                userPreferenceRepository.getCurrentUsersPreferences().then(function(repositoryResponse) {
                    result = repositoryResponse;
                });
                scope.$apply();

                expect(result).toBeNull();
            });

            it('should ignore user preferences that do not have a lastUpdated value', function() {
                var userPreference = {
                    username: 'someOtherUsername'
                };
                mockStore.getAll.and.returnValue(utils.getPromise(q, [userPreference]));

                var result;
                userPreferenceRepository.getCurrentUsersPreferences().then(function(repositoryResponse) {
                    result = repositoryResponse;
                });
                scope.$apply();

                expect(result).toBeNull();
            });
        });

        describe('getCurrentUsersProjectIds', function() {
            it('should return organisation unit ids of current user', function() {
                var userPreference = {
                    username: 'someUsername',
                    lastUpdated: moment('2016-06-01').toISOString(),
                    organisationUnits: [{
                        id: 'someProjectId'
                    }]
                };
                mockStore.getAll.and.returnValue(utils.getPromise(q, [userPreference]));

                var result;
                userPreferenceRepository.getCurrentUsersProjectIds().then(function(repositoryResponse) {
                    result = repositoryResponse;
                });
                scope.$apply();

                expect(result).toEqual(_.pluck(userPreference.organisationUnits, 'id'));
            });

            it('should return empty array if no user preferences exist', function() {
                mockStore.getAll.and.returnValue(utils.getPromise(q, []));

                var result;
                userPreferenceRepository.getCurrentUsersProjectIds().then(function(repositoryResponse) {
                    result = repositoryResponse;
                });
                scope.$apply();

                expect(result).toEqual([]);
            });

            it('should return empty array if user preference has no organisation units', function() {
                var userPreference = {
                    username: 'someUsername',
                    lastUpdated: moment('2016-06-01').toISOString()
                };
                mockStore.getAll.and.returnValue(utils.getPromise(q, [userPreference]));

                var result;
                userPreferenceRepository.getCurrentUsersProjectIds().then(function(repositoryResponse) {
                    result = repositoryResponse;
                });
                scope.$apply();

                expect(result).toEqual([]);
            });
        });

        describe('getCurrentUsersUsername', function() {
            it('should return username of current user', function() {
                var userPreference = {
                    username: 'someUsername',
                    lastUpdated: moment('2016-06-01').toISOString()
                };
                mockStore.getAll.and.returnValue(utils.getPromise(q, [userPreference]));

                var result;
                userPreferenceRepository.getCurrentUsersUsername().then(function(repositoryResponse) {
                    result = repositoryResponse;
                });
                scope.$apply();

                expect(result).toEqual(userPreference.username);
            });

            it('should return null if no user preferences exists', function() {
                mockStore.getAll.and.returnValue(utils.getPromise(q, []));

                var result;
                userPreferenceRepository.getCurrentUsersUsername().then(function(repositoryResponse) {
                    result = repositoryResponse;
                });
                scope.$apply();

                expect(result).toBeNull();
            });
        });

        describe('getCurrentUsersLineListOriginOrgUnitIds', function() {
            it('should return all patient linelist origin org units for the current user', function() {
                var modules = [{
                    'id': 'someLineListModuleId',
                    "attributeValues": [{
                        "attribute": {
                            "code": "isLineListService"
                        },
                        "value": "true"
                    }]
                }, {
                    'id': 'someAggregateModuleId',
                    "attributeValues": [{
                        "attribute": {
                            "code": "isLineListService"
                        },
                        "value": "false"
                    }]
                }], originOrgUnits = [{
                    'id': 'someOriginId'
                }];

                orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, modules));
                orgUnitRepository.findAllByParent.and.returnValue(utils.getPromise(q, originOrgUnits));

                var result;

                userPreferenceRepository.getCurrentUsersLineListOriginOrgUnitIds().then(function(repositoryResponse) {
                    result = repositoryResponse;
                });
                scope.$apply();

                expect(orgUnitRepository.findAllByParent).toHaveBeenCalledWith(['someLineListModuleId']);
                expect(result).toEqual(_.pluck(originOrgUnits, 'id'));
            });
        });

    });
});
