define(["lineListSummaryController", "angularMocks", "utils", "timecop", "programRepository", "programEventRepository", "excludedDataElementsRepository",
        "orgUnitRepository", "approvalDataRepository", "referralLocationsRepository", "translationsService"
    ],
    function(LineListSummaryController, mocks, utils, timecop, ProgramRepository, ProgramEventRepository, ExcludedDataElementsRepository, OrgUnitRepository, ApprovalDataRepository, ReferralLocationsRepository, TranslationsService) {
        describe("lineListSummaryController ", function() {
            var scope, q, hustle, timeout, fakeModal, anchorScroll, location, routeParams, window,
                lineListSummaryController,
                programRepository, programEventRepository, referralLocationsRepository, approvalDataRepository, excludedDataElementsRepository, orgUnitRepository, translationsService,
                systemSettings, currentModule, originOrgUnits, program, project, mockEvent;

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
                spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, ""));

                fakeModal = {
                    close: function() {
                        this.result.confirmCallBack();
                    },
                    dismiss: function(type) {
                        this.result.cancelCallback(type);
                    },
                    open: function(object) {}
                };
                spyOn(fakeModal, "open").and.returnValue({
                    result: utils.getPromise(q, {})
                });

                Timecop.install();
                Timecop.freeze(new Date("2014-10-29T12:43:54.972Z"));

                scope.resourceBundle = {
                    uploadProgramEventsDesc: 'submit cases for ',
                    deleteEventDesc: 'delete cases',
                    uploadApprovalDataDesc: 'approve data at coordination level for ',
                    uploadCompletionDataDesc: 'approve data at project level for ',
                    deleteApprovalsDesc: 'restart approval process for ',
                    eventSubmitAndApproveSuccess: ' Event(s) submitted and auto-approved successfully.',
                    eventSubmitSuccess: ' Event submitted succesfully'
                };

                scope.locale = "en";

                scope.currentUser = {
                    "firstName": "foo",
                    "lastName": "bar",
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

                program = {
                    "id": "someProgram"
                };

                programRepository = new ProgramRepository();
                spyOn(programRepository, 'get').and.returnValue(utils.getPromise(q, program));
                spyOn(programRepository, 'getProgramForOrgUnit').and.returnValue(utils.getPromise(q, program));

                programEventRepository = new ProgramEventRepository();
                spyOn(programEventRepository, 'getSubmitableEventsFor').and.returnValue(utils.getPromise(q, []));
                spyOn(programEventRepository, 'getDraftEventsFor').and.returnValue(utils.getPromise(q, []));
                spyOn(programEventRepository, 'findEventsByCode').and.returnValue(utils.getPromise(q, []));
                spyOn(programEventRepository, 'findEventsByDateRange').and.returnValue(utils.getPromise(q, []));
                spyOn(programEventRepository, 'upsert').and.returnValue(utils.getPromise(q, []));
                spyOn(programEventRepository, 'delete').and.returnValue(utils.getPromise(q, {}));
                spyOn(programEventRepository, 'markEventsAsSubmitted').and.callFake(function(data) {
                    return utils.getPromise(q, data);
                });

                systemSettings = {
                    "orgUnit": "ou1",
                    "clientLastUpdated": "2014-12-29T05:06:30.950+0000",
                    'dataElements': [{
                        'id': 'de1'
                    }, {
                        'id': 'de3'
                    }]
                };

                excludedDataElementsRepository = new ExcludedDataElementsRepository();
                spyOn(excludedDataElementsRepository, 'get').and.returnValue(utils.getPromise(q, systemSettings));

                project = {
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
                    id: "o1",
                    name: "o1"
                }, {
                    id: "o2",
                    name: "o2"
                }];

                currentModule = {
                    id: 'ou1',
                    name: 'Mod1',
                    parent: {
                        id: "par"
                    }
                };

                referralLocationsRepository = new ReferralLocationsRepository();
                spyOn(referralLocationsRepository, "get").and.returnValue(utils.getPromise(q, {}));

                orgUnitRepository = new OrgUnitRepository();
                spyOn(orgUnitRepository, "get").and.returnValue(utils.getPromise(q, currentModule));
                spyOn(orgUnitRepository, "getParentProject").and.returnValue(utils.getPromise(q, project));
                spyOn(orgUnitRepository, "findAllByParent").and.returnValue(utils.getPromise(q, originOrgUnits));

                approvalDataRepository = new ApprovalDataRepository();
                spyOn(approvalDataRepository, "markAsApproved").and.returnValue(utils.getPromise(q, {}));
                spyOn(approvalDataRepository, "clearApprovals").and.returnValue(utils.getPromise(q, {}));

                translationsService = new TranslationsService();
                spyOn(translationsService, "translate").and.callFake(function(object){
                    return object;
                });

                lineListSummaryController = new LineListSummaryController(scope, q, hustle, fakeModal, window, timeout, location, anchorScroll, routeParams, programRepository, programEventRepository, excludedDataElementsRepository, orgUnitRepository, approvalDataRepository, referralLocationsRepository, translationsService);
            }));

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            it("should set projectIsAutoApproved on scope on init", function() {
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

                scope.$apply();

                expect(programRepository.get).toHaveBeenCalledWith('someProgram', ['de1', 'de3']);
                expect(scope.program).toEqual(programAndStageData);
                expect(scope.associatedProgramId).toEqual("someProgram");
            });

            it("should load patient origin org units on init", function() {
                scope.$apply();

                expect(scope.originOrgUnits).toEqual(originOrgUnits);
            });

            it("should get origin name given an id", function() {
                scope.$apply();

                expect(scope.getOriginName("o1")).toEqual("o1");
            });

            it("should load program on initialization", function() {
                scope.$apply();

                expect(scope.program).toEqual(program);
            });

            it("should submit event details", function() {
                mockEvent = {
                    'event': 'event1',
                    'orgUnit': 'o1',
                    'period': '2014W44',
                    'eventDate': '2014-12-29T05:06:30.950+0000',
                    'localStatus': 'NEW_DRAFT',
                    'dataValues': [{
                        'dataElement': 'de1',
                        'value': 'a11',
                        'showInEventSummary': true,
                        'name': 'dataElement1'
                    }]
                };
                programEventRepository.getSubmitableEventsFor.and.returnValue(utils.getPromise(q, [mockEvent]));

                routeParams.filterBy = 'readyToSubmit';
                lineListSummaryController = new LineListSummaryController(scope, q, hustle, fakeModal, window, timeout, location, anchorScroll, routeParams, programRepository, programEventRepository, excludedDataElementsRepository, orgUnitRepository, approvalDataRepository, referralLocationsRepository, translationsService);
                scope.$apply();

                scope.submit();
                scope.$apply();

                expect(programEventRepository.markEventsAsSubmitted).toHaveBeenCalledWith([mockEvent.event]);
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
                    data: ['event1'],
                    locale: 'en',
                    desc: 'submit cases for 2014W44, Module: Mod1'
                }, 'dataValues');

                expect(scope.resultMessageType).toEqual("success");
                expect(scope.resultMessage).toEqual("1 Event submitted succesfully");

            });

            it("should submit and auto approve event details", function() {
                mockEvent = {
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
                programEventRepository.getSubmitableEventsFor.and.returnValue(utils.getPromise(q, [mockEvent]));

                routeParams.filterBy = 'readyToSubmit';
                lineListSummaryController = new LineListSummaryController(scope, q, hustle, fakeModal, window, timeout, location, anchorScroll, routeParams, programRepository, programEventRepository, excludedDataElementsRepository, orgUnitRepository, approvalDataRepository, referralLocationsRepository, translationsService);
                scope.$apply();

                scope.submitAndApprove();
                scope.$apply();

                expect(programEventRepository.markEventsAsSubmitted).toHaveBeenCalledWith([mockEvent.event]);

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
                    "data": ["event1"],
                    "type": 'uploadProgramEvents',
                    "locale": 'en',
                    "desc": 'submit cases for 2014W44, Module: Mod1'
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
                mockEvent = {
                    'event': 'event1',
                    'eventDate': '2014-12-29T05:06:30.950+0000',
                    'dataValues': [{
                        'dataElement': 'de1',
                        'value': 'a11',
                        'showInEventSummary': true,
                        'name': 'dataElement1',
                    }]
                };
                programEventRepository.getSubmitableEventsFor.and.returnValue(utils.getPromise(q, [mockEvent]));

                routeParams.filterBy = 'readyToSubmit';
                lineListSummaryController = new LineListSummaryController(scope, q, hustle, fakeModal, window, timeout, location, anchorScroll, routeParams, programRepository, programEventRepository, excludedDataElementsRepository, orgUnitRepository, approvalDataRepository, referralLocationsRepository, translationsService);
                scope.$apply();

                scope.deleteEvent(mockEvent);
                scope.$apply();

                expect(fakeModal.open).toHaveBeenCalled();
                expect(hustle.publish).toHaveBeenCalledWith({
                    data: 'event1',
                    type: 'deleteEvent',
                    locale: 'en',
                    desc: 'delete cases'
                }, 'dataValues');
                expect(programEventRepository.upsert).toHaveBeenCalledWith(mockEvent);
                expect(mockEvent.localStatus).toEqual("DELETED");
                expect(programEventRepository.getSubmitableEventsFor).toHaveBeenCalled();
                expect(approvalDataRepository.clearApprovals).toHaveBeenCalled();
            });

            it("should hard delete a local event", function() {
                mockEvent = {
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
                programEventRepository.getSubmitableEventsFor.and.returnValue(utils.getPromise(q, [mockEvent]));

                routeParams.filterBy = 'readyToSubmit';
                lineListSummaryController = new LineListSummaryController(scope, q, hustle, fakeModal, window, timeout, location, anchorScroll, routeParams, programRepository, programEventRepository, excludedDataElementsRepository, orgUnitRepository, approvalDataRepository, referralLocationsRepository, translationsService);
                scope.$apply();

                scope.deleteEvent(mockEvent);
                scope.$apply();

                expect(fakeModal.open).toHaveBeenCalled();
                expect(programEventRepository.delete).toHaveBeenCalledWith(mockEvent.event);
                expect(hustle.publish).not.toHaveBeenCalled();
                expect(programEventRepository.getSubmitableEventsFor).toHaveBeenCalled();
            });

            it("should soft delete a locally updated event which is already submitted to DHIS", function() {
                mockEvent = {
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
                programEventRepository.getSubmitableEventsFor.and.returnValue(utils.getPromise(q, [mockEvent]));

                routeParams.filterBy = 'readyToSubmit';
                lineListSummaryController = new LineListSummaryController(scope, q, hustle, fakeModal, window, timeout, location, anchorScroll, routeParams, programRepository, programEventRepository, excludedDataElementsRepository, orgUnitRepository, approvalDataRepository, referralLocationsRepository, translationsService);
                scope.$apply();

                scope.deleteEvent(mockEvent);
                scope.$apply();

                expect(fakeModal.open).toHaveBeenCalled();
                expect(hustle.publish).toHaveBeenCalledWith({
                    data: 'event1',
                    type: 'deleteEvent',
                    locale: 'en',
                    desc: 'delete cases'
                }, 'dataValues');
                expect(programEventRepository.upsert).toHaveBeenCalledWith(mockEvent);
                expect(mockEvent.localStatus).toEqual("DELETED");
                expect(programEventRepository.getSubmitableEventsFor).toHaveBeenCalled();
                expect(approvalDataRepository.clearApprovals).toHaveBeenCalled();
            });

            it("should get data value", function() {
                var actualValue = scope.getDisplayValue({
                    "value": "Case123"
                });
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
                var actualValue = scope.getDisplayValue(dataValue);
                expect(actualValue).toEqual("Male");
            });

            it("should filter events by case number", function() {
                mockEvent = {
                    'event': 'event1'
                };
                programEventRepository.findEventsByCode.and.returnValue(utils.getPromise(q, [mockEvent]));
                scope.$apply();

                scope.filterParams.caseNumber = "someCaseNumber";
                scope.filterByCaseNumber();
                scope.$apply();

                expect(programEventRepository.findEventsByCode).toHaveBeenCalledWith(program.id, _.pluck(originOrgUnits, 'id'), scope.filterParams.caseNumber);
                expect(scope.events).toEqual([mockEvent]);
            });

            it("should filter events by date range", function() {
                mockEvent = {
                    'event': 'event1'
                };
                programEventRepository.findEventsByDateRange.and.returnValue(utils.getPromise(q, [mockEvent]));
                scope.$apply();

                scope.filterParams.startDate = new Date("2015", "10", "12");
                scope.filterParams.endDate = new Date("2015", "11", "28");
                scope.filterByDateRange();
                scope.$apply();

                expect(programEventRepository.findEventsByDateRange).toHaveBeenCalledWith(program.id, _.pluck(originOrgUnits, 'id'), "2015-11-12", "2015-12-28");
                expect(scope.events).toEqual([mockEvent]);
            });

        });
    });