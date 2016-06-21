define(["mainController", "angularMocks", "utils", "sessionHelper", "chromeUtils", "orgUnitRepository", "systemSettingRepository", "dhisMonitor"],
    function(MainController, mocks, utils, SessionHelper, chromeUtils, OrgUnitRepository, SystemSettingRepository, DhisMonitor) {
        describe("main controller", function() {
            var rootScope, mainController, scope, q, timeout, db,
                translationStore, location, sessionHelper, orgUnitRepository, hustle, systemSettingRepository;

            beforeEach(module('hustle'));
            beforeEach(mocks.inject(function($rootScope, $q, $location, $hustle, $timeout) {
                scope = $rootScope.$new();
                q = $q;
                rootScope = $rootScope;
                hustle = $hustle;
                timeout = $timeout;

                spyOn(chromeUtils, "sendMessage");
                spyOn(chromeUtils, "addListener");

                sessionHelper = new SessionHelper();
                orgUnitRepository = new OrgUnitRepository();
                systemSettingRepository = new SystemSettingRepository();

                dhisMonitor = new DhisMonitor();
                spyOn(dhisMonitor, "hasPoorConnectivity").and.returnValue(false);

                spyOn(orgUnitRepository, "getAllModulesInOrgUnits").and.returnValue(utils.getPromise(q, []));
                spyOn(orgUnitRepository, "getAllOpUnitsInOrgUnits").and.returnValue(utils.getPromise(q, []));

                spyOn(systemSettingRepository, "isProductKeySet").and.returnValue(utils.getPromise(q, true));
                spyOn(systemSettingRepository, "isKeyGeneratedFromProd").and.returnValue(utils.getPromise(q, true));

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

                translationStore = getMockStore("translations");

                spyOn(sessionHelper, "logout");
                spyOn(sessionHelper, "saveSessionState");
                spyOn(sessionHelper, "login").and.returnValue(utils.getPromise(q, {}));

                spyOn(translationStore, "each").and.returnValue(utils.getPromise(q, {}));
                spyOn(db, 'objectStore').and.callFake(function(storeName) {
                    return translationStore;
                });

                spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));

                mainController = new MainController(q, scope, location, rootScope, hustle, timeout, db, sessionHelper, orgUnitRepository, systemSettingRepository, dhisMonitor);
            }));

            it("should logout user", function() {
                scope.logout();

                expect(sessionHelper.logout).toHaveBeenCalled();
            });

            it("should return true if user has selected project", function() {
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
                var result = scope.hasSelectedProject();

                expect(result).toEqual(true);
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

            it("should show the test logo if not connected to prod", function() {
                systemSettingRepository.isKeyGeneratedFromProd.and.returnValue(false);
                expect(scope.showTestLogo()).toBe(true);
            });
        });
    });
