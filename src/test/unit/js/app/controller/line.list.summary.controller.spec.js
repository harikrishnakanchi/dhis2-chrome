define(["lineListSummaryController", "angularMocks", "utils", "moment", "timecop", "programRepository", "programEventRepository", "excludedDataElementsRepository",
        "orgUnitRepository", "testData", "approvalDataRepository", "referralLocationsRepository"
    ],
    function(LineListSummaryController, mocks, utils, moment, timecop, ProgramRepository, ProgramEventRepository, ExcludedDataElementsRepository, OrgUnitRepository, testData, ApprovalDataRepository, ReferralLocationsRepository) {

        describe("lineListSummaryController ", function() {

            var scope, q, hustle, programRepository, mockStore, timeout, fakeModal, anchorScroll, location,
                excludedDataElementsRepository, systemSettings, orgUnitRepository, optionSets, approvalDataRepository, originOrgUnits, routeParams, window;

            beforeEach(module('hustle'));
            beforeEach(mocks.inject(function($rootScope, $q, $hustle, $timeout, $location, $window) {
                scope = $rootScope.$new();
                q = $q;
                hustle = $hustle;
                timeout = $timeout;
                location = $location;
                anchorScroll = jasmine.createSpy();
                window = $window;

                routeParams = {
                    'module': 'ou1'
                };

                spyOn(location, "path").and.returnValue(location);
                spyOn(location, "search").and.returnValue("something");

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
                    "uploadProgramEventsDesc": "submit cases for ",
                    "deleteEventDesc": "delete cases",
                    "uploadApprovalDataDesc": "approve data at coordination level for ",
                    "uploadCompletionDataDesc": "approve data at project level for ",
                    "deleteApprovalsDesc": "restart approval process for ",
                    "eventSubmitAndApproveSuccess": " Event(s) submitted and auto-approved successfully.",
                    'eventSubmitSuccess': ' Event submitted succesfully'
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
                    },
                    "selectedProject": {
                        "id": "AFGHANISTAN"
                    }
                };
                scope.currentUserProject = {
                    "id": "prj1"
                };

                var program = {
                    "id": "someProgram"
                };

                programRepository = new ProgramRepository();
                programEventRepository = new ProgramEventRepository();
                excludedDataElementsRepository = new ExcludedDataElementsRepository();
                orgUnitRepository = new OrgUnitRepository();
                approvalDataRepository = new ApprovalDataRepository();

                programRepository = {
                    "get": jasmine.createSpy("get").and.returnValue(utils.getPromise(q, program)),
                    "getProgramForOrgUnit": jasmine.createSpy("getProgramForOrgUnit").and.returnValue(utils.getPromise(q, program))
                };

                programEventRepository = {
                    "getSubmitableEventsFor": jasmine.createSpy("getSubmitableEventsFor").and.returnValue(utils.getPromise(q, [])),
                    "getDraftEventsFor": jasmine.createSpy("getDraftEventsFor").and.returnValue(utils.getPromise(q, [])),
                    "findEventsByCode": jasmine.createSpy("findEventsByCode").and.returnValue(utils.getPromise(q, [])),
                    "findEventsByDateRange": jasmine.createSpy("findEventsByDateRange").and.returnValue(utils.getPromise(q, [])),
                    "upsert": jasmine.createSpy("upsert").and.returnValue(utils.getPromise(q, [])),
                    "delete": jasmine.createSpy("delete").and.returnValue(utils.getPromise(q, {})),
                    "markEventsAsSubmitted": jasmine.createSpy("markEventsAsSubmitted").and.callFake(function(data) {
                        return utils.getPromise(q, data);
                    })
                };

                systemSettings = {
                    "orgUnit": "ou1",
                    "clientLastUpdated": "2014-12-29T05:06:30.950+0000",
                    'dataElements': [{
                        'id': 'de1'
                    }, {
                        'id': 'de3'
                    }]
                };

                excludedDataElementsRepository = {
                    "get": jasmine.createSpy("get").and.returnValue(utils.getPromise(q, systemSettings))
                };

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

                var allModulesInAfghanistan = [{
                    'id': 'mod1',
                    'name': 'mod1',
                    'parent': {
                        'name': 'op1'
                    }
                }, {
                    'name': 'linelistMod',
                    'id': 'ou1',
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

                var currentModule = {
                    'id': 'ou1',
                    'name': 'Mod1',
                    "parent": {
                        "id": "par"
                    }
                };

                referralLocationsRepository = new ReferralLocationsRepository();
                spyOn(referralLocationsRepository, "get").and.returnValue(utils.getPromise(q, {}));

                spyOn(orgUnitRepository, "get").and.returnValue(utils.getPromise(q, currentModule));
                spyOn(orgUnitRepository, "getParentProject").and.returnValue(utils.getPromise(q, project));
                spyOn(orgUnitRepository, "findAllByParent").and.returnValue(utils.getPromise(q, originOrgUnits));

                spyOn(approvalDataRepository, "markAsApproved").and.returnValue(utils.getPromise(q, {}));
                spyOn(approvalDataRepository, "clearApprovals").and.returnValue(utils.getPromise(q, {}));

                spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, ""));
                spyOn(fakeModal, "open").and.returnValue({
                    result: utils.getPromise(q, {})
                });

            }));

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            it("should set projectIsAutoApproved on scope on init", function() {
                var lineListSummaryController = new LineListSummaryController(scope, q, hustle, fakeModal, window, timeout, location, anchorScroll, routeParams, programRepository, programEventRepository, excludedDataElementsRepository, orgUnitRepository, approvalDataRepository, referralLocationsRepository);
                scope.$apply();

                expect(scope.projectIsAutoApproved).toEqual(true);
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

                var lineListSummaryController = new LineListSummaryController(scope, q, hustle, fakeModal, window, timeout, location, anchorScroll, routeParams, programRepository, programEventRepository, excludedDataElementsRepository, orgUnitRepository, approvalDataRepository, referralLocationsRepository);
                scope.$apply();

                expect(programRepository.get).toHaveBeenCalledWith('someProgram', ['de1', 'de3']);
                expect(scope.program).toEqual(programAndStageData);
                expect(scope.associatedProgramId).toEqual("someProgram");
            });

            it("should load patient origin org units on init", function() {
                var lineListSummaryController = new LineListSummaryController(scope, q, hustle, fakeModal, window, timeout, location, anchorScroll, routeParams, programRepository, programEventRepository, excludedDataElementsRepository, orgUnitRepository, approvalDataRepository, referralLocationsRepository);
                scope.$apply();

                expect(scope.originOrgUnits).toEqual(originOrgUnits);
            });

            it("should get origin name given an id", function() {
                var lineListSummaryController = new LineListSummaryController(scope, q, hustle, fakeModal, window, timeout, location, anchorScroll, routeParams, programRepository, programEventRepository, excludedDataElementsRepository, orgUnitRepository, approvalDataRepository, referralLocationsRepository);
                scope.$apply();

                expect(scope.getOriginName("o1")).toEqual("o1");
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
                var lineListSummaryController = new LineListSummaryController(scope, q, hustle, fakeModal, window, timeout, location, anchorScroll, routeParams, programRepository, programEventRepository, excludedDataElementsRepository, orgUnitRepository, approvalDataRepository, referralLocationsRepository);
                scope.$apply();

                expect(scope.program).toEqual(expectedProgram);
            });

            it("should submit event details", function() {

                var event1 = {
                    'event': 'event1',
                    'orgUnit': 'o1',
                    'period': '2014W44',
                    'eventDate': '2014-12-29T05:06:30.950+0000',
                    'localStatus': 'NEW_DRAFT',
                    'dataValues': [{
                        'dataElement': 'de1',
                        'value': 'a11',
                        'showInEventSummary': true,
                        'name': 'dataElement1',
                    }]
                };

                routeParams.filterBy = 'readyToSubmit';

                programEventRepository.getSubmitableEventsFor.and.returnValue(utils.getPromise(q, [event1]));

                var lineListSummaryController = new LineListSummaryController(scope, q, hustle, fakeModal, window, timeout, location, anchorScroll, routeParams, programRepository, programEventRepository, excludedDataElementsRepository, orgUnitRepository, approvalDataRepository, referralLocationsRepository);
                scope.$apply();

                scope.submit();
                scope.$apply();

                expect(programEventRepository.markEventsAsSubmitted).toHaveBeenCalledWith(["event1"]);
                expect(approvalDataRepository.clearApprovals).toHaveBeenCalledWith([{
                    "period": "2014W44",
                    "orgUnit": "ou1"
                }]);

                expect(hustle.publish.calls.argsFor(0)[0]).toEqual({
                    "data": [{
                        "period": "2014W44",
                        "orgUnit": "ou1"
                    }],
                    "type": "deleteApprovals",
                    "locale": "en",
                    "desc": "restart approval process for 2014W44, Module: Mod1"
                }, "dataValues");

                expect(hustle.publish.calls.argsFor(1)[0]).toEqual({
                    type: 'uploadProgramEvents',
                    eventIds: ['event1'],
                    locale: 'en',
                    desc: 'submit cases for 2014W44, Module: Mod1'
                }, 'dataValues');

                expect(scope.resultMessageType).toEqual("success");
                expect(scope.resultMessage).toEqual("1 Event submitted succesfully");

            });

            it("should submit and auto approve event details", function() {
                var event1 = {
                    'event': 'event1',
                    'orgUnit': 'o1',
                    'period': '2014W44',
                    'eventDate': '2014-12-29T05:06:30.950+0000',
                    'localStatus': 'NEW_DRAFT',
                    'dataValues': [{
                        'dataElement': 'de1',
                        'value': 'a11',
                        'showInEventSummary': true,
                        'name': 'dataElement1',
                    }]
                };

                routeParams.filterBy = 'readyToSubmit';

                programEventRepository.getSubmitableEventsFor.and.returnValue(utils.getPromise(q, [event1]));
                var lineListSummaryController = new LineListSummaryController(scope, q, hustle, fakeModal, window, timeout, location, anchorScroll, routeParams, programRepository, programEventRepository, excludedDataElementsRepository, orgUnitRepository, approvalDataRepository, referralLocationsRepository);
                scope.$apply();

                scope.submitAndApprove();
                scope.$apply();

                expect(programEventRepository.markEventsAsSubmitted).toHaveBeenCalledWith(["event1"]);

                expect(approvalDataRepository.markAsApproved).toHaveBeenCalledWith([{
                    'orgUnit': 'ou1',
                    'period': '2014W44'
                }], 'dataentryuser');

                expect(hustle.publish.calls.argsFor(0)[0]).toEqual({
                    "data": [{
                        "period": "2014W44",
                        "orgUnit": "ou1"
                    }],
                    "type": "deleteApprovals",
                    "locale": "en",
                    "desc": "restart approval process for 2014W44, Module: Mod1"
                }, "dataValues");

                expect(hustle.publish.calls.argsFor(1)[0]).toEqual({
                    type: 'uploadProgramEvents',
                    locale: 'en',
                    desc: 'submit cases for 2014W44, Module: Mod1'
                }, 'dataValues');

                expect(hustle.publish.calls.argsFor(2)[0]).toEqual({
                    "data": [{
                        'orgUnit': 'ou1',
                        'period': '2014W44'
                    }],
                    'locale': 'en',
                    'desc': 'approve data at project level for 2014W44, Module: Mod1',
                    "type": "uploadCompletionData"
                }, "dataValues");

                expect(hustle.publish.calls.argsFor(3)[0]).toEqual({
                    "data": [{
                        'orgUnit': 'ou1',
                        'period': '2014W44'
                    }],
                    'locale': 'en',
                    'desc': 'approve data at coordination level for 2014W44, Module: Mod1',
                    "type": "uploadApprovalData"
                }, "dataValues");

                expect(scope.resultMessageType).toEqual("success");
                expect(scope.resultMessage).toEqual("1 Event(s) submitted and auto-approved successfully.");
            });

            it("should soft-delete event which is POSTed to DHIS", function() {

                var event1 = {
                    'event': 'event1',
                    'eventDate': '2014-12-29T05:06:30.950+0000',
                    'dataValues': [{
                        'dataElement': 'de1',
                        'value': 'a11',
                        'showInEventSummary': true,
                        'name': 'dataElement1',
                    }]
                };

                routeParams.filterBy = 'readyToSubmit';

                programEventRepository.getSubmitableEventsFor.and.returnValue(utils.getPromise(q, [event1]));

                var lineListSummaryController = new LineListSummaryController(scope, q, hustle, fakeModal, window, timeout, location, anchorScroll, routeParams, programRepository, programEventRepository, excludedDataElementsRepository, orgUnitRepository, approvalDataRepository, referralLocationsRepository);
                scope.$apply();

                var eventToDelete = event1;
                scope.deleteEvent(eventToDelete);
                scope.$apply();

                expect(fakeModal.open).toHaveBeenCalled();
                expect(hustle.publish).toHaveBeenCalledWith({
                    data: 'event1',
                    type: 'deleteEvent',
                    locale: 'en',
                    desc: 'delete cases'
                }, 'dataValues');
                expect(programEventRepository.upsert).toHaveBeenCalledWith(eventToDelete);
                expect(eventToDelete.localStatus).toEqual("DELETED");
                expect(programEventRepository.getSubmitableEventsFor).toHaveBeenCalled();
                expect(approvalDataRepository.clearApprovals).toHaveBeenCalled();
            });

            it("should hard delete a local event", function() {
                var event1 = {
                    'event': 'event1',
                    'eventDate': '2014-12-29T05:06:30.950+0000',
                    'localStatus': 'NEW_DRAFT',
                    'dataValues': [{
                        'dataElement': 'de1',
                        'value': 'a11',
                        'showInEventSummary': true,
                        'name': 'dataElement1',
                    }]
                };
                routeParams.filterBy = 'readyToSubmit';

                programEventRepository.getSubmitableEventsFor.and.returnValue(utils.getPromise(q, [event1]));

                var lineListSummaryController = new LineListSummaryController(scope, q, hustle, fakeModal, window, timeout, location, anchorScroll, routeParams, programRepository, programEventRepository, excludedDataElementsRepository, orgUnitRepository, approvalDataRepository, referralLocationsRepository);
                scope.$apply();

                var eventToDelete = event1;
                scope.deleteEvent(eventToDelete);
                scope.$apply();

                expect(fakeModal.open).toHaveBeenCalled();
                expect(programEventRepository.delete).toHaveBeenCalledWith('event1');
                expect(hustle.publish).not.toHaveBeenCalled();
                expect(programEventRepository.getSubmitableEventsFor).toHaveBeenCalled();
            });

            it("should soft delete a locally updated event which is already submitted to DHIS", function() {
                var event1 = {
                    'event': 'event1',
                    'eventDate': '2014-12-29T05:06:30.950+0000',
                    'localStatus': 'UPDATED_DRAFT',
                    'dataValues': [{
                        'dataElement': 'de1',
                        'value': 'a11',
                        'showInEventSummary': true,
                        'name': 'dataElement1',
                    }]
                };

                routeParams.filterBy = 'readyToSubmit';

                programEventRepository.getSubmitableEventsFor.and.returnValue(utils.getPromise(q, [event1]));

                var lineListSummaryController = new LineListSummaryController(scope, q, hustle, fakeModal, window, timeout, location, anchorScroll, routeParams, programRepository, programEventRepository, excludedDataElementsRepository, orgUnitRepository, approvalDataRepository, referralLocationsRepository);
                scope.$apply();

                var eventToDelete = event1;
                scope.deleteEvent(eventToDelete);
                scope.$apply();

                expect(fakeModal.open).toHaveBeenCalled();
                expect(hustle.publish).toHaveBeenCalledWith({
                    data: 'event1',
                    type: 'deleteEvent',
                    locale: 'en',
                    desc: 'delete cases'
                }, 'dataValues');
                expect(programEventRepository.upsert).toHaveBeenCalledWith(eventToDelete);
                expect(eventToDelete.localStatus).toEqual("DELETED");
                expect(programEventRepository.getSubmitableEventsFor).toHaveBeenCalled();
                expect(approvalDataRepository.clearApprovals).toHaveBeenCalled();
            });

            it("should get data value", function() {
                var dataValue = {
                    "id": "dv1",
                    "value": "Case123"
                };
                var lineListSummaryController = new LineListSummaryController(scope, q, hustle, fakeModal, window, timeout, location, anchorScroll, routeParams, programRepository, programEventRepository, excludedDataElementsRepository, orgUnitRepository, approvalDataRepository, referralLocationsRepository);
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

                var lineListSummaryController = new LineListSummaryController(scope, q, hustle, fakeModal, window, timeout, location, anchorScroll, routeParams, programRepository, programEventRepository, excludedDataElementsRepository, orgUnitRepository, approvalDataRepository, referralLocationsRepository);
                var actualValue = scope.getDisplayValue(dataValue);
                scope.$apply();

                expect(actualValue).toEqual("Male");
            });

            it("should filter events by case number", function() {
                var event1 = {
                    'event': 'event1'
                };

                programEventRepository.findEventsByCode.and.returnValue(utils.getPromise(q, [event1]));
                var lineListSummaryController = new LineListSummaryController(scope, q, hustle, fakeModal, window, timeout, location, anchorScroll, routeParams, programRepository, programEventRepository, excludedDataElementsRepository, orgUnitRepository, approvalDataRepository, referralLocationsRepository);
                scope.$apply();

                scope.filterParams.caseNumber = "someCaseNumber";
                scope.filterByCaseNumber();
                scope.$apply();

                expect(programEventRepository.findEventsByCode).toHaveBeenCalledWith("someProgram", ["o1", "o2"], "someCaseNumber");
                expect(scope.events).toEqual([event1]);
            });

            it("should filter events by date range", function() {
                var event1 = {
                    'event': 'event1'
                };

                programEventRepository.findEventsByDateRange.and.returnValue(utils.getPromise(q, [event1]));
                var lineListSummaryController = new LineListSummaryController(scope, q, hustle, fakeModal, window, timeout, location, anchorScroll, routeParams, programRepository, programEventRepository, excludedDataElementsRepository, orgUnitRepository, approvalDataRepository, referralLocationsRepository);
                scope.$apply();

                scope.filterParams.startDate = new Date("2015", "10", "12");
                scope.filterParams.endDate = new Date("2015", "11", "28");
                scope.filterByDateRange();
                scope.$apply();
                expect(programEventRepository.findEventsByDateRange).toHaveBeenCalledWith("someProgram", ["o1", "o2"], "2015-11-12", "2015-12-28");
                expect(scope.events).toEqual([event1]);
            });

        });
    });
