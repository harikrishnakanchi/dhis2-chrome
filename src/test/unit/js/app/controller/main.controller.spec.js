define(["mainController", "angularMocks", "utils", "userPreferenceRepository", "orgUnitRepository", "userRepository", "metadataImporter", "sessionHelper", "chromeUtils"],
    function(MainController, mocks, utils, UserPreferenceRepository, OrgUnitRepository, UserRepository, MetadataImporter, SessionHelper, chromeUtils) {
        describe("main controller", function() {
            var rootScope, mainController, scope, httpResponse, q, i18nResourceBundle, getResourceBundleSpy, getAllProjectsSpy, db,
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

                mainController = new MainController(q, scope, location, rootScope, i18nResourceBundle, db, userPreferenceRepository, orgUnitRepository,
                    userRepository, metadataImporter, sessionHelper);
            }));

            it("should load projects", function() {
                var projectList = [{
                    "blah": "moreBlah"
                }];

                getAllProjectsSpy.and.returnValue(utils.getPromise(q, projectList));
                mainController = new MainController(q, scope, location, rootScope, i18nResourceBundle, db, userPreferenceRepository, orgUnitRepository,
                    userRepository, metadataImporter, sessionHelper);
                scope.$apply();

                expect(metadataImporter.run).toHaveBeenCalled();
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
                spyOn(userPreferenceRepository, "get").and.returnValue(utils.getPromise(q, {
                    'orgUnits': [{
                        'id': 111
                    }]
                }));
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
                spyOn(userPreferenceRepository, "get").and.returnValue(utils.getPromise(q, {
                    'orgUnits': [{
                        'id': "123"
                    }]
                }));

                scope.saveUser();
                scope.$apply();

                expect(userRepository.upsert).toHaveBeenCalledWith(rootScope.currentUser);
                expect(rootScope.currentUser.organisationUnits).toEqual([current]);
                expect(userPreferenceRepository.save).toHaveBeenCalledWith({
                    "username": '1',
                    "locale": "en",
                    "orgUnits": [current]
                });
                expect(scope.currentUserProject).toEqual({
                    id: '123'
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
        });
    });
