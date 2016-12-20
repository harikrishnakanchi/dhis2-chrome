define(["headerController", "angularMocks", "utils", "sessionHelper", "platformUtils", "orgUnitRepository", "systemSettingRepository", "dhisMonitor"],
    function(HeaderController, mocks, utils, SessionHelper, platformUtils, OrgUnitRepository, SystemSettingRepository, DhisMonitor) {
        describe("headerController", function() {
            var rootScope, headerController, scope, q, timeout, fakeModal, dhisMonitor,
                translationStore, location, sessionHelper, orgUnitRepository, hustle, systemSettingRepository;

            beforeEach(module('hustle'));
            beforeEach(mocks.inject(function($rootScope, $q, $location, $hustle, $timeout) {
                scope = $rootScope.$new();
                q = $q;
                rootScope = $rootScope;
                hustle = $hustle;
                timeout = $timeout;

                scope.resourceBundle = {
                    jobRemaining: 'task remaining',
                    jobsRemaining: 'tasks remaining',
                    uninstall: {
                        title: 'Uninstall Praxis',
                        successMessage: "Uninstalled successfully"
                    }
                };

                scope.startLoading = jasmine.createSpy('startLoading');
                scope.stopLoading = jasmine.createSpy('stopLoading');

                fakeModal = {
                    close: function() {
                        this.result.confirmCallBack();
                    },
                    dismiss: function(type) {
                        this.result.cancelCallback(type);
                    },
                    open: function(object) {}
                };

                spyOn(platformUtils, "sendMessage");
                spyOn(platformUtils, "addListener");
                spyOn(platformUtils, "uninstall").and.returnValue(utils.getPromise(q, undefined));

                sessionHelper = new SessionHelper();
                orgUnitRepository = new OrgUnitRepository();
                systemSettingRepository = new SystemSettingRepository();

                dhisMonitor = new DhisMonitor();
                spyOn(dhisMonitor, "hasPoorConnectivity").and.returnValue(false);

                spyOn(orgUnitRepository, "getAllModulesInOrgUnits").and.returnValue(utils.getPromise(q, []));
                spyOn(orgUnitRepository, "getAllOpUnitsInOrgUnits").and.returnValue(utils.getPromise(q, []));
                spyOn(orgUnitRepository, "enrichWithParent").and.callFake(function (orgUnit) { return orgUnit; });

                spyOn(systemSettingRepository, "isProductKeySet").and.returnValue(utils.getPromise(q, true));
                spyOn(systemSettingRepository, "isKeyGeneratedFromProd").and.returnValue(utils.getPromise(q, true));

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

                spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));

                headerController = new HeaderController(q, scope, location, rootScope, hustle, timeout, fakeModal, sessionHelper, orgUnitRepository, systemSettingRepository, dhisMonitor);
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

            describe('Praxis Version', function () {
                beforeEach(function () {
                    spyOn(platformUtils, 'getPraxisVersion').and.returnValue('7.0');
                });

                it('should get the correct Praxis Version', function () {
                    scope.$apply();

                    expect(scope.versionNumber()).toEqual('7.0');
                });

                it('should not show version number if praxisVersion is undefined', function () {
                    platformUtils.getPraxisVersion.and.returnValue(undefined);
                    scope.$apply();

                    expect(scope.versionNumber()).toEqual('');
                });
            });

            describe('getRemainingTasks', function () {
                it('should return correct phrase based on the remaining tasks', function () {
                    rootScope.remainingJobs = 1;
                    expect(scope.getRemainingJobs()).toEqual('1 task remaining');

                    rootScope.remainingJobs = 2;
                    expect(scope.getRemainingJobs()).toEqual('2 tasks remaining');
                });
            });

            describe('Uninstall praxis', function () {
                beforeEach(function () {
                    spyOn(document, 'getElementById').and.returnValue(document.createElement('div'));
                });

                it('should ask the user for confirmation before uninstalling', function () {
                    spyOn(fakeModal, 'open').and.returnValue({
                        result: utils.getPromise(q, {})
                    });

                    scope.uninstallPraxis();
                    scope.$apply();

                    expect(fakeModal.open).toHaveBeenCalled();
                    expect(platformUtils.uninstall).toHaveBeenCalled();
                });

                it('should not uninstall praxis if user clicks cancel', function () {
                    spyOn(fakeModal, 'open').and.returnValue({
                        result: utils.getRejectedPromise(q, {})
                    });

                    scope.uninstallPraxis();
                    scope.$apply();

                    expect(fakeModal.open).toHaveBeenCalled();
                    expect(platformUtils.uninstall).not.toHaveBeenCalled();
                });
            });
        });
    });
