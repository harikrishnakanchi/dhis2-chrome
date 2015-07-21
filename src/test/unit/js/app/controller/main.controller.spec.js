define(["mainController", "angularMocks", "utils", "metadataImporter", "sessionHelper", "chromeUtils", "orgUnitRepository"],
    function(MainController, mocks, utils, MetadataImporter, SessionHelper, chromeUtils, OrgUnitRepository) {
        describe("main controller", function() {
            var rootScope, mainController, scope, httpResponse, q, i18nResourceBundle, getResourceBundleSpy, db, frenchResourceBundle,
                translationStore, location, metadataImporter, sessionHelper, orgUnitRepository, hustle;

            beforeEach(module('hustle'));
            beforeEach(mocks.inject(function($rootScope, $q, $location, $hustle) {
                scope = $rootScope.$new();
                q = $q;
                rootScope = $rootScope;
                hustle = $hustle;

                metadataImporter = new MetadataImporter();
                sessionHelper = new SessionHelper();
                orgUnitRepository = new OrgUnitRepository();

                spyOn(chromeUtils, "sendMessage");

                spyOn(orgUnitRepository, "getAllModulesInOrgUnits").and.returnValue(utils.getPromise(q, []));

                spyOn(chromeUtils, "getAuthHeader").and.callFake(function(callBack) {
                    callBack({
                        "authHeader": "Basic Auth"
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
                spyOn(sessionHelper, "saveSessionState");
                spyOn(sessionHelper, "login").and.returnValue(utils.getPromise(q, {}));

                spyOn(translationStore, "each").and.returnValue(utils.getPromise(q, {}));
                spyOn(db, 'objectStore').and.callFake(function(storeName) {
                    return translationStore;
                });

                spyOn(metadataImporter, "run").and.returnValue(utils.getPromise(q, {}));
                spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));

                mainController = new MainController(q, scope, location, rootScope, hustle, i18nResourceBundle, db, metadataImporter, sessionHelper, orgUnitRepository);
            }));

            it("should import metadata triggering db migrations in the process", function() {
                mainController = new MainController(q, scope, location, rootScope, hustle, i18nResourceBundle, db, metadataImporter, sessionHelper, orgUnitRepository);
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

            it("should redirect to product key page", function() {
                spyOn(location, "path");

                chromeUtils.getAuthHeader.and.callFake(function(callBack) {
                    callBack({});
                });

                mainController = new MainController(q, scope, location, rootScope, hustle, i18nResourceBundle, db, metadataImporter, sessionHelper, orgUnitRepository);

                scope.$apply();

                expect(location.path).toHaveBeenCalledWith("/productKeyPage");
            });

            it("should set auth header on local storage", function() {
                spyOn(location, "path");

                scope.$apply();

                expect(rootScope.authHeader).toEqual("Basic Auth");
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

                rootScope.$broadcast('userPreferencesUpdated');

                expect(scope.projects).toEqual(rootScope.currentUser.organisationUnits);
                expect(scope.selectedProject).toEqual({
                    "id": "prj1"
                });
                expect(rootScope.currentUser.selectedProject).toEqual({
                    "id": "prj1"
                });
            });

            it("should reset charts on current user's org units changes", function() {
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

                rootScope.$broadcast('userPreferencesUpdated');

                expect(hustle.publish).toHaveBeenCalledWith({
                    "data": [],
                    "type": "downloadCharts",
                }, 'dataValues');
            });

            it("should save session state and redirect user to dashboard when project selection changes", function() {
                var selectedProject = {
                    "id": "p1"
                };
                spyOn(location, "path");

                rootScope.currentUser = {};

                scope.setSelectedProject(selectedProject);
                scope.$apply();

                expect(sessionHelper.saveSessionState).toHaveBeenCalled();
                expect(location.path).toHaveBeenCalledWith("/dashboard");
            });
        });
    });
