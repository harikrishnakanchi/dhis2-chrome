define(["lineListOfflineApprovalController", "angularMocks", "utils", "programEventRepository", "orgUnitRepository", "programRepository", "optionSetRepository", "dataSetRepository", "referralLocationsRepository", "excludedDataElementsRepository", "translationsService", "timecop"],
    function(LineListOfflineApprovalController, mocks, utils, ProgramEventRepository, OrgUnitRepository, ProgramRepository, OptionSetRepository, DatasetRepository, ReferralLocationsRepository, ExcludedDataElementsRepository, TranslationsService, timecop) {
        describe("lineListOfflineApprovalController", function() {
            var lineListOfflineApprovalController,
                scope, q,
                programEventRepository, orgUnitRepository, programRepository, optionSetRepository, dataSetRepository, referralLocationsRepository, excludedDataElementsRepository,
                origins, program, optionSetMapping, events, origin1, origin2, origin3, origin4, associatedDataSets,
                translationsService;

            beforeEach(mocks.inject(function($rootScope, $q) {
                scope = $rootScope.$new();
                q = $q;
                origin1 = {
                    'id': 'origin2',
                    'name': 'Origin 2',
                    'displayName': 'Origin 2'
                };
                origin2 = {
                    'id': 'origin1',
                    'name': 'Not Specified',
                    'displayName': 'Not Specified'
                };
                origin3 = {
                    'id': 'origin3',
                    'name': 'testOrigin',
                    'displayName': 'testOrigin'
                };

                origin4 = {
                    'id': 'origin4',
                    'name': 'foo',
                    'displayName': 'foo'
                };

                origins = [origin1, origin2, origin3, origin4];
                program = {
                    "id": "Emergency Department"
                };
                optionSetMapping = {
                    "os1": [{
                        "id": 'os1o1',
                        "name": 'os1o1 name',
                        "displayName": 'os1o1 name'
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
                    }],
                    "ref_id": [{
                        "id": 'ref_id',
                        "name": 'ref 1',
                        "displayName": 'ref 1'
                    }]
                };
                events = [{
                    "event": "event1",
                    'orgUnit': 'origin1',
                    'orgUnitName': 'Origin 1',
                    'localStatus': 'READY_FOR_DHIS',
                    "dataValues": [{
                        "value": "Green",
                        "dataElement": "Triage Status",
                        "offlineSummaryType": "showInOfflineSummary"

                    }, {
                        "offlineSummaryType": "showInOfflineSummary",
                        "value": "4 months",
                        "dataElement": "Time between admission and discharge",
                    }, {
                        "offlineSummaryType": "procedures",
                        "value": "procedure 1",
                        "dataElement": "Procedure performed 1",
                        "formName": "Procedure performed 1",
                        "description": "Procedure performed 1 - desc",
                        "optionSet": {
                            "id": "proc_id"
                        }
                    }, {
                        "offlineSummaryType": "procedures",
                        "value": "procedure 1",
                        "dataElement": "Procedure performed 2",
                        "formName": "Procedure performed 2",
                        "description": "Procedure performed 2 - desc",
                        "optionSet": {
                            "id": "proc_id"
                        }
                    }, {
                        "offlineSummaryType": "sex",
                        "value": "Male_er",
                        "dataElement": "gender",
                        "optionSet": {
                            "id": "gender_id"
                        }
                    }, {
                        "offlineSummaryType": "age",
                        "value": 6,
                        "dataElement": "age",
                    }, {
                        "offlineSummaryType": "referralLocations",
                        "value": "ref_id",
                        "dataElement": "ref",
                        "optionSet": {
                            "id": "ref_id"
                        }
                    }]
                }, {
                    "event": "event2",
                    'orgUnit': 'origin2',
                    'orgUnitName': 'Origin 2',
                    'localStatus': 'READY_FOR_DHIS',
                    "dataValues": [{
                        "offlineSummaryType": "showInOfflineSummary",
                        "value": "Green",
                        "dataElement": "Triage Status"
                    }, {
                        "offlineSummaryType": "procedures",
                        "value": "procedure 1",
                        "dataElement": "Procedure performed 1",
                        "formName": "Procedure performed 1",
                        "description": "Procedure performed 1 - desc",
                        "optionSet": {
                            "id": "proc_id"
                        }
                    }, {
                        "offlineSummaryType": "procedures",
                        "value": "procedure 2",
                        "dataElement": "Procedure performed 2",
                        "formName": "Procedure performed 2",
                        "description": "Procedure performed 2 - desc",
                        "optionSet": {
                            "id": "proc_id"
                        }
                    }, {
                        "offlineSummaryType": "sex",
                        "value": "Female_er",
                        "dataElement": "gender"
                    }, {
                        "offlineSummaryType": "age",
                        "value": 4,
                        "dataElement": "age"
                    }, {
                        "offlineSummaryType": "referralLocations",
                        "value": "ref_id",
                        "dataElement": "ref",
                        "optionSet": {
                            "id": "ref_id"
                        }
                    }]
                }];

                scope.resourceBundle = {};

                programEventRepository = new ProgramEventRepository();
                spyOn(programEventRepository, "getEventsForPeriod").and.returnValue(utils.getPromise(q, events));

                orgUnitRepository = new OrgUnitRepository();
                spyOn(orgUnitRepository, "findAllByParent").and.returnValue(utils.getPromise(q, origins));

                programRepository = new ProgramRepository();
                spyOn(programRepository, "get").and.returnValue(utils.getPromise(q, program));

                referralLocationsRepository = new ReferralLocationsRepository();
                spyOn(referralLocationsRepository, "get").and.returnValue(utils.getPromise(q, {}));

                excludedDataElementsRepository = new ExcludedDataElementsRepository();
                spyOn(excludedDataElementsRepository, "get").and.returnValue(utils.getPromise(q, []));

                translationsService = new TranslationsService();
                spyOn(translationsService, "translate").and.returnValue(program);
                spyOn(translationsService, "translateOptionSetMap").and.returnValue(optionSetMapping);
                spyOn(translationsService, "getTranslationForProperty").and.returnValue("");

                optionSetRepository = new OptionSetRepository();
                spyOn(optionSetRepository, "getOptionSetMapping").and.returnValue(utils.getPromise(q, {
                    "optionSetMap": optionSetMapping
                }));

                dataSetRepository = new DatasetRepository();
                associatedDataSets = [{
                    "id": "emergency_department_summary",
                    "name": "Emergency Department summary"
                }];
                spyOn(dataSetRepository, "findAllForOrgUnits").and.returnValue(utils.getPromise(q, associatedDataSets));

                scope.selectedModule = {
                    "id": "Mod1",
                    "parent": {
                        "id": "par"
                    }
                };
                scope.week = {
                    "weekYear": "2015",
                    "weekNumber": "21"
                };
                scope.associatedProgramId = "Emergency Department";

                lineListOfflineApprovalController = new LineListOfflineApprovalController(scope, q, programEventRepository, orgUnitRepository, programRepository, optionSetRepository, dataSetRepository, referralLocationsRepository, excludedDataElementsRepository, translationsService);
                scope.$apply();
            }));

            it("should initialize", function() {
                expect(scope.originOrgUnits).toEqual([origin2, origin1, origin4, origin3]);
                expect(scope.program).toEqual(program);

                translationsService.translate.and.returnValue(associatedDataSets);
                lineListOfflineApprovalController = new LineListOfflineApprovalController(scope, q, programEventRepository, orgUnitRepository, programRepository, optionSetRepository, dataSetRepository, referralLocationsRepository, excludedDataElementsRepository, translationsService);

                scope.$apply();

                expect(scope.optionSetMapping).toEqual(optionSetMapping);
                expect(scope.dataValues).toEqual({
                    "_showInOfflineSummary": [{
                        "offlineSummaryType": "showInOfflineSummary",
                        "value": "Green",
                        "dataElement": "Triage Status",
                        "eventId": "event1"
                    }, {
                        "offlineSummaryType": "showInOfflineSummary",
                        "value": "4 months",
                        "dataElement": "Time between admission and discharge",
                        "eventId": "event1"
                    }, {
                        "offlineSummaryType": "showInOfflineSummary",
                        "value": "Green",
                        "dataElement": "Triage Status",
                        "eventId": "event2"
                    }],
                    "_age": [{
                        "offlineSummaryType": "age",
                        "value": 6,
                        "dataElement": "age",
                        "eventId": "event1"
                    }, {
                        "offlineSummaryType": "age",
                        "value": 4,
                        "dataElement": "age",
                        "eventId": "event2"
                    }],
                    "_sex": [{
                        "offlineSummaryType": "sex",
                        "value": "Male_er",
                        "dataElement": "gender",
                        "optionSet": {
                            "id": "gender_id"
                        },
                        "eventId": "event1"
                    }, {
                        "offlineSummaryType": "sex",
                        "value": "Female_er",
                        "dataElement": "gender",
                        "eventId": "event2"
                    }],
                    "_procedures": [{
                        "offlineSummaryType": "procedures",
                        "value": "procedure 1",
                        "dataElement": "Procedure performed 1",
                        "formName": "Procedure performed 1",
                        "description": "Procedure performed 1 - desc",
                        "optionSet": {
                            "id": "proc_id"
                        },
                        "eventId": "event1"
                    }, {
                        "offlineSummaryType": "procedures",
                        "value": "procedure 1",
                        "dataElement": "Procedure performed 2",
                        "formName": "Procedure performed 2",
                        "description": "Procedure performed 2 - desc",
                        "optionSet": {
                            "id": "proc_id"
                        },
                        "eventId": "event1"
                    }, {
                        "offlineSummaryType": "procedures",
                        "value": "procedure 1",
                        "dataElement": "Procedure performed 1",
                        "formName": "Procedure performed 1",
                        "description": "Procedure performed 1 - desc",
                        "optionSet": {
                            "id": "proc_id"
                        },
                        "eventId": "event2"
                    }, {
                        "offlineSummaryType": "procedures",
                        "value": "procedure 2",
                        "dataElement": "Procedure performed 2",
                        "formName": "Procedure performed 2",
                        "description": "Procedure performed 2 - desc",
                        "optionSet": {
                            "id": "proc_id"
                        },
                        "eventId": "event2"
                    }],
                    "_referralLocations": [{
                        "offlineSummaryType": 'referralLocations',
                        "value": 'ref_id',
                        "dataElement": 'ref',
                        "eventId": 'event1',
                        "optionSet": {
                            "id": "ref_id"
                        }

                    }, {
                        "offlineSummaryType": 'referralLocations',
                        "value": 'ref_id',
                        "dataElement": 'ref',
                        "eventId": 'event2',
                        "optionSet": {
                            "id": "ref_id"
                        }
                    }]
                });
                expect(scope.procedureDataValueIds).toEqual(['procedure 1', 'procedure 2']);
                expect(scope.procedureDataValues).toEqual({
                    "procedure 1": [{
                        "offlineSummaryType": "procedures",
                        "value": "procedure 1",
                        "dataElement": "Procedure performed 1",
                        "formName": "Procedure performed 1",
                        "description": "Procedure performed 1 - desc",
                        "optionSet": {
                            "id": "proc_id"
                        },
                        "eventId": "event1"
                    }, {
                        "offlineSummaryType": "procedures",
                        "value": "procedure 1",
                        "dataElement": "Procedure performed 2",
                        "formName": "Procedure performed 2",
                        "description": "Procedure performed 2 - desc",
                        "optionSet": {
                            "id": "proc_id"
                        },
                        "eventId": "event1"
                    }, {
                        "offlineSummaryType": "procedures",
                        "value": "procedure 1",
                        "dataElement": "Procedure performed 1",
                        "formName": "Procedure performed 1",
                        "description": "Procedure performed 1 - desc",
                        "optionSet": {
                            "id": "proc_id"
                        },
                        "eventId": "event2"
                    }],
                    "procedure 2": [{
                        "offlineSummaryType": "procedures",
                        "value": "procedure 2",
                        "dataElement": "Procedure performed 2",
                        "formName": "Procedure performed 2",
                        "description": "Procedure performed 2 - desc",
                        "optionSet": {
                            "id": "proc_id"
                        },
                        "eventId": "event2"
                    }]
                });
                expect(scope.showFilters).toEqual(true);
                expect(scope.originMap).toEqual({
                    origin1: 'Not Specified',
                    origin2: 'Origin 2',
                    origin3: 'testOrigin',
                    origin4: 'foo'
                });
                expect(scope.originEvents).toEqual({
                    "origin1": [events[0]],
                    "origin2": [events[1]]
                });
                expect(scope.associatedDataSets).toEqual(associatedDataSets);
            });

            it("should translate procedure dataElements formName and description", function () {
                var translatedValue = "translatedValue";
                expect(scope.originOrgUnits).toEqual([origin2, origin1, origin4, origin3]);
                expect(scope.program).toEqual(program);

                translationsService.translate.and.returnValue(associatedDataSets);
                translationsService.getTranslationForProperty.and.returnValue(translatedValue);
                lineListOfflineApprovalController = new LineListOfflineApprovalController(scope, q, programEventRepository, orgUnitRepository, programRepository, optionSetRepository, dataSetRepository, referralLocationsRepository, excludedDataElementsRepository, translationsService);

                scope.$apply();

                expect(scope.proceduresPerformed).toEqual({
                    "translatedValue": [{
                        "title": translatedValue,
                        "description": translatedValue
                    }, {
                        "title": translatedValue,
                        "description": translatedValue
                    }]
                });
            });

            it("should return set showFilters to false if there are no events", function() {
                programEventRepository.getEventsForPeriod.and.returnValue(utils.getPromise(q, []));
                lineListOfflineApprovalController = new LineListOfflineApprovalController(scope, q, programEventRepository, orgUnitRepository, programRepository, optionSetRepository, dataSetRepository, referralLocationsRepository, excludedDataElementsRepository, translationsService);
                scope.$apply();

                expect(scope.showFilters).toEqual(false);
            });

            it("should return true if there are procedure data values", function() {
                expect(scope.shouldShowProceduresInOfflineSummary()).toEqual(true);
            });

            it("should return false if there are no procedure data values", function() {
                programEventRepository.getEventsForPeriod.and.returnValue(utils.getPromise(q, []));
                lineListOfflineApprovalController = new LineListOfflineApprovalController(scope, q, programEventRepository, orgUnitRepository, programRepository, optionSetRepository, dataSetRepository, referralLocationsRepository, excludedDataElementsRepository, translationsService);
                scope.$apply();

                expect(scope.shouldShowProceduresInOfflineSummary()).toEqual(false);
            });

            it("should get referral count", function() {
                expect(scope.getReferralCount("ref 1")).toEqual(2);
            });

            it("should get count when no filters are applied", function() {
                expect(scope.getCount("Triage Status", false, false, "Green")).toEqual(2);
            });

            it("should get count when gender filter is applied", function() {
                expect(scope.getCount("Triage Status", true, false, "Green", "Male_er")).toEqual(1);
            });

            it("should get count when age filter is applied", function() {
                expect(scope.getCount("Triage Status", false, true, "Green", "Triage Status", [0, 5])).toEqual(1);
            });

            it("should get count when age and gender filter is applied", function() {
                expect(scope.getCount("Triage Status", true, true, "Green", "Female_er", [0, 5])).toEqual(1);
                expect(scope.getCount("Triage Status", true, true, "Green", "Male_er", [4, 15])).toEqual(1);
            });

            it("should get total count", function () {
                spyOn(scope, 'getCount').and.returnValue(2);
                var genderOptions = [{id: 'Female_er'}, {id: 'Male_er'}];
                var total = scope.getTotalCount("Triage Status", true, true, "Green", genderOptions, [0, 9999]);

                expect(scope.getCount).toHaveBeenCalledWith("Triage Status", true, true, "Green", "Female_er", [0, 9999]);
                expect(scope.getCount).toHaveBeenCalledWith("Triage Status", true, true, "Green", "Male_er", [0, 9999]);
                expect(total).toEqual(4);
            });

            it("should get total count when gender filter is undefined", function () {
                spyOn(scope, 'getCount').and.returnValue(2);
                var total = scope.getTotalCount("Triage Status", true, true, "Green", undefined, [0, 9999]);

                expect(scope.getCount).toHaveBeenCalledWith("Triage Status", true, true, "Green", undefined, [0, 9999]);
                expect(total).toEqual(2);
            });

            it("should get procedure count when no filters are applied", function() {
                expect(scope.getProcedureCount(false, false, "procedure 1")).toEqual(3);
                expect(scope.getProcedureCount(false, false, "procedure 2")).toEqual(1);
            });

            it("should get procedure count when gender filter is applied", function() {
                expect(scope.getProcedureCount(true, false, "procedure 1", "Male_er")).toEqual(2);
                expect(scope.getProcedureCount(true, false, "procedure 1", "Female_er")).toEqual(1);
                expect(scope.getProcedureCount(true, false, "procedure 2", "Female_er")).toEqual(1);
            });

            it("should get procedure count when age filter is applied", function() {
                expect(scope.getProcedureCount(false, true, "procedure 1", "", [0, 5])).toEqual(1);
            });

            it("should get procedure count when age and gender filter is applied", function() {
                expect(scope.getProcedureCount(true, true, "procedure 1", "Female_er", [0, 5])).toEqual(1);
                expect(scope.getProcedureCount(true, true, "procedure 1", "Male_er", [4, 15])).toEqual(2);
            });

            it("should get total procedure count", function () {
                spyOn(scope, 'getProcedureCount').and.returnValue(2);
                var genderOptions = [{id: 'Female_er'}, {id: 'Male_er'}];
                var total = scope.getTotalProcedureCount(true, true, "Green", genderOptions, [0, 9999]);

                expect(scope.getProcedureCount).toHaveBeenCalledWith(true, true, "Green", "Female_er", [0, 9999]);
                expect(scope.getProcedureCount).toHaveBeenCalledWith(true, true, "Green", "Male_er", [0, 9999]);
                expect(total).toEqual(4);
            });

            it("should get total procedure count when gender filter is undefined", function () {
                spyOn(scope, 'getProcedureCount').and.returnValue(2);
                var total = scope.getTotalProcedureCount(true, true, "Green", undefined, [0, 9999]);

                expect(scope.getProcedureCount).toHaveBeenCalledWith(true, true, "Green", undefined, [0, 9999]);
                expect(total).toEqual(2);
            });

            it("should return true if it should be shown in offline summary else false", function() {
                var allDataElements = [{
                    "name": "test",
                    "dataElement": {
                        "id": "Triage Status",
                        "code": "triage_status_showInOfflineSummary",
                        "optionSet": {
                            "id": "os1",
                            "options": []
                        }

                    }
                }, {
                    "name": "de2",
                    "dataElement": {
                        "id": "Case Number",
                        "code": "case_number_showInOfflineSummary"
                    }
                }];
                expect(scope.shouldShowInOfflineSummary("Triage Status", allDataElements)).toEqual(true);
                expect(scope.shouldShowInOfflineSummary("Case Number", allDataElements)).toEqual(false);
            });

            describe('isValidWeek', function () {
                beforeEach(function () {
                    Timecop.install();
                    Timecop.freeze('2016-09-06T05:52:49.027Z'); // week 36
                });

                afterEach(function() {
                    Timecop.returnToPresent();
                    Timecop.uninstall();
                });

                it('should set isValidWeek to true if current week within last 12 weeks', function () {
                    scope.$apply();
                    scope.week = {
                        weekNumber: 20,
                        weekYear: 2016,
                        startOfWeek: "2016-05-16"
                    };

                    expect(scope.isValidWeek).toBeTruthy();
                });
            });
        });
    });
