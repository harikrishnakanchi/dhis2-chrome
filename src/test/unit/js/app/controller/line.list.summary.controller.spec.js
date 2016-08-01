define(["lineListSummaryController", "angularMocks", "utils", "timecop", "moment", "programRepository", "programEventRepository", "excludedDataElementsRepository",
        "orgUnitRepository", "approvalDataRepository", "referralLocationsRepository", "dataSyncFailureRepository", "translationsService", "filesystemService"
    ],
    function(LineListSummaryController, mocks, utils, timecop, moment, ProgramRepository, ProgramEventRepository, ExcludedDataElementsRepository, OrgUnitRepository, ApprovalDataRepository, ReferralLocationsRepository, DataSyncFailureRepository, TranslationsService, FilesystemService) {
        describe("lineListSummaryController ", function() {
            var scope, q, hustle, timeout, fakeModal, anchorScroll, location, routeParams, window, currentTime,
                lineListSummaryController,
                programRepository, programEventRepository, referralLocationsRepository, approvalDataRepository, excludedDataElementsRepository, orgUnitRepository, dataSyncFailureRepository, translationsService,
                systemSettings, currentModule, originOrgUnits, program, project, mockEvent, filesystemService;

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
                spyOn(hustle, 'publishOnce').and.returnValue(utils.getPromise(q, {}));

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

                currentTime = moment('2014-10-29T12:43:54.972Z');
                Timecop.install();
                Timecop.freeze(currentTime);

                scope.resourceBundle = {
                    syncModuleDataBlockDesc: 'some description',
                    uploadProgramEventsDesc: 'submit cases for ',
                    deleteEventDesc: 'delete cases',
                    uploadApprovalDataDesc: 'approve data at coordination level for ',
                    uploadCompletionDataDesc: 'approve data at project level for ',
                    deleteApprovalsDesc: 'restart approval process for ',
                    eventSubmitAndApproveSuccess: 'some success message',
                    eventSubmitSuccess: 'some other success message',
                    eventDateLabel: 'Event Date',
                    yesLabel: 'YES'
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

                filesystemService = new FilesystemService();
                spyOn(filesystemService, 'promptAndWriteFile').and.returnValue(utils.getPromise(q, {}));

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

                dataSyncFailureRepository = new DataSyncFailureRepository();
                spyOn(dataSyncFailureRepository, 'delete').and.returnValue(utils.getPromise(q,{}));

                translationsService = new TranslationsService();
                spyOn(translationsService, "translate").and.callFake(function(object){
                    return object;
                });

                createLineListSummary();
            }));

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            var createLineListSummary = function () {
                lineListSummaryController = new LineListSummaryController(scope, q, hustle, fakeModal, window, timeout, location, anchorScroll, routeParams, programRepository, programEventRepository, excludedDataElementsRepository, orgUnitRepository, approvalDataRepository, referralLocationsRepository, dataSyncFailureRepository, translationsService, filesystemService);
            };

            var createMockEvent = function (options) {
                return _.merge({
                    event: 'someEventId',
                    eventDate: 'someEventDate',
                    orgUnit: 'someOrgUnitId',
                    period: '2016W26'
                }, options);
            };

            var createMockHustleMessage = function (module, period) {
                return {
                    data: {
                        period: period,
                        moduleId: module.id
                    },
                    type: 'syncModuleDataBlock',
                    locale: 'en',
                    desc: scope.resourceBundle.syncModuleDataBlockDesc + period + ', ' + module.name
                };
            };

            var mockEventDataValue = function (options) {
                return _.merge({
                    formName: 'age',
                    value: 'someValue'
                }, options);
            };

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
                var mockEventA = createMockEvent({ period: '2016W25', localStatus: 'NEW_DRAFT' }),
                    mockEventB = createMockEvent({ period: '2016W26', localStatus: 'NEW_DRAFT' });
                programEventRepository.getSubmitableEventsFor.and.returnValue(utils.getPromise(q, [mockEventA, mockEventB]));

                routeParams.filterBy = 'readyToSubmit';
                createLineListSummary();
                scope.$apply();

                scope.submit();
                scope.$apply();

                expect(programEventRepository.markEventsAsSubmitted).toHaveBeenCalledWith([mockEventA.event, mockEventB.event]);
                expect(approvalDataRepository.clearApprovals).toHaveBeenCalledWith([{
                    period: mockEventA.period,
                    orgUnit: currentModule.id
                }, {
                    period: mockEventB.period,
                    orgUnit: currentModule.id
                }]);

                expect(dataSyncFailureRepository.delete).toHaveBeenCalledWith(currentModule.id, mockEventA.period);
                expect(dataSyncFailureRepository.delete).toHaveBeenCalledWith(currentModule.id, mockEventB.period);
                expect(hustle.publishOnce).toHaveBeenCalledWith(createMockHustleMessage(currentModule, mockEventA.period), 'dataValues');
                expect(hustle.publishOnce).toHaveBeenCalledWith(createMockHustleMessage(currentModule, mockEventB.period), 'dataValues');
                expect(scope.resultMessageType).toEqual('success');
                expect(scope.resultMessage).toEqual('2' + scope.resourceBundle.eventSubmitSuccess);
            });

            it("should submit and auto approve event details", function() {
                var mockEventA = createMockEvent({ period: '2016W25', localStatus: 'NEW_DRAFT' }),
                    mockEventB = createMockEvent({ period: '2016W26', localStatus: 'NEW_DRAFT' });
                programEventRepository.getSubmitableEventsFor.and.returnValue(utils.getPromise(q, [mockEventA, mockEventB]));

                routeParams.filterBy = 'readyToSubmit';
                createLineListSummary();
                scope.$apply();

                scope.submitAndApprove();
                scope.$apply();

                expect(programEventRepository.markEventsAsSubmitted).toHaveBeenCalledWith([mockEventA.event, mockEventB.event]);

                expect(approvalDataRepository.markAsApproved).toHaveBeenCalledWith([{
                    period: mockEventA.period,
                    orgUnit: currentModule.id
                }, {
                    period: mockEventB.period,
                    orgUnit: currentModule.id
                }], 'dataentryuser');

                expect(dataSyncFailureRepository.delete).toHaveBeenCalledWith(currentModule.id, mockEventA.period);
                expect(dataSyncFailureRepository.delete).toHaveBeenCalledWith(currentModule.id, mockEventB.period);
                expect(hustle.publishOnce).toHaveBeenCalledWith(createMockHustleMessage(currentModule, mockEventA.period), 'dataValues');
                expect(hustle.publishOnce).toHaveBeenCalledWith(createMockHustleMessage(currentModule, mockEventB.period), 'dataValues');
                expect(scope.resultMessageType).toEqual('success');
                expect(scope.resultMessage).toEqual('2' + scope.resourceBundle.eventSubmitAndApproveSuccess);
            });

            it("should soft-delete event which exists on DHIS", function() {
                mockEvent = createMockEvent();
                programEventRepository.getSubmitableEventsFor.and.returnValue(utils.getPromise(q, [mockEvent]));

                routeParams.filterBy = 'readyToSubmit';
                createLineListSummary();
                scope.$apply();

                scope.deleteEvent(mockEvent);
                scope.$apply();

                expect(fakeModal.open).toHaveBeenCalled();
                expect(hustle.publishOnce).toHaveBeenCalledWith(createMockHustleMessage(currentModule, mockEvent.period), 'dataValues');

                expect(dataSyncFailureRepository.delete).toHaveBeenCalledWith(currentModule.id, mockEvent.period);
                expect(programEventRepository.upsert).toHaveBeenCalledWith(mockEvent);
                expect(mockEvent.localStatus).toEqual('DELETED');
                expect(programEventRepository.getSubmitableEventsFor).toHaveBeenCalled();
                expect(approvalDataRepository.clearApprovals).toHaveBeenCalled();
            });

            it("should hard delete new events which only exist on Praxis", function() {
                mockEvent = createMockEvent({ localStatus: 'NEW_DRAFT' });
                programEventRepository.getSubmitableEventsFor.and.returnValue(utils.getPromise(q, [mockEvent]));

                routeParams.filterBy = 'readyToSubmit';
                createLineListSummary();
                scope.$apply();

                scope.deleteEvent(mockEvent);
                scope.$apply();

                expect(fakeModal.open).toHaveBeenCalled();
                expect(programEventRepository.delete).toHaveBeenCalledWith(mockEvent.event);
                expect(hustle.publishOnce).not.toHaveBeenCalled();
                expect(programEventRepository.getSubmitableEventsFor).toHaveBeenCalled();
            });

            describe('getDisplayValue', function() {
                it("should get data value", function() {
                    var actualValue = scope.getDisplayValue({
                        "value": "Case123"
                    });
                    expect(actualValue).toEqual("Case123");
                });

                it('should format value if it is a date type', function() {
                    var mockDataValue = { value : "2016-07-07T00:00:00.000+0000", valueType: 'DATE'};
                    var actualValue = scope.getDisplayValue(mockDataValue);

                    expect(actualValue).toEqual(moment(mockDataValue.value).toDate().toLocaleDateString());
                });

                it('should format value if it is a boolean type', function() {
                    var mockDataValue = { value : "true", valueType: 'BOOLEAN'};
                    var actualValue = scope.getDisplayValue(mockDataValue);

                    expect(actualValue).toEqual(scope.resourceBundle.yesLabel);
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
            });

            it("should filter events by case number", function() {
                mockEvent = createMockEvent();
                programEventRepository.findEventsByCode.and.returnValue(utils.getPromise(q, [mockEvent]));
                scope.$apply();

                scope.filterParams.caseNumber = "someCaseNumber";
                scope.filterByCaseNumber();
                scope.$apply();

                expect(programEventRepository.findEventsByCode).toHaveBeenCalledWith(program.id, _.pluck(originOrgUnits, 'id'), scope.filterParams.caseNumber);
                expect(scope.events).toEqual([mockEvent]);
            });

            it("should filter events by date range", function() {
                mockEvent = createMockEvent();
                programEventRepository.findEventsByDateRange.and.returnValue(utils.getPromise(q, [mockEvent]));
                scope.$apply();

                scope.filterParams.startDate = new Date("2015", "10", "12");
                scope.filterParams.endDate = new Date("2015", "11", "28");
                scope.filterByDateRange();
                scope.$apply();

                expect(programEventRepository.findEventsByDateRange).toHaveBeenCalledWith(program.id, _.pluck(originOrgUnits, 'id'), "2015-11-12", "2015-12-28");
                expect(scope.events).toEqual([mockEvent]);
            });

            describe('exportToCSV', function() {
                var csvContent, mockDataValue, mockEvent;

                beforeEach(function () {
                    spyOn(scope, "getDisplayValue").and.callFake(function (data) {
                        return data.value;
                    });

                    spyOn(window, 'Blob').and.callFake(function (contentArray) {
                        this.value = contentArray.join();
                    });

                    filesystemService.promptAndWriteFile.and.callFake(function (fileName, blob) {
                        csvContent = blob.value;
                    });

                    mockDataValue = mockEventDataValue();
                    mockEvent = createMockEvent({
                        eventDate: moment('2016-07-31T12:00:00Z').toISOString(),
                        dataValues: [mockDataValue]
                    });
                    scope.events = [mockEvent];
                    scope.selectedModuleName = 'someModuleName';
                    scope.exportToCSV();
                });

                var escapeString = function(string) {
                    return '"' + string + '"';
                };

                it('should build headers for listed events while exporting to CSV', function () {
                    var expectedCsvContent = [escapeString(scope.resourceBundle.eventDateLabel), escapeString(mockDataValue.formName)].join(',');
                    expect(csvContent).toContain(expectedCsvContent);
                });

                it('should contain data for listed events while exporting data', function () {
                    var expectedCsvContent = [moment(mockEvent.eventDate).toDate().toLocaleDateString(), escapeString(mockDataValue.value)].join(',');
                    expect(csvContent).toContain(expectedCsvContent);
                });

                it('should format data values in CSV', function () {
                    expect(scope.getDisplayValue.calls.argsFor(0)).toContain(mockDataValue);
                });

                it('should prompt user to export data values into CSV', function () {
                    var expectedFilename = scope.selectedModuleName + '.summary.' + currentTime.format('DD-MMM-YYYY') + '.csv';
                    expect(filesystemService.promptAndWriteFile).toHaveBeenCalledWith(expectedFilename, jasmine.any(Blob), filesystemService.FILE_TYPE_OPTIONS.CSV);
                });

            });
        });
    });