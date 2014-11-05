define(["dataEntryController", "testData", "angularMocks", "lodash", "utils", "orgUnitMapper", "moment", "dataRepository", "orgUnitRepository"],
    function(DataEntryController, testData, mocks, _, utils, orgUnitMapper, moment, DataRepository, OrgUnitRepository) {
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
                        "userAuthorityGroups": [{
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
                spyOn(orgUnitRepository, "getAllModulesInProjects").and.returnValue(utils.getPromise(q, allModules));

                routeParams = {};
            }));

            it("should initialize modules", function() {
                var modules = [{'id': 'mod1'}];

                orgUnitRepository = new OrgUnitRepository();
                spyOn(orgUnitRepository, "getAllModulesInProjects").and.returnValue(utils.getPromise(q, modules));

                dataEntryController = new DataEntryController(scope, routeParams, q, location, rootScope, orgUnitRepository);
                scope.$apply();

                expect(scope.modules).toEqual(modules);
            });

            it("should set initial values for modules and week from route params", function() {
                routeParams = {
                    "module": allModules[0].name,
                    "week": "W31 - 2014-07-28 - 2014-08-03"
                };

                dataEntryController = new DataEntryController(scope, routeParams, q, location, rootScope, orgUnitRepository);
                scope.$apply();

                expect(scope.week).toEqual({
                    "weekNumber": 31,
                    "startOfWeek": '2014-07-28',
                    "endOfWeek": '2014-08-03'
                });
                expect(scope.currentModule).toEqual(allModules[0]);
            });

            it("should load the data entry template", function() {
                dataEntryController = new DataEntryController(scope, routeParams, q, location, rootScope, orgUnitRepository);
                scope.$apply();

                scope.week = {};
                scope.currentModule = {};
                scope.$apply();

                expect(scope.formTemplateUrl.indexOf("templates/partials/aggregate-data-entry.html?")).toEqual(0);
            });

            it("should not load the data entry template only if module is undefined", function() {
                dataEntryController = new DataEntryController(scope, routeParams, q, location, rootScope, orgUnitRepository);
                scope.$apply();

                scope.week = {};
                scope.currentModule = undefined;
                scope.$apply();

                expect(scope.formTemplateUrl).toEqual(undefined);
            });

            it("should not load the data entry template only if period is undefined", function() {
                dataEntryController = new DataEntryController(scope, routeParams, q, location, rootScope, orgUnitRepository);
                scope.$apply();

                scope.week = undefined;
                scope.currentModule = {};
                scope.$apply();

                expect(scope.formTemplateUrl).toEqual(undefined);
            });

        });
    });