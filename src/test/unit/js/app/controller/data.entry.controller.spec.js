define(["dataEntryController", "testData", "angularMocks", "lodash", "utils", "orgUnitMapper", "moment", "dataRepository", "orgUnitRepository", "programRepository", "timecop"],
    function(DataEntryController, testData, mocks, _, utils, orgUnitMapper, moment, DataRepository, OrgUnitRepository, ProgramRepository, timecop) {
        describe("dataEntryController ", function() {

            var scope, rootScope, q, anchorScroll, location, window, timeout, orgUnitRepository, allModules, routeParams;

            beforeEach(mocks.inject(function($rootScope, $q, $anchorScroll, $location) {
                scope = $rootScope.$new();
                rootScope = $rootScope;
                q = $q;
                anchorScroll = $anchorScroll;
                location = $location;

                spyOn(location, "hash");

                rootScope.currentUser = {
                    "firstName": "test1",
                    "lastName": "test1last",
                    "userCredentials": {
                        "username": "dataentryuser",
                        "userRoles": [{
                            "id": "hxNB8lleCsl",
                            "name": 'Superuser'
                        }, {
                            "id": "hxNB8lleCsl",
                            "name": 'blah'
                        }]
                    },
                    "organisationUnits": [{
                        id: "proj_1",
                        "name": "MISSIONS EXPLOS"
                    }, {
                        id: "test1",
                        "name": "MISSIONS EXPLOS123"
                    }, {
                        id: "test2",
                        "name": "MISSIONS EXPLOS345"
                    }]
                };

                allModules = [{
                    'name': 'mod1',
                    'displayName': 'mod1',
                    'id': 'mod1',
                    'parent': {
                        id: "proj_1"
                    },
                    'attributeValues': [{
                        'attribute': {
                            id: "a1fa2777924"
                        },
                        value: "Module"
                    }, {
                        'attribute': {
                            code: "isDisabled"
                        },
                        value: false
                    }]
                }];

                orgUnitRepository = new OrgUnitRepository();
                spyOn(orgUnitRepository, "getAllModulesInOrgUnitsExceptCurrentModules").and.returnValue(utils.getPromise(q, allModules));

                programRepository = new ProgramRepository();
                spyOn(programRepository, "getProgramForOrgUnit").and.returnValue(utils.getPromise(q, {}));

                routeParams = {};

                Timecop.install();
                Timecop.freeze("2014-05-05");
            }));

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            it("should initialize modules", function() {
                var modules = [{
                    'id': 'mod1',
                    'name': 'mod1',
                    'parent': {
                        'name': 'op1'
                    }
                }];

                var expectedModules = [{
                    'id': 'mod1',
                    'name': 'mod1',
                    'displayName': 'op1 - mod1',
                    'parent': {
                        'name': 'op1'
                    }
                }];

                orgUnitRepository = new OrgUnitRepository();
                spyOn(orgUnitRepository, "getAllModulesInOrgUnitsExceptCurrentModules").and.returnValue(utils.getPromise(q, modules));

                dataEntryController = new DataEntryController(scope, routeParams, q, location, rootScope, orgUnitRepository, programRepository);
                scope.$apply();

                expect(scope.modules).toEqual(expectedModules);
            });

            it("should set initial values for modules and week from route params", function() {
                routeParams = {
                    "module": allModules[0].name,
                    "week": "2014W31"
                };

                scope.resourceBundle = {
                    "openingDateInFutureError": "openingDateInFutureError"
                };
                dataEntryController = new DataEntryController(scope, routeParams, q, location, rootScope, orgUnitRepository, programRepository);
                scope.$apply();

                expect(scope.week).toEqual({
                    "weekNumber": 31,
                    "weekYear": 2014,
                    "startOfWeek": '2014-07-28',
                    "endOfWeek": '2014-08-03'
                });
                expect(scope.currentModule).toEqual(allModules[0]);
            });

            it("should load the aggregate data entry template if current module does not contain line list porgrams", function() {
                rootScope.currentUser.userCredentials = {
                    "username": "dataentryuser",
                    "userRoles": [{
                        "name": 'Data entry user'
                    }]
                };

                dataEntryController = new DataEntryController(scope, routeParams, q, location, rootScope, orgUnitRepository, programRepository);
                scope.$apply();

                scope.week = {};
                scope.currentModule = {};
                scope.$apply();

                expect(scope.formTemplateUrl.indexOf("templates/partials/aggregate-data-entry.html?")).toEqual(0);
                expect(scope.programId).toBe(undefined);
            });

            it("should load the list-list entry template if current module contains line list porgrams", function() {
                rootScope.currentUser.userCredentials = {
                    "username": "dataentryuser",
                    "userRoles": [{
                        "name": 'Data entry user'
                    }]
                };

                programRepository = new ProgramRepository();
                spyOn(programRepository, "getProgramForOrgUnit").and.returnValue(utils.getPromise(q, {
                    'id': 'p1'
                }));

                dataEntryController = new DataEntryController(scope, routeParams, q, location, rootScope, orgUnitRepository, programRepository);
                scope.$apply();

                scope.week = {};
                scope.currentModule = {};
                scope.$apply();

                expect(scope.formTemplateUrl.indexOf("templates/partials/line-list-summary.html?")).toEqual(0);
                expect(scope.programId).toEqual('p1');
            });

            it("should load the data entry template if user is an approver and current module contains line list porgrams", function() {
                rootScope.currentUser.userCredentials = {
                    "username": "dataentryuser",
                    "userRoles": [{
                        "name": 'Not a Data entry user'
                    }]
                };

                programRepository = new ProgramRepository();
                spyOn(programRepository, "getProgramForOrgUnit").and.returnValue(utils.getPromise(q, {
                    'id': 'p1'
                }));

                dataEntryController = new DataEntryController(scope, routeParams, q, location, rootScope, orgUnitRepository, programRepository);
                scope.$apply();

                scope.week = {};
                scope.currentModule = {};
                scope.$apply();

                expect(scope.formTemplateUrl.indexOf("templates/partials/aggregate-data-entry.html?")).toEqual(0);
                expect(scope.programId).toBe(undefined);
            });

            it("should not load the template only if module is undefined", function() {
                dataEntryController = new DataEntryController(scope, routeParams, q, location, rootScope, orgUnitRepository, programRepository);
                scope.$apply();

                scope.week = {};
                scope.currentModule = undefined;
                scope.$apply();

                expect(scope.formTemplateUrl).toEqual(undefined);
            });

            it("should not load the template only if period is undefined", function() {
                dataEntryController = new DataEntryController(scope, routeParams, q, location, rootScope, orgUnitRepository, programRepository);
                scope.$apply();

                scope.week = undefined;
                scope.currentModule = {};
                scope.$apply();

                expect(scope.formTemplateUrl).toEqual(undefined);
            });

            it("should not load the template if module's opening date is in future", function() {
                rootScope.currentUser.userCredentials = {
                    "username": "dataentryuser",
                    "userRoles": [{
                        "name": 'Data entry user'
                    }]
                };

                programRepository = new ProgramRepository();

                scope.resourceBundle = {
                    "openingDateInFutureError": "Data entry form will open from Week "
                };

                dataEntryController = new DataEntryController(scope, routeParams, q, location, rootScope, orgUnitRepository, programRepository);
                scope.$apply();

                scope.week = {};
                scope.currentModule = {
                    "openingDate": "2015-03-03"
                };
                scope.$apply();

                expect(scope.formTemplateUrl).toBeUndefined();
                expect(scope.programId).toBeUndefined();
                expect(scope.errorMessage).toEqual("Data entry form will open from Week 10");
            });
        });
    });
