define(["mainController", "angularMocks", "utils", "userPreferenceRepository", "orgUnitRepository", "userRepository", "metadataService", "sessionHelper"],
    function(MainController, mocks, utils, UserPreferenceRepository, OrgUnitRepository, UserRepository, MetadataService, SessionHelper) {
        describe("main controller", function() {
            var rootScope, mainController, scope, httpResponse, q, i18nResourceBundle, getResourceBundleSpy, getAllProjectsSpy, db,
                translationStore, userPreferenceRepository, location, orgUnitRepository, userRepository, metadataService, sessionHelper;

            beforeEach(mocks.inject(function($rootScope, $q, $location) {
                scope = $rootScope.$new();
                q = $q;
                rootScope = $rootScope;
                userPreferenceRepository = new UserPreferenceRepository();
                orgUnitRepository = new OrgUnitRepository();
                userRepository = new UserRepository();
                metadataService = new MetadataService();
                sessionHelper = new SessionHelper();

                i18nResourceBundle = {
                    get: function() {}
                };

                var queryBuilder = function() {
                    this.$index = function() {
                        return this;
                    };
                    this.$eq = function(v) {
                        return this;
                    };
                    this.compile = function() {
                        return "blah";
                    };
                    return this;
                };
                db = {
                    "objectStore": function() {},
                    "queryBuilder": queryBuilder
                };
                location = $location;

                var getMockStore = function(data) {
                    var upsert = function() {};
                    var find = function() {};
                    var each = function() {};

                    return {
                        upsert: upsert,
                        find: find,
                        each: each,
                    };
                };

                getResourceBundleSpy = spyOn(i18nResourceBundle, "get");
                getResourceBundleSpy.and.returnValue(utils.getPromise(q, {
                    "data": {}
                }));

                translationStore = getMockStore("translations");

                spyOn(sessionHelper, "logout");
                spyOn(translationStore, "each").and.returnValue(utils.getPromise(q, {}));
                spyOn(db, 'objectStore').and.callFake(function(storeName) {
                    return translationStore;
                });

                spyOn(metadataService, "loadMetadataFromFile").and.returnValue(utils.getPromise(q, {}));
                getAllProjectsSpy = spyOn(orgUnitRepository, "getAllProjects");
                getAllProjectsSpy.and.returnValue(utils.getPromise(q, []));

                mainController = new MainController(scope, location, rootScope, i18nResourceBundle, db, userPreferenceRepository, orgUnitRepository,
                    userRepository, metadataService, sessionHelper);
            }));

            it("should load projects", function() {
                var projectList = [{
                    "blah": "moreBlah"
                }];

                getAllProjectsSpy.and.returnValue(utils.getPromise(q, projectList));
                mainController = new MainController(scope, location, rootScope, i18nResourceBundle, db, userPreferenceRepository, orgUnitRepository,
                    userRepository, metadataService, sessionHelper);
                scope.$apply();

                expect(metadataService.loadMetadataFromFile).toHaveBeenCalled();
                expect(scope.projects).toEqual(projectList);
            });

            it("should logout user", function() {
                scope.logout();

                expect(sessionHelper.logout).toHaveBeenCalled();
            });

            it("should default locale to en", function() {
                scope.$apply();

                expect(rootScope.resourceBundle).toEqual({});
            });

            it("should change resourceBundle if locale changes", function() {
                rootScope.currentUser = {
                    "userCredentials": {
                        "username": "1"
                    },
                    "organisationUnits": [{
                        "id": "123"
                    }]
                };
                rootScope.currentUser.locale = "fr";
                var frenchResourceBundle = {
                    "data": {
                        "login": "french"
                    }
                };
                spyOn(userPreferenceRepository, "save");
                spyOn(orgUnitRepository, "getAll").and.returnValue(utils.getPromise(q, []));
                getResourceBundleSpy.and.returnValue(utils.getPromise(q, frenchResourceBundle));

                scope.$apply();

                expect(i18nResourceBundle.get).toHaveBeenCalledWith({
                    "locale": "fr"
                });
                expect(rootScope.resourceBundle).toEqual(frenchResourceBundle.data);
                expect(userPreferenceRepository.save).toHaveBeenCalledWith({
                    "username": '1',
                    "locale": 'fr',
                    "orgUnits": [{
                        "id": '123'
                    }]
                });
            });

            it("should save user", function() {
                rootScope.currentUser = {
                    "userCredentials": {
                        "username": "1"
                    },
                    "locale": "en",
                    "organisationUnits": [{
                        "id": "123"
                    }]
                };
                var current = {
                    "id": 321,
                    "name": "Prj1"
                };
                var old = {
                    "id": "123"
                };

                scope.currentUserProject = current;
                scope.oldUserProject = old;

                var projectList = [current, old];
                getAllProjectsSpy.and.returnValue(utils.getPromise(q, projectList));

                spyOn(userRepository, "upsert").and.returnValue(utils.getPromise(q, {}));
                spyOn(userPreferenceRepository, "save");

                scope.saveUser();
                scope.$apply();

                expect(userRepository.upsert).toHaveBeenCalledWith(rootScope.currentUser);
                expect(rootScope.currentUser.organisationUnits).toEqual([current]);
                expect(userPreferenceRepository.save).toHaveBeenCalledWith({
                    "username": '1',
                    "locale": "en",
                    "orgUnits": [current]
                });
            });

            it("should not allow changing project if on selectproject page", function() {
                location.path("/selectproject");

                expect(scope.canChangeProject(true, true)).toBeFalsy();
            });

            it("should allow changing project if not on selectproject page", function() {
                location.path("/somethingelse");

                expect(scope.canChangeProject(true, true)).toBeTruthy();
            });

            it("should not allow changing project if not admin", function() {
                location.path("/somethingelse");

                expect(scope.canChangeProject(true, false)).toBeFalsy();
            });

            it("should not allow changing project if not loggedin", function() {
                location.path("/somethingelse");

                expect(scope.canChangeProject(false, true)).toBeFalsy();
            });
        });
    });
