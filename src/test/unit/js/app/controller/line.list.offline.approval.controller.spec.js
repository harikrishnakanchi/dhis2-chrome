define(["lineListOfflineApprovalController", "angularMocks", "utils", "programEventRepository", "orgUnitRepository", "programRepository", "optionSetRepository"],
    function(LineListOfflineApprovalController, mocks, utils, ProgramEventRepository, OrgUnitRepository, ProgramRepository, OptionSetRepository) {
        describe("lineListOfflineApprovalController", function() {
            var lineListOfflineApprovalController, scope, programEventRepository, orgUnitRepository, programRepository, optionSetRepository, q, origins, program, optionSetMapping, events;

            beforeEach(mocks.inject(function($rootScope, $q) {
                scope = $rootScope.$new();
                q = $q;
                origins = [{
                    'id': 'origin1'
                }, {
                    'id': 'origin2'
                }];
                program = {
                    "id": "Emergency Department"
                };
                optionSetMapping = {
                    "os1": [{
                        "id": 'os1o1',
                        "name": 'os1o1 name',
                        "displayName": 'os1o1 name',
                    }],
                    "os2": [{
                        "id": 'os2o1',
                        "name": 'os2o1 name',
                        "displayName": 'os2o1 translated name'
                    }]
                };
                events = [{
                    "event": "event1",
                    "dataValues": [{
                        "code": "_showInOfflineSummary",
                        "value": "option1",
                        "dataElement": "de1",
                    }, {
                        "code": "_showInOfflineSummary",
                        "value": "option2",
                        "dataElement": "de2",
                    }, {
                        "code": "_showInOfflineSummaryFilters",
                        "value": "option1",
                        "dataElement": "de3",
                    }]
                }, {
                    "event": "event2",
                    "dataValues": [{
                        "code": "_procedures",
                        "value": "option3",
                        "dataElement": "de4",
                    }, {
                        "code": "_procedures",
                        "value": "option3",
                        "dataElement": "de5",
                    }]
                }];

                programEventRepository = new ProgramEventRepository();
                spyOn(programEventRepository, "getEventsFor").and.returnValue(utils.getPromise(q, events));

                orgUnitRepository = new OrgUnitRepository();
                spyOn(orgUnitRepository, "findAllByParent").and.returnValue(utils.getPromise(q, origins));

                programRepository = new ProgramRepository();
                spyOn(programRepository, "get").and.returnValue(utils.getPromise(q, program));

                optionSetRepository = new OptionSetRepository();
                spyOn(optionSetRepository, "getOptionSetMapping").and.returnValue(utils.getPromise(q, optionSetMapping));

                scope.selectedModule = {
                    "id": "Mod1"
                };
                scope.week = {
                    "weekYear": "2015",
                    "weekNumber": "21"
                };
                scope.associatedProgramId = "Emergency Department";

                lineListOfflineApprovalController = new LineListOfflineApprovalController(scope, $q, programEventRepository, orgUnitRepository, programRepository, optionSetRepository);
                scope.$apply();
            }));

            it("should initialize", function() {
                expect(scope.originOrgUnits).toEqual(origins);
                expect(scope.program).toEqual(program);
                expect(scope.optionSetMapping).toEqual(optionSetMapping);
                expect(scope.dataValues).toEqual({
                    "_showInOfflineSummary": [{
                        "code": '_showInOfflineSummary',
                        "value": 'option1',
                        "dataElement": "de1"
                    }, {
                        "code": '_showInOfflineSummary',
                        "value": 'option2',
                        "dataElement": "de2"
                    }],
                    "_showInOfflineSummaryFilters": [{
                        "code": '_showInOfflineSummaryFilters',
                        "value": 'option1',
                        "dataElement": "de3"
                    }],
                    "_procedures": [{
                        "code": '_procedures',
                        "value": 'option3',
                        "dataElement": "de4"
                    }, {
                        "code": '_procedures',
                        "value": 'option3',
                        "dataElement": "de5"
                    }]
                });
                expect(scope.procedureDataValueIds).toEqual(["option3"]);
                expect(scope.procedureDataValues).toEqual({
                    "option3": [{
                        "code": '_procedures',
                        "value": 'option3',
                        "dataElement": "de4"
                    }, {
                        "code": '_procedures',
                        "value": 'option3',
                        "dataElement": "de5"
                    }]
                });
            });

            it("should get count", function() {
                expect(scope.getCount("option1")).toEqual(1);
            });

            it("should get procedure count", function() {
                expect(scope.getProcedureCount("option3")).toEqual(2);
            });

            it("should get procedure name", function() {
                var dataValue = {
                    "optionSet": {
                        "id": "os1",
                    }
                };
                var result = scope.getProcedureName(dataValue, "os1o1");

                expect(result).toEqual("os1o1 name");
            });

            it("should return true if it should be shown in offline summary", function() {
                expect(scope.shouldShowInOfflineSummary("de1")).toEqual(true);
            });

            it("should return false if it should not be shown in offline summary", function() {
                expect(scope.shouldShowInOfflineSummary("de4")).toEqual(false);
            });
        });
    });