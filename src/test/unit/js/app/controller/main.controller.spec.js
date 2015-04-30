define(["mainController", "angularMocks", "utils", "userPreferenceRepository", "orgUnitRepository", "userRepository", "metadataImporter", "sessionHelper", "chromeUtils"],
    function(MainController, mocks, utils, UserPreferenceRepository, OrgUnitRepository, UserRepository, MetadataImporter, SessionHelper, chromeUtils) {
        describe("main controller", function() {
            var rootScope, mainController, scope, httpResponse, q, i18nResourceBundle, getResourceBundleSpy, getAllProjectsSpy, db, frenchResourceBundle,
                translationStore, userPreferenceRepository, location, orgUnitRepository, userRepository, metadataImporter, sessionHelper;

            beforeEach(mocks.inject(function($rootScope, $q, $location) {
                scope = $rootScope.$new();
                q = $q;
                rootScope = $rootScope;
                userPreferenceRepository = new UserPreferenceRepository();
                orgUnitRepository = new OrgUnitRepository();
                userRepository = new UserRepository();
                metadataImporter = new MetadataImporter();
                sessionHelper = new SessionHelper();

                spyOn(chromeUtils, "getAuthHeader").and.callFake(function(callBack) {
                    callBack({
                        "auth_header": "Basic Auth"
                    });
                });

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

                spyOn(metadataImporter, "run").and.returnValue(utils.getPromise(q, {}));
                getAllProjectsSpy = spyOn(orgUnitRepository, "getAllProjects");
                getAllProjectsSpy.and.returnValue(utils.getPromise(q, []));

                spyOn(userPreferenceRepository, "save");
                spyOn(userPreferenceRepository, "get").and.returnValue(utils.getPromise(q, {
                    'orgUnits': [{
                        'id': 111
                    }],
                    'selectedProject': {
                        'id': 111
                    }
                }));
                spyOn(orgUnitRepository, "getAll").and.returnValue(utils.getPromise(q, []));
                spyOn(orgUnitRepository, "findAllByParent").and.returnValue(utils.getPromise(q, []));

                mainController = new MainController(q, scope, location, rootScope, i18nResourceBundle, db, userPreferenceRepository, orgUnitRepository,
                    userRepository, metadataImporter, sessionHelper);
            }));

            it("should import metadata", function() {
                mainController = new MainController(q, scope, location, rootScope, i18nResourceBundle, db, userPreferenceRepository, orgUnitRepository,
                    userRepository, metadataImporter, sessionHelper);
                scope.$apply();

                expect(metadataImporter.run).toHaveBeenCalled();
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
                    }],
                    "selectedProject": {
                        "id": "prj1"
                    }
                };
                rootScope.currentUser.locale = "fr";

                frenchResourceBundle = {
                    "data": {
                        "login": "french"
                    }
                };
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
                    }],
                    "selectedProject": {
                        "id": "prj1"
                    }
                });
            });

            it("should redirect to product key page", function() {
                spyOn(location, "path");

                chromeUtils.getAuthHeader.and.callFake(function(callBack) {
                    callBack({});
                });

                mainController = new MainController(q, scope, location, rootScope, i18nResourceBundle, db, userPreferenceRepository, orgUnitRepository,
                    userRepository, metadataImporter, sessionHelper);

                scope.$apply();

                expect(location.path).toHaveBeenCalledWith("/productKeyPage");
            });

            it("should set auth header on local storage", function() {
                spyOn(location, "path");

                scope.$apply();

                expect(rootScope.auth_header).toEqual("Basic Auth");
                expect(location.path).toHaveBeenCalledWith("/login");
            });

            it("should reset projects on current user's org units changes", function() {
                var projects = [{
                    "id": "prj1"
                }, {
                    "id": "prj2"
                }];

                rootScope.currentUser = {
                    "userCredentials": {
                        "username": "username"
                    },
                    "organisationUnits": [{
                        "id": "someOrgUnit"
                    }]
                };

                orgUnitRepository.findAllByParent.and.returnValue(utils.getPromise(q, projects));
                scope.$apply();
                rootScope.$apply();

                expect(scope.projects).toEqual(projects);
                expect(scope.selectedProject).toEqual(projects[0]);
                expect(rootScope.currentUser.selectedProject).toEqual(projects[0]);
            });
        });
    });
