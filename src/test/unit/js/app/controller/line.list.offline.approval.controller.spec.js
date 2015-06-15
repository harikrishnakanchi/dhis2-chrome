define(["lineListOfflineApprovalController", "angularMocks", "utils", "programEventRepository", "orgUnitRepository", "programRepository", "optionSetRepository"],
    function(LineListOfflineApprovalController, mocks, utils, ProgramEventRepository, OrgUnitRepository, ProgramRepository, OptionSetRepository) {
        describe("lineListOfflineApprovalController", function() {
            var lineListOfflineApprovalController, scope, programEventRepository, orgUnitRepository, programRepository, optionSetRepository, q, origins, program, optionSetMapping, events;

            beforeEach(mocks.inject(function($rootScope, $q) {
                scope = $rootScope.$new();
                q = $q;
                origins = [{
                    'id': 'origin1',
                    'name': 'Origin 1'
                }, {
                    'id': 'origin2',
                    'name': 'Origin 2'
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
                    }],
                    "gender_id": [{
                        "id": 'male_id',
                        "name": 'Male',
                        "displayName": 'Male'
                    }, {
                        "id": 'female_id',
                        "name": 'Female',
                        "displayName": 'Female'
                    }]
                };
                events = [{
                    "event": "event1",
                    'orgUnit': 'origin1',
                    'orgUnitName': 'Origin 1',
                    'localStatus': 'READY_FOR_DHIS',
                    "dataValues": [{
                        "code": "_showInOfflineSummary",
                        "value": "Green",
                        "dataElement": "Triage Status",

                    }, {
                        "code": "_showInOfflineSummary",
                        "value": "4 months",
                        "dataElement": "Time between admission and discharge",
                    }, {
                        "code": "_procedures",
                        "value": "procedure 1",
                        "dataElement": "Procedure performed 1",
                        "optionSet": {
                            "id": "proc_id"
                        }
                    }, {
                        "code": "_procedures",
                        "value": "procedure 1",
                        "dataElement": "Procedure performed 2",
                        "optionSet": {
                            "id": "proc_id"
                        }
                    }, {
                        "code": "_sex",
                        "value": "Male_er",
                        "dataElement": "gender",
                        "optionSet": {
                            "id": "gender_id"
                        }
                    }, {
                        "code": "_age",
                        "value": 6,
                        "dataElement": "age",
                    }]
                }, {
                    "event": "event2",
                    'orgUnit': 'origin2',
                    'orgUnitName': 'Origin 2',
                    'localStatus': 'READY_FOR_DHIS',
                    "dataValues": [{
                        "code": "_showInOfflineSummary",
                        "value": "Green",
                        "dataElement": "Triage Status",
                    }, {
                        "code": "_procedures",
                        "value": "procedure 1",
                        "dataElement": "Procedure performed 1",
                        "optionSet": {
                            "id": "proc_id"
                        }
                    }, {
                        "code": "_procedures",
                        "value": "procedure 2",
                        "dataElement": "Procedure performed 2",
                        "optionSet": {
                            "id": "proc_id"
                        }
                    }, {
                        "code": "_sex",
                        "value": "Female_er",
                        "dataElement": "gender",
                    }, {
                        "code": "_age",
                        "value": 4,
                        "dataElement": "age",
                    }]
                }];

                programEventRepository = new ProgramEventRepository();
                spyOn(programEventRepository, "getEventsFor").and.returnValue(utils.getPromise(q, events));

                orgUnitRepository = new OrgUnitRepository();
                spyOn(orgUnitRepository, "findAllByParent").and.returnValue(utils.getPromise(q, origins));

                programRepository = new ProgramRepository();
                spyOn(programRepository, "get").and.returnValue(utils.getPromise(q, program));

                optionSetRepository = new OptionSetRepository();
                spyOn(optionSetRepository, "getOptionSetMapping").and.returnValue(utils.getPromise(q, {
                    "optionSetMap": optionSetMapping
                }));

                scope.selectedModule = {
                    "id": "Mod1"
                };
                scope.week = {
                    "weekYear": "2015",
                    "weekNumber": "21"
                };
                scope.associatedProgramId = "Emergency Department";

                lineListOfflineApprovalController = new LineListOfflineApprovalController(scope, q, programEventRepository, orgUnitRepository, programRepository, optionSetRepository);
                scope.$apply();
            }));

            it("should initialize", function() {
                expect(scope.originOrgUnits).toEqual(origins);
                expect(scope.program).toEqual(program);
                expect(scope.optionSetMapping).toEqual(optionSetMapping);
                expect(scope.dataValues).toEqual({
                    "_showInOfflineSummary": [{
                        "code": "_showInOfflineSummary",
                        "value": "Green",
                        "dataElement": "Triage Status",
                        "eventId": "event1"
                    }, {
                        "code": "_showInOfflineSummary",
                        "value": "4 months",
                        "dataElement": "Time between admission and discharge",
                        "eventId": "event1"
                    }, {
                        "code": "_showInOfflineSummary",
                        "value": "Green",
                        "dataElement": "Triage Status",
                        "eventId": "event2"
                    }],
                    "_age": [{
                        "code": "_age",
                        "value": 6,
                        "dataElement": "age",
                        "eventId": "event1"
                    }, {
                        "code": "_age",
                        "value": 4,
                        "dataElement": "age",
                        "eventId": "event2"
                    }],
                    "_sex": [{
                        "code": "_sex",
                        "value": "Male_er",
                        "dataElement": "gender",
                        "optionSet": {
                            "id": "gender_id"
                        },
                        "eventId": "event1"
                    }, {
                        "code": "_sex",
                        "value": "Female_er",
                        "dataElement": "gender",
                        "eventId": "event2"
                    }],
                    "_procedures": [{
                        "code": "_procedures",
                        "value": "procedure 1",
                        "dataElement": "Procedure performed 1",
                        "optionSet": {
                            "id": "proc_id"
                        },
                        "eventId": "event1"
                    }, {
                        "code": "_procedures",
                        "value": "procedure 1",
                        "dataElement": "Procedure performed 2",
                        "optionSet": {
                            "id": "proc_id"
                        },
                        "eventId": "event1"
                    }, {
                        "code": "_procedures",
                        "value": "procedure 1",
                        "dataElement": "Procedure performed 1",
                        "optionSet": {
                            "id": "proc_id"
                        },
                        "eventId": "event2"
                    }, {
                        "code": "_procedures",
                        "value": "procedure 2",
                        "dataElement": "Procedure performed 2",
                        "optionSet": {
                            "id": "proc_id"
                        },
                        "eventId": "event2"
                    }]
                });
                expect(scope.procedureDataValueIds).toEqual(['procedure 1', 'procedure 2']);
                expect(scope.procedureDataValues).toEqual({
                    "procedure 1": [{
                        "code": "_procedures",
                        "value": "procedure 1",
                        "dataElement": "Procedure performed 1",
                        "optionSet": {
                            "id": "proc_id"
                        },
                        "eventId": "event1"
                    }, {
                        "code": "_procedures",
                        "value": "procedure 1",
                        "dataElement": "Procedure performed 2",
                        "optionSet": {
                            "id": "proc_id"
                        },
                        "eventId": "event1"
                    }, {
                        "code": "_procedures",
                        "value": "procedure 1",
                        "dataElement": "Procedure performed 1",
                        "optionSet": {
                            "id": "proc_id"
                        },
                        "eventId": "event2"
                    }],
                    "procedure 2": [{
                        "code": "_procedures",
                        "value": "procedure 2",
                        "dataElement": "Procedure performed 2",
                        "optionSet": {
                            "id": "proc_id"
                        },
                        "eventId": "event2"
                    }]
                });
                expect(scope.showFilters).toEqual(true);
                expect(scope.originsMap).toEqual({
                    "Origin 1": [events[0]],
                    "Origin 2": [events[1]]
                });
            });

            it("should return set showFilters to false if there are no events", function() {
                programEventRepository.getEventsFor.and.returnValue(utils.getPromise(q, []));
                lineListOfflineApprovalController = new LineListOfflineApprovalController(scope, q, programEventRepository, orgUnitRepository, programRepository, optionSetRepository);
                scope.$apply();

                expect(scope.showFilters).toEqual(false);
            });

            it("should return true if there are procedure data values", function() {
                expect(scope.shouldShowProceduresInOfflineSummary()).toEqual(true);
            });

            it("should return false if there are no procedure data values", function() {
                programEventRepository.getEventsFor.and.returnValue(utils.getPromise(q, []));
                lineListOfflineApprovalController = new LineListOfflineApprovalController(scope, q, programEventRepository, orgUnitRepository, programRepository, optionSetRepository);
                scope.$apply();

                expect(scope.shouldShowProceduresInOfflineSummary()).toEqual(false);
            });

            it("should get count when no filters are applied", function() {
                expect(scope.getCount(false, false, "Green")).toEqual(2);
            });

            it("should get count when gender filter is applied", function() {
                scope.isGenderFilterApplied = true;
                scope.program = {
                    "name": "er"
                };
                scope.$apply();

                expect(scope.getCount(true, false, "Green", "Male_er")).toEqual(1);
            });

            it("should get count when age filter is applied", function() {
                scope.isAgeFilterApplied = true;
                scope.program = {
                    "name": "er"
                };
                scope.$apply();

                expect(scope.getCount(false, true, "Green", "Triage Status", [0, 5])).toEqual(1);
            });

            it("should get count when age and gender filter is applied", function() {
                scope.isAgeFilterApplied = true;
                scope.program = {
                    "name": "er"
                };
                scope.$apply();

                expect(scope.getCount(true, true, "Green", "Female_er", [0, 5])).toEqual(1);
                expect(scope.getCount(true, true, "Green", "Male_er", [4, 15])).toEqual(1);
            });

            it("should get procedure count when no filters are applied", function() {
                expect(scope.getProcedureCount(false, false, "procedure 1")).toEqual(3);
                expect(scope.getProcedureCount(false, false, "procedure 2")).toEqual(1);
            });

            it("should get procedure count when gender filter is applied", function() {
                scope.isGenderFilterApplied = true;
                scope.program = {
                    "name": "er"
                };
                scope.$apply();

                expect(scope.getProcedureCount(true, false, "procedure 1", "Male_er")).toEqual(2);
                expect(scope.getProcedureCount(true, false, "procedure 1", "Female_er")).toEqual(1);
                expect(scope.getProcedureCount(true, false, "procedure 2", "Female_er")).toEqual(1);
            });

            it("should get procedure count when age filter is applied", function() {
                scope.isAgeFilterApplied = true;
                scope.program = {
                    "name": "er"
                };
                scope.$apply();

                expect(scope.getCount(false, true, "procedure 1", "", [0, 5])).toEqual(1);
            });

            it("should get procedure count when age and gender filter is applied", function() {
                scope.isAgeFilterApplied = true;
                scope.program = {
                    "name": "er"
                };
                scope.$apply();

                expect(scope.getCount(true, true, "procedure 1", "Female_er", [0, 5])).toEqual(1);
                expect(scope.getCount(true, true, "procedure 1", "Male_er", [4, 15])).toEqual(1);
            });

            it("should return true if it should be shown in offline summary", function() {
                expect(scope.shouldShowInOfflineSummary("Triage Status")).toEqual(true);
            });

            it("should return false if it should not be shown in offline summary", function() {
                expect(scope.shouldShowInOfflineSummary("gender")).toEqual(false);
            });

        });
    });
