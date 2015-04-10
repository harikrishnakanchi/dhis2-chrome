define(["lineListSummaryController", "angularMocks", "utils", "moment", "timecop", "programRepository", "programEventRepository", "systemSettingRepository",
        "orgUnitRepository", "testData", "approvalDataRepository"
    ],
    function(LineListSummaryController, mocks, utils, moment, timecop, ProgramRepository, ProgramEventRepository, SystemSettingRepository,
        OrgUnitRepository, testData, ApprovalDataRepository) {

        describe("lineListSummaryController ", function() {

            var scope, q, hustle, programRepository, mockStore, timeout, fakeModal, anchorScroll, location,
                event1, event2, event3, event4, systemSettingRepository, systemSettings,
                orgUnitRepository, optionSets, approvalDataRepository, originOrgUnits;

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

                optionSets = [{
                    'id': 'os2',
                    'options': [{
                        'id': 'os2o1',
                        'name': 'os2o1 name'
                    }]
                }];

                Timecop.install();
                Timecop.freeze(new Date("2014-10-29T12:43:54.972Z"));

                scope.resourceBundle = {
                    "uploadProgramEventsDesc": "submit cases",
                    "deleteEventDesc": "delete cases",
                    "uploadApprovalDataDesc": "approve data at coordination level for ",
                    "uploadCompletionDataDesc": "approve data at project level for ",
                    "deleteApprovalsDesc": "restart approval process for ",
                    "eventSubmitAndApproveSuccess": "Event(s) submitted and auto-approved successfully.",
                    'eventSubmitSuccess': 'Event submitted succesfully'
                };
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
                    "locale": "en",
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

                var program = {
                    "id": "someProgram"
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
                systemSettingRepository = new SystemSettingRepository();
                orgUnitRepository = new OrgUnitRepository();
                approvalDataRepository = new ApprovalDataRepository();

                programRepository = {
                    "get": jasmine.createSpy("get").and.returnValue(utils.getPromise(q, program)),
                    "getProgramForOrgUnit": jasmine.createSpy("getProgramForOrgUnit").and.returnValue(utils.getPromise(q, program))
                };

                programEventRepository = {
                    "getEvent": jasmine.createSpy("getEvent"),
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

                systemSettingRepository = {
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

                originOrgUnits = [{
                    "id": "o1",
                    "name": "o1"
                }, {
                    "id": "o2",
                    "name": "o2"
                }];

                spyOn(orgUnitRepository, "getParentProject").and.returnValue(utils.getPromise(q, project));
                spyOn(orgUnitRepository, "findAllByParent").and.returnValue(utils.getPromise(q, originOrgUnits));
                spyOn(approvalDataRepository, "getApprovalData").and.returnValue(utils.getPromise(q, {}));
            }));

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            it("should set projectIsAutoApproved on scope on init", function() {
                var lineListSummaryController = new LineListSummaryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, programRepository, programEventRepository, systemSettingRepository, orgUnitRepository, approvalDataRepository);
                scope.$apply();

                expect(scope.projectIsAutoApproved).toEqual(true);
            });

            it("should set isCompleted and isApproved on scope on init", function() {

                approvalDataRepository = new ApprovalDataRepository();

                spyOn(approvalDataRepository, "getApprovalData").and.returnValue(utils.getPromise(q, {
                    'isComplete': true,
                    'isApproved': true
                }));
                var lineListSummaryController = new LineListSummaryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, programRepository, programEventRepository, systemSettingRepository, orgUnitRepository, approvalDataRepository);
                scope.$apply();
                expect(scope.isCompleted).toEqual(true);
                expect(scope.isApproved).toEqual(true);
            });

            it("should load programs into scope on init", function() {
                var programAndStageData = {
                    'id': 'someProgram',
                    'programStages': [{
                        'id': 'p1s1'
                    }, {
                        'id': 'p1s2'
                    }]
                };
                programRepository.get.and.returnValue(utils.getPromise(q, programAndStageData));

                var lineListSummaryController = new LineListSummaryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, programRepository, programEventRepository, systemSettingRepository, orgUnitRepository, approvalDataRepository);
                scope.$apply();

                expect(programRepository.get).toHaveBeenCalledWith('someProgram', ['de1', 'de3']);
                expect(scope.program).toEqual(programAndStageData);
            });

            it("should load patient origin org units on init", function() {
                var lineListSummaryController = new LineListSummaryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, programRepository, programEventRepository, systemSettingRepository, orgUnitRepository, approvalDataRepository);
                scope.$apply();

                expect(scope.originOrgUnits).toEqual(originOrgUnits);
            });

            it("should load all system settings on init", function() {

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

                programRepository.get.and.returnValue(utils.getPromise(q, program));
                var lineListSummaryController = new LineListSummaryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, programRepository, programEventRepository, systemSettingRepository, orgUnitRepository, approvalDataRepository);
                scope.$apply();

                expect(scope.program).toEqual(expectedProgram);
            });

            it("should submit event details", function() {
                spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, ""));
                spyOn(location, "hash");


                spyOn(approvalDataRepository, "clearApprovals").and.returnValue(utils.getPromise(q, {}));
                var lineListSummaryController = new LineListSummaryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, programRepository, programEventRepository, systemSettingRepository, orgUnitRepository, approvalDataRepository);
                scope.$apply();
                scope.year = "2014";
                scope.currentModule = {
                    'id': 'currentModuleId',
                    'name': 'Mod1'
                };

                scope.submit();
                scope.$apply();

                expect(programEventRepository.markEventsAsSubmitted).toHaveBeenCalledWith("someProgram", "2014W44", ["o1", "o2"]);
                expect(approvalDataRepository.clearApprovals).toHaveBeenCalledWith({
                    "period": "2014W44",
                    "orgUnit": "currentModuleId"
                });
                expect(hustle.publish).toHaveBeenCalledWith({
                    type: 'uploadProgramEvents',
                    locale: 'en',
                    desc: 'submit cases'
                }, 'dataValues');
                expect(hustle.publish).toHaveBeenCalledWith({
                    "data": {
                        "period": "2014W44",
                        "orgUnit": "currentModuleId"
                    },
                    "type": "deleteApprovals",
                    "locale": "en",
                    "desc": "restart approval process for 2014W44, Module: Mod1"
                }, "dataValues");
                expect(scope.resultMessageType).toEqual("success");
                expect(scope.resultMessage).toEqual("Event submitted succesfully");
                expect(location.hash).toHaveBeenCalled();
            });

            it("should warn the user when data will have to be reapproved", function() {
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

                spyOn(approvalDataRepository, "clearApprovals").and.returnValue(utils.getPromise(q, {}));
                var lineListSummaryController = new LineListSummaryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, programRepository, programEventRepository, systemSettingRepository, orgUnitRepository, approvalDataRepository);
                scope.$apply();
                scope.year = "2014";

                scope.submit();
                scope.$apply();

                expect(fakeModal.open).toHaveBeenCalled();
            });

            it("should submit and auto approve event details", function() {
                spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, ""));
                spyOn(location, "hash");

                spyOn(approvalDataRepository, "markAsApproved").and.returnValue(utils.getPromise(q, {}));

                var lineListSummaryController = new LineListSummaryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, programRepository, programEventRepository, systemSettingRepository, orgUnitRepository, approvalDataRepository);
                scope.$apply();

                scope.year = "2014";
                scope.currentModule = {
                    'id': 'currentModuleId',
                    'name': 'Mod1'
                };
                scope.submitAndApprove();
                scope.$apply();

                expect(programEventRepository.markEventsAsSubmitted).toHaveBeenCalledWith("someProgram", "2014W44", ["o1", "o2"]);
                expect(approvalDataRepository.markAsApproved).toHaveBeenCalledWith({
                    'orgUnit': 'currentModuleId',
                    'period': '2014W44'
                }, 'dataentryuser');
                expect(hustle.publish).toHaveBeenCalledWith({
                    type: 'uploadProgramEvents',
                    locale: 'en',
                    desc: 'submit cases'
                }, 'dataValues');
                expect(hustle.publish).toHaveBeenCalledWith({
                    "data": [{
                        'orgUnit': 'currentModuleId',
                        'period': '2014W44'
                    }],
                    'locale': 'en',
                    'desc': 'approve data at project level for 2014W44, Module: Mod1',
                    "type": "uploadCompletionData"
                }, "dataValues");
                expect(hustle.publish).toHaveBeenCalledWith({
                    "data": [{
                        'orgUnit': 'currentModuleId',
                        'period': '2014W44'
                    }],
                    'locale': 'en',
                    'desc': 'approve data at coordination level for 2014W44, Module: Mod1',
                    "type": "uploadApprovalData"
                }, "dataValues");

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

                spyOn(approvalDataRepository, "markAsApproved").and.returnValue(utils.getPromise(q, {}));

                var lineListSummaryController = new LineListSummaryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, programRepository, programEventRepository, systemSettingRepository, orgUnitRepository, approvalDataRepository);
                scope.$apply();
                scope.year = "2014";

                scope.submitAndApprove();
                scope.$apply();

                expect(fakeModal.open).toHaveBeenCalled();
            });

            it("should soft-delete event which is POSTed to DHIS", function() {
                spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, ""));
                spyOn(fakeModal, "open").and.returnValue({
                    result: utils.getPromise(q, {})
                });

                var lineListSummaryController = new LineListSummaryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, programRepository, programEventRepository, systemSettingRepository, orgUnitRepository, approvalDataRepository);
                scope.$apply();

                var eventToDelete = event1;
                scope.deleteEvent(eventToDelete);
                scope.$apply();

                var softDeletedEventPayload = {
                    "events": [eventToDelete]
                };

                expect(fakeModal.open).toHaveBeenCalled();
                expect(hustle.publish).toHaveBeenCalledWith({
                    data: 'event1',
                    type: 'deleteEvent',
                    locale: 'en',
                    desc: 'delete cases'
                }, 'dataValues');
                expect(programEventRepository.upsert).toHaveBeenCalledWith(softDeletedEventPayload);
                expect(eventToDelete.localStatus).toEqual("DELETED");
                expect(programEventRepository.getEventsFor).toHaveBeenCalled();
            });

            it("should hard delete a local event", function() {
                event1.localStatus = "NEW_DRAFT";
                spyOn(hustle, "publish");
                spyOn(fakeModal, "open").and.returnValue({
                    result: utils.getPromise(q, {})
                });

                var lineListSummaryController = new LineListSummaryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, programRepository, programEventRepository, systemSettingRepository, orgUnitRepository, approvalDataRepository);
                scope.$apply();

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
                spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, ""));
                spyOn(fakeModal, "open").and.returnValue({
                    result: utils.getPromise(q, {})
                });

                var lineListSummaryController = new LineListSummaryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, programRepository, programEventRepository, systemSettingRepository, orgUnitRepository, approvalDataRepository);
                scope.$apply();

                var eventToDelete = event1;
                scope.deleteEvent(eventToDelete);
                scope.$apply();

                var softDeletedEventPayload = {
                    "events": [eventToDelete]
                };

                expect(fakeModal.open).toHaveBeenCalled();
                expect(hustle.publish).toHaveBeenCalledWith({
                    data: 'event1',
                    type: 'deleteEvent',
                    locale: 'en',
                    desc: 'delete cases'
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
                var lineListSummaryController = new LineListSummaryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, programRepository, programEventRepository, systemSettingRepository, orgUnitRepository, approvalDataRepository);
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

                var lineListSummaryController = new LineListSummaryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, programRepository, programEventRepository, systemSettingRepository, orgUnitRepository, approvalDataRepository);
                var actualValue = scope.getDisplayValue(dataValue);
                scope.$apply();

                expect(actualValue).toEqual("Male");
            });

            it("should not allow event creation , edit or deleting if selected week is beyond configured week", function() {
                scope.week = {
                    "startOfWeek": "2014-02-02",
                    "weekNumber": 05,
                    "weekYear": 2014
                };

                var lineListSummaryController = new LineListSummaryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, programRepository, programEventRepository, systemSettingRepository, orgUnitRepository, approvalDataRepository);

                expect(scope.isDataEntryAllowed()).toBeFalsy();
                scope.$apply();
            });
        });
    });
