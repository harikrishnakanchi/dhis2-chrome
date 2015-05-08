define(["mainController", "angularMocks", "utils", "metadataImporter", "sessionHelper", "chromeUtils"],
    function(MainController, mocks, utils, MetadataImporter, SessionHelper, chromeUtils) {
        describe("main controller", function() {
            var rootScope, mainController, scope, httpResponse, q, i18nResourceBundle, getResourceBundleSpy, db, frenchResourceBundle,
                translationStore, location, metadataImporter, sessionHelper;

            beforeEach(mocks.inject(function($rootScope, $q, $location) {
                scope = $rootScope.$new();
                q = $q;
                rootScope = $rootScope;

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
                spyOn(sessionHelper, "login").and.returnValue(utils.getPromise(q, {}));

                spyOn(translationStore, "each").and.returnValue(utils.getPromise(q, {}));
                spyOn(db, 'objectStore').and.callFake(function(storeName) {
                    return translationStore;
                });

                spyOn(metadataImporter, "run").and.returnValue(utils.getPromise(q, {}));

                mainController = new MainController(q, scope, location, rootScope, i18nResourceBundle, db, metadataImporter, sessionHelper);
            }));

            it("should import metadata", function() {
                mainController = new MainController(q, scope, location, rootScope, i18nResourceBundle, db, metadataImporter, sessionHelper);
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
            });

            it("should redirect to product key page", function() {
                spyOn(location, "path");

                chromeUtils.getAuthHeader.and.callFake(function(callBack) {
                    callBack({});
                });

                mainController = new MainController(q, scope, location, rootScope, i18nResourceBundle, db, metadataImporter, sessionHelper);

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
                rootScope.currentUser = {
                    "userCredentials": {
                        "username": "username"
                    },
                    "organisationUnits": [{
                        "id": "prj1"
                    }],
                    "selectedProject": {
                        "id": "prj1"
                    }
                };

                scope.$apply();
                rootScope.$apply();

                expect(scope.projects).toEqual(rootScope.currentUser.organisationUnits);
                expect(scope.selectedProject).toEqual({
                    "id": "prj1"
                });
                expect(rootScope.currentUser.selectedProject).toEqual({
                    "id": "prj1"
                });
            });
        });
    });
