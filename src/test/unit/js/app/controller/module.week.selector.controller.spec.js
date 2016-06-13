define(["moduleWeekSelectorController", "testData", "angularMocks", "lodash", "utils", "orgUnitMapper", "moment", "dataRepository", "orgUnitRepository"],
    function(ModuleWeekSelectorController, testData, mocks, _, utils, orgUnitMapper, moment, DataRepository, OrgUnitRepository) {
        describe("moduleWeekSelectorController ", function() {

            var scope, rootScope, q, location, window, orgUnitRepository, routeParams, modules;

            beforeEach(mocks.inject(function($rootScope, $q, $location) {
                scope = $rootScope.$new();
                rootScope = $rootScope;
                q = $q;
                location = $location;

                spyOn(location, "hash");

                rootScope.hasRoles = jasmine.createSpy("hasRoles").and.returnValue(false);

                rootScope.currentUser = {
                    "firstName": "test1",
                    "lastName": "test1last",
                    "userCredentials": {
                        "username": "dataentryuser",
                        "userRoles": [{
                            "id": "hxNB8lleCsl",
                            "name": 'Projectadmin'
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
                    }],
                    "selectedProject": {
                        id: "proj_1",
                        "name": "MISSIONS EXPLOS"
                    }
                };

                orgUnitRepository = new OrgUnitRepository();
                routeParams = {};

                modules = [{
                    'id': 'mod1',
                    'name': 'mod1',
                    'parent': {
                        'name': 'op1'
                    }
                }, {
                    'name': 'linelistMod',
                    'id': 'llmod',
                    'parent': {
                        'name': 'op1'
                    },
                    'attributeValues': [{
                        'attribute': {
                            'code': 'isLineListService'

                        },
                        'value': "true"
                    }]
                }, {
                    'id': 'aggMod',
                    'name': 'aggMod',
                    'parent': {
                        'name': 'op1'
                    },
                    'attributeValues': [{
                        'attribute': {
                            'code': 'isLineListService'

                        },
                        'value': "false"
                    }]
                }];
                orgUnitRepository = new OrgUnitRepository();
                spyOn(orgUnitRepository, "getAllModulesInOrgUnits").and.returnValue(utils.getPromise(q, modules));
            }));

            it("should initialize modules if dataType is set to aggregate", function() {
                scope.dataType = "aggregate";
                scope.$apply();

                var expectedModules = [{
                    'id': 'mod1',
                    'name': 'mod1',
                    'displayName': 'op1 - mod1',
                    'parent': {
                        'name': 'op1'
                    }
                }, {
                    'id': 'aggMod',
                    'name': 'aggMod',
                    'displayName': 'op1 - aggMod',
                    'parent': {
                        'name': 'op1'
                    },
                    'attributeValues': [{
                        'attribute': {
                            'code': 'isLineListService'

                        },
                        'value': "false"
                    }]
                }];

                moduleWeekSelectorController = new ModuleWeekSelectorController(scope, routeParams, q, location, rootScope, orgUnitRepository);
                scope.$apply();

                expect(scope.modules).toEqual(expectedModules);
            });

            it("should initialize modules if dataType is set to all", function() {
                scope.dataType = "all";
                scope.$apply();

                var expectedModules = [{
                    'id': 'mod1',
                    'name': 'mod1',
                    'displayName': 'op1 - mod1',
                    'parent': {
                        'name': 'op1'
                    }
                }, {
                    'name': 'linelistMod',
                    'id': 'llmod',
                    'displayName': 'op1 - linelistMod',
                    'parent': {
                        'name': 'op1'
                    },
                    'attributeValues': [{
                        'attribute': {
                            'code': 'isLineListService'

                        },
                        'value': "true"
                    }]
                }, {
                    'id': 'aggMod',
                    'name': 'aggMod',
                    'displayName': 'op1 - aggMod',
                    'parent': {
                        'name': 'op1'
                    },
                    'attributeValues': [{
                        'attribute': {
                            'code': 'isLineListService'

                        },
                        'value': "false"
                    }]
                }];

                moduleWeekSelectorController = new ModuleWeekSelectorController(scope, routeParams, q, location, rootScope, orgUnitRepository);
                scope.$apply();

                expect(scope.modules).toEqual(expectedModules);
            });

            it("should set initial values for modules and week from route params", function() {
                routeParams = {
                    "module": modules[1].id,
                    "week": "2014W31"
                };

                scope.resourceBundle = {
                    "openingDateInFutureError": "openingDateInFutureError"
                };
                moduleWeekSelectorController = new ModuleWeekSelectorController(scope, routeParams, q, location, rootScope, orgUnitRepository);
                scope.$apply();

                expect(scope.week).toEqual({
                    "weekNumber": 31,
                    "weekYear": 2014,
                    "startOfWeek": '2014-07-28',
                    "endOfWeek": '2014-08-03'
                });
                expect(scope.currentModule).toEqual(modules[1]);
            });

        });
    });
