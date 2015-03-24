define(["lineListDataEntryController", "angularMocks", "utils", "moment", "timecop", "programRepository", "programEventRepository", "dataElementRepository", "systemSettingRepository",
        "orgUnitRepository", "testData", "approvalDataRepository", "datasetRepository", "patientOriginRepository"
    ],
    function(LineListDataEntryController, mocks, utils, moment, timecop, ProgramRepository, ProgramEventRepository, DataElementRepository, SystemSettingRepo,
        OrgUnitRepository, testData, ApprovalDataRepository, DatasetRepository, PatientOriginRepository) {
        describe("lineListDataEntryController ", function() {

            var scope, q, hustle, programRepository, db, mockStore, dataElementRepository, allEvents, timeout,
                fakeModal, anchorScroll, location, event1, event2, event3, event4, systemSettingRepo, systemSettings,
                orgUnitRepository, optionSets, dataSets, approvalDataRepository, datasetRepository, patientOriginRepository;

            beforeEach(module('hustle'));
            beforeEach(mocks.inject(function($rootScope, $q, $hustle, $timeout, $location) {
                scope = $rootScope.$new();
                q = $q;
                hustle = $hustle;
                timeout = $timeout;
                location = $location;
                anchorScroll = jasmine.createSpy();

                fakeModal = {
                    close: function() {
                        this.result.confirmCallBack();
                    },
                    dismiss: function(type) {
                        this.result.cancelCallback(type);
                    },
                    open: function(object) {}
                };

                db = {
                    "objectStore": function() {}
                };

                var getMockStore = function(data) {
                    var getAll = function() {
                        return utils.getPromise(q, data);
                    };

                    return {
                        getAll: getAll

                    };
                };

                optionSets = [{
                    'id': 'os2',
                    'options': [{
                        'id': 'os2o1',
                        'name': 'os2o1 name'
                    }]
                }];

                dataSets = [{
                    "name": "Vaccination",
                    "id": "Vacc",
                    "organisationUnits": [{
                        "id": "currentModuleId"
                    }],
                    "orgUnitIds": ["currentModuleId"],
                    "attributeValues": [{
                        "attribute": {
                            "id": "wFC6joy3I8Q",
                            "code": "isNewDataModel"
                        },
                        "value": "true"
                    }]
                }];

                spyOn(db, 'objectStore').and.callFake(function(storeName) {
                    if (storeName === "optionSets")
                        return getMockStore(optionSets);
                    if (storeName === "dataSets")
                        return getMockStore(dataSets);
                    return getMockStore({});
                });

                Timecop.install();
                Timecop.freeze(new Date("2014-10-29T12:43:54.972Z"));

                scope.resourceBundle = {};
                scope.week = {
                    "weekNumber": 44,
                    "weekYear": 2014,
                    "startOfWeek": "2014-10-27",
                    "endOfWeek": "2014-11-02"
                };
                scope.currentModule = {
                    'id': 'currentModuleId',
                    'parent': {
                        'id': 'par1'
                    }
                };
                scope.currentUser = {
                    "firstName": "foo",
                    "lastName": "bar",
                    "userCredentials": {
                        "username": "dataentryuser",
                        "userRoles": [{
                            "id": "hxNB8lleCsl",
                            "name": 'Data Entry User'
                        }]
                    }
                };
                scope.currentUserProject = {
                    "id": "prj1"
                };

                event1 = {
                    event: 'event1',
                    eventDate: '2014-12-29T05:06:30.950+0000',
                    dataValues: [{
                        dataElement: 'de1',
                        value: 'a11',
                        showInEventSummary: true,
                        name: 'dataElement1',
                    }]
                };

                event2 = {
                    event: 'event2',
                    eventDate: '2014-12-29T05:06:30.950+0000',
                    dataValues: [{
                        dataElement: 'de2',
                        value: 'b22',
                        showInEventSummary: false,
                        name: 'dataElement2',
                    }]
                };

                programRepository = new ProgramRepository();
                programEventRepository = new ProgramEventRepository();
                dataElementRepository = new DataElementRepository();
                systemSettingRepo = new SystemSettingRepo();
                orgUnitRepository = new OrgUnitRepository();
                approvalDataRepository = new ApprovalDataRepository();
                datasetRepository = new DatasetRepository();
                patientOriginRepository = new PatientOriginRepository();

                programEventRepository = {
                    "getEvent": jasmine.createSpy("getAll"),
                    "getEventsFor": jasmine.createSpy("getEventsFor").and.returnValue(utils.getPromise(q, [])),
                    "upsert": jasmine.createSpy("upsert").and.returnValue(utils.getPromise(q, [])),
                    "delete": jasmine.createSpy("delete").and.returnValue(utils.getPromise(q, {})),
                    "markEventsAsSubmitted": jasmine.createSpy("delete").and.returnValue(utils.getPromise(q, {}))
                };

                systemSettings = {
                    "key": "currentModuleId",
                    "value": {
                        "clientLastUpdated": "2014-12-29T05:06:30.950+0000",
                        'dataElements': ['de1', 'de3']
                    }
                };

                systemSettingRepo = {
                    "get": jasmine.createSpy("get").and.returnValue(utils.getPromise(q, systemSettings))
                };

                programEventRepository.getEventsFor.and.callFake(function(programId) {
                    if (programId === "p1")
                        return utils.getPromise(q, [event1, event2]);
                    if (programId === "p2")
                        return utils.getPromise(q, event1);
                    return utils.getPromise(q, undefined);
                });
                var project = {
                    "id": "parentProjectId",
                    "name": "Prj1",
                    "level": 3,
                    "shortName": "Prj1",
                    "openingDate": "2010-01-01",
                    "parent": {
                        "name": "Haiti",
                        "id": "id1"
                    },
                    "attributeValues": [{
                        "attribute": {
                            "code": "autoApprove",
                            "name": "Auto Approve"
                        },
                        "value": "true"
                    }]
                };

                var patientOrigins = {
                    "origins": [{
                        "name": "Origin1"
                    }, {
                        "name": "Origin2"
                    }]
                };

                spyOn(orgUnitRepository, "getParentProject").and.returnValue(utils.getPromise(q, project));
                spyOn(approvalDataRepository, "getApprovalData").and.returnValue(utils.getPromise(q, {}));
                spyOn(datasetRepository, "getAllForOrgUnit").and.returnValue(utils.getPromise(q, [{
                    "id": "Vacc"
                }]));
                spyOn(patientOriginRepository, "get").and.returnValue(utils.getPromise(q, patientOrigins));
            }));

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            it("should set projectIsAutoApproved on scope on init", function() {
                spyOn(programRepository, "get").and.returnValue(utils.getPromise(q, {}));

                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, db, programRepository, programEventRepository, dataElementRepository, systemSettingRepo, orgUnitRepository, approvalDataRepository, datasetRepository, patientOriginRepository);
                scope.$apply();

                expect(scope.projectIsAutoApproved).toEqual(true);
            });

            it("should set isCompleted and isApproved on scope on init", function() {
                spyOn(programRepository, "get").and.returnValue(utils.getPromise(q, {}));

                approvalDataRepository = new ApprovalDataRepository();

                spyOn(approvalDataRepository, "getApprovalData").and.returnValue(utils.getPromise(q, {
                    'isComplete': true,
                    'isApproved': true
                }));
                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, db, programRepository, programEventRepository, dataElementRepository, systemSettingRepo, orgUnitRepository, approvalDataRepository, datasetRepository, patientOriginRepository);
                scope.$apply();
                expect(scope.isCompleted).toEqual(true);
                expect(scope.isApproved).toEqual(true);
            });

            it("should load programs into scope on init", function() {
                var programAndStageData = {
                    'id': 'p1'
                };
                spyOn(programRepository, "get").and.returnValue(utils.getPromise(q, programAndStageData));

                scope.programId = 'p1';
                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, db, programRepository, programEventRepository, dataElementRepository, systemSettingRepo, orgUnitRepository, approvalDataRepository, datasetRepository, patientOriginRepository);
                scope.$apply();

                expect(programRepository.get).toHaveBeenCalledWith('p1', ['de1', 'de3']);
                expect(scope.program).toEqual(programAndStageData);
            });

            it("should load all optionSets to scope on init", function() {
                spyOn(programRepository, "get").and.returnValue(utils.getPromise(q, {}));
                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, db, programRepository, programEventRepository, dataElementRepository, systemSettingRepo, orgUnitRepository, approvalDataRepository, datasetRepository, patientOriginRepository);
                scope.$apply();

                expect(scope.optionSets).toBe(optionSets);
            });

            it("should load associatedDatasetIds to scope on init", function() {
                spyOn(programRepository, "get").and.returnValue(utils.getPromise(q, {}));
                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, db, programRepository, programEventRepository, dataElementRepository, systemSettingRepo, orgUnitRepository, approvalDataRepository, datasetRepository, patientOriginRepository);
                scope.$apply();

                expect(scope.dataSetIds).toEqual(['Vacc']);
            });

            it("should load patient origins to scope on init", function() {
                spyOn(programRepository, "get").and.returnValue(utils.getPromise(q, {}));
                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, db, programRepository, programEventRepository, dataElementRepository, systemSettingRepo, orgUnitRepository, approvalDataRepository, datasetRepository, patientOriginRepository);
                scope.$apply();

                expect(scope.patientOrigins).toEqual([{
                    "name": "Origin1"
                }, {
                    "name": "Origin2"
                }]);
            });

            it("should load all system settings on init", function() {
                scope.programId = "p2";

                var program = {
                    "id": "p2",
                    "name": "Surgery - V1",
                    "programStages": [{
                        "id": "a40aa8ce8d5",
                        "name": "Surgery - V1 Stage",
                        "programStageSections": [{
                            "id": "W2SSCuf7fv8",
                            "name": "Surgery",
                            "programStageDataElements": [{
                                "dataElement": {
                                    "id": "de1",
                                    "name": "Patient ID - V1 - Surgery",
                                    "type": "string",
                                    "isExcluded": true
                                }
                            }, {
                                "dataElement": {
                                    "id": "de2",
                                    "name": "Type of patient - V1 - Surgery",
                                    "type": "string",
                                    "isExcluded": false
                                }

                            }]
                        }]
                    }]
                };

                var expectedProgram = {
                    "id": "p2",
                    "name": "Surgery - V1",
                    "programStages": [{
                        "id": "a40aa8ce8d5",
                        "name": "Surgery - V1 Stage",
                        "programStageSections": [{
                            "id": "W2SSCuf7fv8",
                            "name": "Surgery",
                            "programStageDataElements": [{
                                "dataElement": {
                                    "id": "de1",
                                    "name": "Patient ID - V1 - Surgery",
                                    "type": "string",
                                    "isExcluded": true
                                }
                            }, {
                                "dataElement": {
                                    "id": "de2",
                                    "name": "Type of patient - V1 - Surgery",
                                    "type": "string",
                                    "isExcluded": false
                                }

                            }]
                        }]
                    }]
                };
                spyOn(programRepository, "get").and.returnValue(utils.getPromise(q, program));
                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, db, programRepository, programEventRepository, dataElementRepository, systemSettingRepo, orgUnitRepository, approvalDataRepository, datasetRepository, patientOriginRepository);
                scope.$apply();

                expect(scope.program).toEqual(expectedProgram);
            });

            it("should find optionSets for id", function() {
                spyOn(programRepository, "get").and.returnValue(utils.getPromise(q, {}));
                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, db, programRepository, programEventRepository, dataElementRepository, systemSettingRepo, orgUnitRepository, approvalDataRepository, datasetRepository, patientOriginRepository);
                scope.$apply();

                expect(scope.getOptionsFor('os2')).toEqual([{
                    'id': 'os2o1',
                    'name': 'os2o1 name',
                    'displayName': 'os2o1 name'
                }]);
            });

            it("should translate options", function() {
                scope.resourceBundle = {
                    'os2o1': 'os2o1 translated name'
                };

                spyOn(programRepository, "get").and.returnValue(utils.getPromise(q, {}));
                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, db, programRepository, programEventRepository, dataElementRepository, systemSettingRepo, orgUnitRepository, approvalDataRepository, datasetRepository, patientOriginRepository);
                scope.$apply();

                expect(scope.getOptionsFor('os2')).toEqual([{
                    'id': 'os2o1',
                    'name': 'os2o1 name',
                    'displayName': 'os2o1 translated name'
                }]);
            });

            it("should update dataValues with new program and stage if not present", function() {
                var dataValues = {};

                spyOn(programRepository, "get").and.returnValue(utils.getPromise(q, {}));
                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, db, programRepository, programEventRepository, dataElementRepository, systemSettingRepo, orgUnitRepository, approvalDataRepository, datasetRepository, patientOriginRepository);
                scope.$apply();

                scope.getDataValueNgModel(dataValues, 'p1', 'ps1');

                expect(dataValues).toEqual({
                    'p1': {
                        'ps1': {}
                    }
                });
            });

            it("should change dataValues", function() {
                var dataValues = {
                    'p1': {
                        'ps1': {}
                    }
                };

                spyOn(programRepository, "get").and.returnValue(utils.getPromise(q, {}));
                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, db, programRepository, programEventRepository, dataElementRepository, systemSettingRepo, orgUnitRepository, approvalDataRepository, datasetRepository, patientOriginRepository);
                scope.$apply();

                scope.getDataValueNgModel(dataValues, 'p1', 'ps2');

                expect(dataValues).toEqual({
                    'p1': {
                        'ps1': {},
                        'ps2': {}
                    }
                });
            });

            it("should get eventDates with default set to today", function() {
                var eventDates = {};

                spyOn(programRepository, "get").and.returnValue(utils.getPromise(q, {}));
                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, db, programRepository, programEventRepository, dataElementRepository, systemSettingRepo, orgUnitRepository, approvalDataRepository, datasetRepository, patientOriginRepository);
                scope.$apply();

                scope.getEventDateNgModel(eventDates, 'p1', 'ps1');

                expect(moment(eventDates.p1.ps1).isSame(scope.minDateInCurrentPeriod, 'days')).toBe(true);
            });

            it("should set min and max date for selected period", function() {

                scope.week = {
                    "weekNumber": 46,
                    "weekYear": 2014,
                    "startOfWeek": "2014-11-10",
                    "endOfWeek": "2014-11-16"
                };

                spyOn(programRepository, "get").and.returnValue(utils.getPromise(q, {}));
                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, db, programRepository, programEventRepository, dataElementRepository, systemSettingRepo, orgUnitRepository, approvalDataRepository, datasetRepository, patientOriginRepository);
                scope.$apply();

                expect(moment(scope.minDateInCurrentPeriod).format("YYYY-MM-DD")).toEqual("2014-11-10");
                expect(moment(scope.maxDateInCurrentPeriod).format("YYYY-MM-DD")).toEqual("2014-11-16");
            });

            it("should save event details as newDraft and show view", function() {
                var program = {
                    'id': 'Prg1',
                };

                var programStage = {
                    'id': 'PrgStage1',
                    'programStageDataElements': []
                };

                spyOn(location, "hash");

                scope.resourceBundle = {
                    'eventSaveSuccess': 'Event saved successfully'
                };
                scope.programId = "p2";

                spyOn(programRepository, "get").and.returnValue(utils.getPromise(q, []));
                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, db, programRepository, programEventRepository, dataElementRepository, systemSettingRepo, orgUnitRepository, approvalDataRepository, datasetRepository, patientOriginRepository);
                scope.$apply();

                scope.eventDates = {
                    "Prg1": {
                        "PrgStage1": "2014-11-18T10:34:14.067Z"
                    }
                };

                scope.dataValues = {
                    "Prg1": {
                        "PrgStage1": {}
                    }
                };

                scope.save(program, programStage);
                scope.$apply();

                var actualPayloadInUpsertCall = programEventRepository.upsert.calls.first().args[0];

                expect(actualPayloadInUpsertCall.events[0].program).toEqual("Prg1");
                expect(actualPayloadInUpsertCall.events[0].programStage).toEqual("PrgStage1");
                expect(actualPayloadInUpsertCall.events[0].orgUnit).toEqual("currentModuleId");
                expect(actualPayloadInUpsertCall.events[0].eventDate).toEqual("2014-11-18");
                expect(actualPayloadInUpsertCall.events[0].localStatus).toEqual("NEW_DRAFT");
                expect(actualPayloadInUpsertCall.events[0].dataValues).toEqual([]);

                expect(scope.resultMessageType).toEqual("success");
                expect(scope.resultMessage).toEqual("Event saved successfully");
                expect(location.hash).toHaveBeenCalled();

                expect(programEventRepository.getEventsFor).toHaveBeenCalled();
                var expectedEvents = [event1];
                expect(scope.allEvents).toEqual(expectedEvents);

                expect(scope.showView).toEqual(true);
                expect(scope.showForm).toEqual(false);
            });

            it("should save event details as newDraft and show form again", function() {
                var program = {
                    'id': 'Prg1',
                };

                var programStage = {
                    'id': 'PrgStage1',
                };

                spyOn(programRepository, "get").and.returnValue(utils.getPromise(q, {}));
                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, db, programRepository, programEventRepository, dataElementRepository, systemSettingRepo, orgUnitRepository, approvalDataRepository, datasetRepository, patientOriginRepository);
                scope.$apply();

                scope.eventDates = {
                    "Prg1": {
                        "PrgStage1": "2014-11-18T10:34:14.067Z"
                    }
                };

                scope.save(program, programStage, true);
                scope.$apply();

                expect(scope.showView).toEqual(false);
                expect(scope.showForm).toEqual(true);
            });

            it("should submit event details", function() {
                scope.programId = "Prg1";
                spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, ""));
                spyOn(location, "hash");

                scope.resourceBundle = {
                    'eventSubmitSuccess': 'Event submitted succesfully'
                };

                spyOn(programRepository, "get").and.returnValue(utils.getPromise(q, {}));
                spyOn(approvalDataRepository, "clearApprovals").and.returnValue(utils.getPromise(q, {}));
                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, db, programRepository, programEventRepository, dataElementRepository, systemSettingRepo, orgUnitRepository, approvalDataRepository, datasetRepository, patientOriginRepository);
                scope.$apply();
                scope.year = "2014";

                scope.submit();
                scope.$apply();

                expect(programEventRepository.markEventsAsSubmitted).toHaveBeenCalledWith("Prg1", "2014W44", "currentModuleId");
                expect(approvalDataRepository.clearApprovals).toHaveBeenCalledWith({
                    "period": "2014W44",
                    "orgUnit": "currentModuleId"
                });
                expect(hustle.publish).toHaveBeenCalledWith({
                    type: 'uploadProgramEvents'
                }, 'dataValues');
                expect(hustle.publish).toHaveBeenCalledWith({
                    "data": {
                        "period": "2014W44",
                        "orgUnit": "currentModuleId"
                    },
                    "type": "deleteApprovals"
                }, "dataValues");
                expect(scope.resultMessageType).toEqual("success");
                expect(scope.resultMessage).toEqual("Event submitted succesfully");
                expect(location.hash).toHaveBeenCalled();
            });

            it("should warn the user when data will have to be reapproved", function() {
                scope.programId = "Prg1";
                approvalDataRepository = new ApprovalDataRepository();
                spyOn(approvalDataRepository, "getApprovalData").and.returnValue(utils.getPromise(q, {
                    'isComplete': true,
                    'isApproved': true
                }));
                spyOn(fakeModal, "open").and.returnValue({
                    result: utils.getPromise(q, {})
                });

                spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, ""));
                spyOn(location, "hash");

                scope.resourceBundle = {
                    'eventSubmitSuccess': 'Event submitted succesfully'
                };

                spyOn(programRepository, "get").and.returnValue(utils.getPromise(q, {}));
                spyOn(approvalDataRepository, "clearApprovals").and.returnValue(utils.getPromise(q, {}));
                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, db, programRepository, programEventRepository, dataElementRepository, systemSettingRepo, orgUnitRepository, approvalDataRepository, datasetRepository, patientOriginRepository);
                scope.$apply();
                scope.year = "2014";

                scope.submit();
                scope.$apply();

                expect(fakeModal.open).toHaveBeenCalled();
            });

            it("should submit and auto approve event details", function() {
                spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, ""));
                spyOn(location, "hash");

                scope.resourceBundle = {
                    "eventSubmitAndApproveSuccess": "Event(s) submitted and auto-approved successfully."
                };

                spyOn(programRepository, "get").and.returnValue(utils.getPromise(q, {}));
                spyOn(approvalDataRepository, "markAsAccepted").and.returnValue(utils.getPromise(q, {}));

                scope.programId = "Prg1";
                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, db, programRepository, programEventRepository, dataElementRepository, systemSettingRepo, orgUnitRepository, approvalDataRepository, datasetRepository, patientOriginRepository);
                scope.$apply();

                scope.year = "2014";
                scope.submitAndApprove();
                scope.$apply();

                expect(programEventRepository.markEventsAsSubmitted).toHaveBeenCalledWith("Prg1", "2014W44", "currentModuleId");
                expect(hustle.publish).toHaveBeenCalledWith({
                    type: 'uploadProgramEvents'
                }, 'dataValues');
                expect(approvalDataRepository.markAsAccepted).toHaveBeenCalledWith({
                    'orgUnit': 'currentModuleId',
                    'period': '2014W44'
                }, 'dataentryuser');
                expect(scope.resultMessageType).toEqual("success");
                expect(scope.resultMessage).toEqual("Event(s) submitted and auto-approved successfully.");
                expect(location.hash).toHaveBeenCalled();
            });

            it("should warn the user if data is to be re-approved automatically", function() {
                approvalDataRepository = new ApprovalDataRepository();
                spyOn(approvalDataRepository, "getApprovalData").and.returnValue(utils.getPromise(q, {
                    'isComplete': true,
                    'isApproved': true
                }));
                spyOn(fakeModal, "open").and.returnValue({
                    result: utils.getPromise(q, {})
                });

                spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, ""));
                spyOn(location, "hash");

                scope.resourceBundle = {
                    "eventSubmitAndApproveSuccess": "Event(s) submitted and auto-approved successfully."
                };

                spyOn(programRepository, "get").and.returnValue(utils.getPromise(q, {}));
                spyOn(approvalDataRepository, "markAsAccepted").and.returnValue(utils.getPromise(q, {}));

                scope.programId = "Prg1";
                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, db, programRepository, programEventRepository, dataElementRepository, systemSettingRepo, orgUnitRepository, approvalDataRepository, datasetRepository, patientOriginRepository);
                scope.$apply();
                scope.year = "2014";

                scope.submitAndApprove();
                scope.$apply();

                expect(fakeModal.open).toHaveBeenCalled();
                expect(programEventRepository.markEventsAsSubmitted).toHaveBeenCalledWith("Prg1", "2014W44", "currentModuleId");
                expect(approvalDataRepository.markAsAccepted).toHaveBeenCalledWith({
                    'orgUnit': 'currentModuleId',
                    'period': '2014W44'
                }, 'dataentryuser');
                expect(hustle.publish).toHaveBeenCalledWith({
                    type: 'uploadProgramEvents'
                }, 'dataValues');
            });

            it("should soft-delete event which is POSTed to DHIS", function() {
                spyOn(programRepository, "get").and.returnValue(utils.getPromise(q, []));
                spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, ""));
                spyOn(fakeModal, "open").and.returnValue({
                    result: utils.getPromise(q, {})
                });

                scope.programId = "p1";
                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, db, programRepository, programEventRepository, dataElementRepository, systemSettingRepo, orgUnitRepository, approvalDataRepository, datasetRepository, patientOriginRepository);

                var eventToDelete = event1;
                scope.deleteEvent(eventToDelete);
                scope.$apply();

                var softDeletedEventPayload = {
                    "events": [eventToDelete]
                };

                expect(fakeModal.open).toHaveBeenCalled();
                expect(hustle.publish).toHaveBeenCalledWith({
                    data: 'event1',
                    type: 'deleteEvent'
                }, 'dataValues');
                expect(programEventRepository.upsert).toHaveBeenCalledWith(softDeletedEventPayload);
                expect(eventToDelete.localStatus).toEqual("DELETED");
                expect(programEventRepository.getEventsFor).toHaveBeenCalled();
            });

            it("should hard delete a local event", function() {
                event1.localStatus = "NEW_DRAFT";
                scope.programId = "p1";
                spyOn(programRepository, "get").and.returnValue(utils.getPromise(q, []));
                spyOn(hustle, "publish");
                spyOn(fakeModal, "open").and.returnValue({
                    result: utils.getPromise(q, {})
                });

                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, db, programRepository, programEventRepository, dataElementRepository, systemSettingRepo, orgUnitRepository, approvalDataRepository, datasetRepository, patientOriginRepository);

                var eventToDelete = event1;
                scope.deleteEvent(eventToDelete);
                scope.$apply();

                expect(fakeModal.open).toHaveBeenCalled();
                expect(programEventRepository.delete).toHaveBeenCalledWith('event1');
                expect(hustle.publish).not.toHaveBeenCalled();
                expect(programEventRepository.getEventsFor).toHaveBeenCalled();
            });

            it("should soft delete a locally updated event which is already submitted to DHIS", function() {
                event1.localStatus = "UPDATED_DRAFT";
                scope.programId = "p1";
                spyOn(programRepository, "get").and.returnValue(utils.getPromise(q, []));
                spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, ""));
                spyOn(fakeModal, "open").and.returnValue({
                    result: utils.getPromise(q, {})
                });

                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, db, programRepository, programEventRepository, dataElementRepository, systemSettingRepo, orgUnitRepository, approvalDataRepository, datasetRepository, patientOriginRepository);

                var eventToDelete = event1;
                scope.deleteEvent(eventToDelete);
                scope.$apply();

                var softDeletedEventPayload = {
                    "events": [eventToDelete]
                };

                expect(fakeModal.open).toHaveBeenCalled();
                expect(hustle.publish).toHaveBeenCalledWith({
                    data: 'event1',
                    type: 'deleteEvent'
                }, 'dataValues');
                expect(programEventRepository.upsert).toHaveBeenCalledWith(softDeletedEventPayload);
                expect(eventToDelete.localStatus).toEqual("DELETED");
                expect(programEventRepository.getEventsFor).toHaveBeenCalled();
            });

            it("should get data value", function() {
                var dataValue = {
                    "id": "dv1",
                    "value": "Case123"
                };
                spyOn(programRepository, "get").and.returnValue(utils.getPromise(q, {}));
                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, db, programRepository, programEventRepository, dataElementRepository, systemSettingRepo, orgUnitRepository, approvalDataRepository, datasetRepository, patientOriginRepository);
                var actualValue = scope.getDisplayValue(dataValue);
                scope.$apply();

                expect(actualValue).toEqual("Case123");
            });

            it("should get option names as data value if options are present", function() {
                var dataValue = {
                    "id": "dv1",
                    "optionSet": {
                        "options": [{
                            "id": "Code1",
                            "code": "Code1",
                            "name": "Male"
                        }, {
                            "id": "Code2",
                            "code": "Code2",
                            "name": "Female"
                        }]
                    },
                    "value": "Code1"
                };

                spyOn(programRepository, "get").and.returnValue(utils.getPromise(q, {}));
                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, db, programRepository, programEventRepository, dataElementRepository, systemSettingRepo, orgUnitRepository, approvalDataRepository, datasetRepository, patientOriginRepository);
                var actualValue = scope.getDisplayValue(dataValue);
                scope.$apply();

                expect(actualValue).toEqual("Male");
            });

            it("should get all event and set correct event to be edited if route params has id", function() {
                var optionSets = [{
                    'id': 'os1'
                }];
                var program = {
                    "id": "ab1cbd4f11a",
                    "name": "Surgery - V1",
                    "programStages": [{
                        "id": "a40aa8ce8d5",
                        "name": "Surgery - V1 Stage",
                        "programStageSections": [{
                            "id": "W2SSCuf7fv8",
                            "name": "Surgery",
                            "programStageDataElements": [{
                                "dataElement": {
                                    "id": "de1",
                                    "name": "Patient ID - V1 - Surgery",
                                    "type": "string"
                                }
                            }, {
                                "dataElement": {
                                    "id": "de2",
                                    "name": "Type of patient - V1 - Surgery",
                                    "type": "string"
                                }

                            }]
                        }]
                    }]
                };

                var expectedEvent = {
                    "event": 'event1',
                    "program": {
                        "id": "ab1cbd4f11a",
                        "name": "Surgery - V1",
                        "programStages": [{
                            "id": "a40aa8ce8d5",
                            "name": "Surgery - V1 Stage",
                            "programStageSections": [{
                                "id": "W2SSCuf7fv8",
                                "name": "Surgery",
                                "programStageDataElements": [{
                                    "dataElement": {
                                        "id": "de1",
                                        "name": "Patient ID - V1 - Surgery",
                                        "type": "string",
                                        "isExcluded": true
                                    }
                                }, {
                                    "dataElement": {
                                        "id": "de2",
                                        "name": "Type of patient - V1 - Surgery",
                                        "type": "string",
                                        "isExcluded": false
                                    }

                                }]
                            }]
                        }]
                    },
                    "dataValues": [{
                        "dataElement": 'de1',
                        "value": 'a11',
                        "showInEventSummary": true,
                        "name": 'dataElement1',
                    }],
                    "dataElementValues": {
                        "de1": 'a11'
                    }
                };

                spyOn(programRepository, "get").and.returnValue(utils.getPromise(q, program));
                programEventRepository.getEvent.and.returnValue(utils.getPromise(q, event1));
                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, db, programRepository, programEventRepository, dataElementRepository, systemSettingRepo, orgUnitRepository, approvalDataRepository, datasetRepository, patientOriginRepository);
                scope.$apply();

                scope.setUpViewOrEditForm('event1');
                scope.$apply();

                expect(programEventRepository.getEvent).toHaveBeenCalled();
                expect(scope.eventToBeEdited).toEqual(event1);
            });

            it("should not allow event creation , edit or deleting if selected week is beyond configured week", function() {
                scope.week = {
                    "startOfWeek": "2014-02-02",
                    "weekNumber": 05,
                    "weekYear": 2014
                };

                spyOn(programRepository, "get").and.returnValue(utils.getPromise(q, {}));

                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, db, programRepository, programEventRepository, dataElementRepository, systemSettingRepo, orgUnitRepository, approvalDataRepository, datasetRepository, patientOriginRepository);

                expect(scope.isDataEntryAllowed()).toBeFalsy();
                scope.$apply();
            });

            it("should update event details", function() {
                var program = {
                    'id': 'Prg1',
                };

                var programStage = {
                    'id': 'PrgStage1',
                    'programStageDataElements': [{
                        "dataElement": {
                            "id": "de1",
                            "name": "Patient ID - V1 - Surgery",
                            "type": "string",
                            "isExcluded": true
                        }
                    }]
                };

                spyOn(location, "hash");

                scope.resourceBundle = {
                    'eventSaveSuccess': 'Event updated successfully'
                };

                scope.eventToBeEdited = {
                    "event": "event1",
                    "program": program,
                    "programStage": programStage,
                    "orgUnit": "Mod1",
                    "eventDate": "2014-12-29T05:06:30.950+0000",
                    "dataElementValues": {
                        "de1": "12"
                    }
                };

                spyOn(programRepository, "get").and.returnValue(utils.getPromise(q, []));
                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, db, programRepository, programEventRepository, dataElementRepository, systemSettingRepo, orgUnitRepository, approvalDataRepository, datasetRepository, patientOriginRepository);
                scope.$apply();

                scope.update(programStage);
                scope.$apply();

                var eventPayload = {
                    "events": [{
                        'event': "event1",
                        'program': "Prg1",
                        'programStage': programStage,
                        'orgUnit': "Mod1",
                        'eventDate': "2014-12-29",
                        'dataValues': [{
                            "dataElement": "de1",
                            "value": "12"
                        }],
                        'localStatus': "UPDATED_DRAFT"
                    }]
                };

                expect(programEventRepository.upsert).toHaveBeenCalledWith(eventPayload);
                expect(scope.resultMessageType).toEqual("success");
                expect(scope.resultMessage).toEqual("Event updated successfully");
                expect(scope.showView).toEqual(true);
                expect(scope.showEditForm).toEqual(false);

            });
        });
    });
