/*global Date:true*/
define(["aggregateDataEntryController", "testData", "angularMocks", "lodash", "utils", "orgUnitMapper", "moment", "timecop", "dataRepository", "approvalDataRepository", "orgUnitRepository", "systemSettingRepository", "datasetRepository", "programRepository"],
    function(AggregateDataEntryController, testData, mocks, _, utils, orgUnitMapper, moment, timecop, DataRepository, ApprovalDataRepository, OrgUnitRepository, SystemSettingRepository, DatasetRepository, ProgramRepository) {
        describe("aggregateDataEntryController ", function() {
            var scope, routeParams, db, q, location, anchorScroll, aggregateDataEntryController, rootScope,
                saveSuccessPromise, saveErrorPromise, dataEntryFormMock, parentProject, getDataValuesSpy,
                orgUnits, window, getOrgUnitSpy, hustle, dataRepository, approvalDataRepository, timeout, orgUnitRepository, systemSettingRepository, origin1, origin2;

            beforeEach(module('hustle'));
            beforeEach(mocks.inject(function($rootScope, $q, $hustle, $anchorScroll, $location, $window, $timeout) {
                q = $q;
                hustle = $hustle;
                window = $window;
                timeout = $timeout;
                location = $location;
                anchorScroll = $anchorScroll;
                rootScope = $rootScope;
                routeParams = {};

                Timecop.install();
                Timecop.freeze(new Date("2014-10-29T12:43:54.972Z"));

                scope = $rootScope.$new();

                scope.year = 2014;
                scope.week = {
                    "weekNumber": 14,
                    "weekYear": 2014
                };
                scope.selectedModule = {
                    'id': 'mod1',
                    'name': 'Mod1',
                    'parent': {
                        'id': 'proj1'
                    }
                };

                parentProject = {
                    'id': 'proj1',
                    'attributeValues': [{
                        'attribute': {
                            'code': 'Type',
                            'name': 'Type',
                        },
                        'value': 'Project'
                    }]
                };
                origin1 = {
                    id: 'origin1',
                    parent: {
                        id: 'mod2'
                    }
                };
                origin2 = {
                    id: 'origin2',
                    parent: {
                        id: 'mod2'
                    }
                };

                scope.resourceBundle = {
                    "dataApprovalConfirmationMessage": ""
                };

                rootScope.currentUser = {
                    "firstName": "test1",
                    "lastName": "test1last",
                    "locale": "en",
                    "userCredentials": {
                        "username": "dataentryuser",
                        "userRoles": [{
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

                scope.resourceBundle = {
                    "uploadDataValuesDesc": "upload data for ",
                    "uploadApprovalDataDesc": "approve data at coordination level for ",
                    "uploadCompletionDataDesc": "approve data at project level for ",
                    "deleteApprovalsDesc": "restart approval process for "
                };

                fakeModal = {
                    close: function() {
                        this.result.confirmCallBack();
                    },
                    dismiss: function(type) {
                        this.result.cancelCallback(type);
                    },
                    open: function(object) {}
                };

                saveSuccessPromise = utils.getPromise(q, {
                    "ok": "ok"
                });

                saveErrorPromise = utils.getRejectedPromise(q, {
                    "ok": "ok"
                });

                scope.dataentryForm = {
                    $setPristine: function() {}
                };

                spyOn(location, "hash");

                orgUnitRepository = new OrgUnitRepository();
                spyOn(orgUnitRepository, "getParentProject").and.returnValue(utils.getPromise(q, parentProject));
                spyOn(orgUnitRepository, "getAllModulesInOrgUnits").and.returnValue(utils.getPromise(q, []));
                spyOn(orgUnitRepository, "findAllByParent").and.returnValue(utils.getPromise(q, [origin1, origin2]));

                programRepository = new ProgramRepository();
                spyOn(programRepository, "getProgramForOrgUnit").and.returnValue(utils.getPromise(q, undefined));

                systemSettingRepository = new SystemSettingRepository();
                spyOn(systemSettingRepository, "get").and.returnValue(utils.getPromise(q, {}));

                approvalDataRepository = new ApprovalDataRepository();
                spyOn(approvalDataRepository, "getApprovalData").and.returnValue(utils.getPromise(q, {}));
                spyOn(approvalDataRepository, "clearApprovals").and.returnValue(utils.getPromise(q, {}));

                dataRepository = new DataRepository();
                getDataValuesSpy = spyOn(dataRepository, "getDataValues");
                getDataValuesSpy.and.returnValue(utils.getPromise(q, undefined));

                spyOn(hustle, "publish");

                datasetRepository = new DatasetRepository();
                spyOn(datasetRepository, "findAllForOrgUnits").and.returnValue(utils.getPromise(q, []));
                spyOn(datasetRepository, "includeDataElements").and.returnValue(utils.getPromise(q, []));
                spyOn(datasetRepository, "includeCategoryOptionCombinations").and.returnValue(utils.getPromise(q, {'enrichedDataSets': [], 'catOptComboIdsToBeTotalled': ['option1', 'option3', 'option4']}));

                aggregateDataEntryController = new AggregateDataEntryController(scope, routeParams, q, hustle, anchorScroll, location, fakeModal, rootScope, window, timeout, dataRepository, systemSettingRepository, approvalDataRepository, orgUnitRepository, datasetRepository, programRepository);

                scope.$emit("moduleWeekInfo", [scope.selectedModule, scope.week]);
            }));

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            it("should return the sum of the list ", function() {
                scope.$apply();
                var list = {
                    "option1": {
                        "value": "1"
                    },
                    "option2": {
                        "value": "2"
                    },
                    "option3": {
                        "value": "3"
                    },
                    "option4": {
                        "value": "4"
                    }
                };

                expect(scope.sum(list)).toBe(8);
            });

            it("should return the sum of valid values ", function() {
                scope.$apply();
                var list = {
                    "option1": {
                        "value": "1"
                    },
                    "option2": {
                        "value": "2"
                    },
                    "option3": {
                        "value": undefined
                    },
                    "option4": {
                        "value": "4"
                    }
                };

                expect(scope.sum(list)).toBe(5);
            });

            it("should return the sum of valid expressions ", function() {
                scope.$apply();
                var list = {
                    "option1": {
                        "formula": "1 + 3",
                        "value": "4"
                    },
                    "option2": {
                        "value": "2"
                    },
                    "option3": {
                        "value": "3"
                    },
                    "option4": {
                        "value": "4"
                    }
                };

                expect(scope.sum(list)).toBe(11);
            });

            it("should return the sum of the map ", function() {
                scope.$apply();
                var list = {
                    "option1": {
                        "value": "1"
                    },
                    "option2": {
                        "value": "2"
                    },
                    "option3": {
                        "value": "3"
                    },
                    "option4": {
                        "value": "4"
                    }
                };
                expect(scope.sum(list)).toBe(8);
            });

            it("should evaluate expression on blur and store as string", function() {
                scope.dataValues = {
                    "mod1": {
                        "blah": {
                            "some": {
                                "value": "1+9"
                            }
                        }
                    }
                };
                scope.evaluateExpression("mod1", "blah", "some");

                expect(scope.dataValues.mod1.blah.some.value).toEqual("10");
            });

            it("should submit data values to indexeddb and dhis", function() {
                spyOn(dataRepository, "save").and.returnValue(saveSuccessPromise);
                spyOn(scope.dataentryForm, '$setPristine');

                scope.submit();
                scope.$apply();

                expect(dataRepository.save).toHaveBeenCalled();
                expect(hustle.publish).toHaveBeenCalledWith({
                    data: [],
                    type: 'uploadDataValues',
                    locale: 'en',
                    desc: 'upload data for 2014W14, Mod1'
                }, 'dataValues');

                expect(scope.submitSuccess).toBe(true);
                expect(scope.saveSuccess).toBe(false);
                expect(scope.submitError).toBe(false);
                expect(scope.saveError).toBe(false);
                expect(scope.dataentryForm.$setPristine).toHaveBeenCalled();
            });

            it("should save data values as draft to indexeddb", function() {

                spyOn(dataRepository, "saveAsDraft").and.returnValue(saveSuccessPromise);
                spyOn(scope.dataentryForm, '$setPristine');

                scope.saveAsDraft();
                scope.$apply();

                expect(dataRepository.saveAsDraft).toHaveBeenCalled();
                expect(hustle.publish).not.toHaveBeenCalled();
                expect(scope.submitSuccess).toBe(false);
                expect(scope.saveSuccess).toBe(true);
                expect(scope.submitError).toBe(false);
                expect(scope.saveError).toBe(false);
                expect(scope.dataentryForm.$setPristine).toHaveBeenCalled();
            });

            it("should warn the user when data will have to be reapproved", function() {
                approvalDataRepository.getApprovalData.and.returnValue(utils.getPromise(q, {
                    "isComplete": "true",
                    "isApproved": "true"
                }));

                spyOn(fakeModal, "open").and.returnValue({
                    result: utils.getPromise(q, {})
                });

                scope.$apply();
                scope.submit();

                expect(fakeModal.open).toHaveBeenCalled();
            });

            it("should let the user know of failures when saving the data to indexedDB ", function() {

                spyOn(dataRepository, "save").and.returnValue(saveErrorPromise);

                scope.submit();
                scope.$apply();

                expect(dataRepository.save).toHaveBeenCalled();
                expect(hustle.publish).not.toHaveBeenCalled();
                expect(scope.submitSuccess).toBe(false);
                expect(scope.saveSuccess).toBe(false);
                expect(scope.submitError).toBe(true);
                expect(scope.saveError).toBe(false);
            });

            it("should fetch max length to calculate col span for category options", function() {
                var maxCols = scope.maxcolumns([
                    [1, 2],
                    [4, 5, 4, 5]
                ]);

                expect(maxCols).toEqual(4);
            });

            it("safe get dataValues should initialize data value and option if not present", function() {
                scope.$apply();
                var dataValues = {};
                var result = scope.safeGet(dataValues, "blah", "someOption", "mod2");

                expect(dataValues).toEqual({
                    "mod2": {
                        "blah": {
                            "someOption": {
                                "formula": '',
                                "value": ''
                            }
                        }
                    }
                });
                expect(result).toEqual({
                    "formula": '',
                    "value": ''
                });
            });

            it("safe get dataValues should return if already present", function() {
                scope.$apply();
                var dataValues = {
                    "mod2": {
                        "blah": {
                            "someOption": "test"
                        }
                    }
                };

                var result = scope.safeGet(dataValues, "blah", "someOption", "mod2");

                expect(dataValues).toEqual({
                    "mod2": {
                        "blah": {
                            "someOption": "test"
                        }
                    }
                });
                expect(result).toEqual(dataValues.mod2.blah.someOption);
            });

            it("should fetch empty data if no data exists for the given period", function() {
                scope.year = 2014;
                scope.week = {
                    "weekNumber": 14,
                    "weekYear": 2014
                };
                scope.$apply();

                expect(dataRepository.getDataValues).toHaveBeenCalledWith('2014W14', ['mod1', 'origin1', 'origin2']);
                expect(scope.dataValues).toEqual({});
            });

            it("should display data for the given period", function() {

                getDataValuesSpy.and.returnValue(utils.getPromise(q, [{
                    "dataElement": "DE_Oedema",
                    "categoryOptionCombo": "32",
                    "value": "3",
                    "dataset": "abbc",
                    "orgUnit": "mod1"
                }, {
                    "dataElement": "DE_Oedema",
                    "categoryOptionCombo": "33",
                    "value": "12",
                    "dataset": "abbc",
                    "orgUnit": "mod1"
                }]));

                scope.$apply();

                expect(dataRepository.getDataValues).toHaveBeenCalledWith("2014W14", ["mod1", "origin1", "origin2"]);
                expect(scope.dataValues).toEqual({
                    "mod1": {
                        "DE_Oedema": {
                            "32": {
                                "formula": '3',
                                "value": '3'
                            },
                            "33": {
                                "formula": '12',
                                "value": '12'
                            }
                        }
                    }
                });
            });

            it("should display the correct submit option for auto approved projects", function() {

                orgUnitRepository.getParentProject.and.returnValue(utils.getPromise(q, {
                    "id": "proj1",
                    "attributeValues": [{
                        'attribute': {
                            'code': 'autoApprove',
                            'name': 'Auto Approve',
                            'id': 'e65afaec61d'
                        },
                        'value': 'true'
                    }, {
                        'attribute': {
                            'code': 'Type',
                            'name': 'Type',
                        },
                        'value': 'Project'
                    }]
                }));

                scope.week = {
                    "weekNumber": 14,
                    "weekYear": 2014
                };
                scope.currentModule = {
                    'id': 'mod1',
                    parent: {
                        id: 'parent'
                    }
                };

                scope.$apply();

                expect(scope.projectIsAutoApproved).toBeTruthy();
            });

            it('should prevent navigation if data entry form is dirty', function() {
                scope.dataentryForm.$dirty = false;
                scope.dataentryForm.$dirty = true;
                scope.$apply();

                expect(scope.preventNavigation).toEqual(true);
            });

            it('should not prevent navigation if data entry form is not dirty', function() {
                scope.dataentryForm.$dirty = true;
                scope.dataentryForm.$dirty = false;
                scope.$apply();

                expect(scope.preventNavigation).toEqual(false);
            });

            it("should return true if current week is selected", function() {
                var selectedWeek = {
                    'weekNumber': 2,
                    "weekYear": 2014,
                    'startOfWeek': moment().startOf("isoWeek").format("YYYY-MM-DD"),
                    'endOfWeek': moment().endOf("isoWeek").format("YYYY-MM-DD")
                };

                expect(scope.isCurrentWeekSelected(selectedWeek)).toEqual(true);
                scope.$apply();
            });

            it("should return false if current week is not selected", function() {
                var selectedWeek = {
                    'weekNumber': 21,
                    "weekYear": 2014,
                    'startOfWeek': moment("2001-01-01", "YYYY-MM-DD").startOf("isoWeek").format("YYYY-MM-DD"),
                    'endOfWeek': moment("2001-01-01", "YYYY-MM-DD").endOf("isoWeek").format("YYYY-MM-DD")
                };

                expect(scope.isCurrentWeekSelected(selectedWeek)).toEqual(false);
                scope.$apply();
            });

            it("should expand the first dataset panel", function() {
                var id = "first_panel_id";
                var isDatasetOpen = scope.getDatasetState(id, true);
                expect(isDatasetOpen[id]).toBe(true);
            });

            it("should not expand the first dataset panel after the first time", function() {
                var id = "first_panel_id";
                scope.isDatasetOpen[id] = false;
                var isDatasetOpen = scope.getDatasetState(id, true);
                expect(isDatasetOpen[id]).toBe(false);
            });

            it("should not expand the other panels", function() {
                var id = "some_other_panel_id";
                var isDatasetOpen = scope.getDatasetState(id, false);
                expect(isDatasetOpen[id]).toBe(undefined);
            });

            it("should render all panels completely and print tally sheet in the next tick", function() {
                spyOn(window, "print");

                scope.printWindow();
                timeout.flush();

                expect(scope.printingTallySheet).toBeTruthy();
                expect(window.print).toHaveBeenCalled();
            });

            it("should show not-ready-for-approval message if no data has been saved or submitted", function() {
                scope.$apply();

                expect(scope.isSubmitted).toBe(false);
            });

            it("should show not-ready-for-approval message if data has been saved as draft", function() {
                getDataValuesSpy.and.returnValue(utils.getPromise(q, [{
                    "dataElement": "b9634a78271",
                    "period": "2014W14",
                    "orgUnit": "mod2",
                    "categoryOptionCombo": "h48rgCOjDTg",
                    "value": "12",
                    "isDraft": true,
                    "storedBy": "service.account",
                    "followUp": false
                }, {
                    "dataElement": "b9634a78271",
                    "period": "2014W14",
                    "orgUnit": "mod2",
                    "categoryOptionCombo": "h48rgCOjDTg",
                    "value": "13",
                    "isDraft": true,
                    "storedBy": "service.account",
                    "followUp": false
                }]));

                scope.$apply();

                expect(scope.isSubmitted).toBe(false);
            });

            it("should show ready-for-approval message if data has already been submitted for approval", function() {
                getDataValuesSpy.and.returnValue(utils.getPromise(q, [{
                    "dataElement": "b9634a78271",
                    "period": "2014W14",
                    "orgUnit": "mod2",
                    "categoryOptionCombo": "h48rgCOjDTg",
                    "value": "12",
                    "storedBy": "service.account",
                    "followUp": false
                }, {
                    "dataElement": "b9634a78271",
                    "period": "2014W14",
                    "orgUnit": "mod2",
                    "categoryOptionCombo": "h48rgCOjDTg",
                    "value": "13",
                    "storedBy": "service.account",
                    "followUp": false
                }]));

                scope.$apply();

                expect(scope.isSubmitted).toBe(true);
            });

            it("should submit data for auto approval", function() {
                approvalDataRepository.getApprovalData.and.callFake(function() {
                    return utils.getPromise(q, undefined);
                });

                spyOn(fakeModal, "open").and.returnValue({
                    result: utils.getPromise(q, {})
                });

                spyOn(dataRepository, "save").and.returnValue(saveSuccessPromise);

                var periodAndOrgUnit = {
                    "period": '2014W14',
                    "orgUnit": 'mod1',
                };

                var approvedAndCompletedBy = "dataentryuser";

                spyOn(approvalDataRepository, "markAsApproved").and.callFake(function() {
                    return utils.getPromise(q, {
                        "blah": "moreBlah"
                    });
                });

                scope.currentModule = {
                    id: 'mod1',
                    name: "Mod1",
                    parent: {
                        id: 'parent'
                    }
                };
                scope.$apply();

                scope.submitAndApprove();
                scope.$apply();

                expect(approvalDataRepository.markAsApproved.calls.argsFor(0)[0]).toEqual(periodAndOrgUnit);
                expect(hustle.publish).toHaveBeenCalledWith({
                    "data": [periodAndOrgUnit],
                    "type": "uploadCompletionData",
                    "locale": "en",
                    "desc": "approve data at project level for 2014W14, Mod1"
                }, "dataValues");
                expect(hustle.publish).toHaveBeenCalledWith({
                    "data": [periodAndOrgUnit],
                    "type": "uploadApprovalData",
                    "locale": "en",
                    "desc": "approve data at coordination level for 2014W14, Mod1"
                }, "dataValues");
                expect(scope.submitAndApprovalSuccess).toBe(true);
            });

            it("should show a message if data is already complete", function() {
                approvalDataRepository.getApprovalData.and.returnValue(utils.getPromise(q, {
                    "isComplete": true
                }));

                scope.$apply();

                expect(scope.isCompleted).toBeTruthy();
            });

            it("should show a message if data is already approved", function() {
                approvalDataRepository.getApprovalData.and.returnValue(utils.getPromise(q, {
                    "isComplete": true,
                    'isApproved': true
                }));

                scope.$apply();

                expect(scope.isApproved).toBeTruthy();
            });

            it("should delete approvals if data is edited", function() {
                spyOn(dataRepository, "save").and.returnValue(saveSuccessPromise);
                scope.$apply();

                scope.submit();
                scope.$apply();

                var periodAndOrgUnit = {
                    "period": "2014W14",
                    "orgUnit": "mod1"
                };

                expect(dataRepository.save).toHaveBeenCalled();
                expect(approvalDataRepository.clearApprovals.calls.argsFor(0)[0]).toEqual(periodAndOrgUnit);
                expect(hustle.publish).toHaveBeenCalledWith({
                    "data": periodAndOrgUnit,
                    "type": "deleteApprovals",
                    "locale": "en",
                    "desc": "restart approval process for 2014W14, Mod1"
                }, "dataValues");
            });

            it("should not allow data entry if selected week is beyond configured week", function() {
                scope.week = {
                    "startOfWeek": "2014-02-02",
                    "weekNumber": 05,
                    "weekYear": 2014
                };

                expect(scope.isDataEntryAllowed()).toBeFalsy();
                scope.$apply();
            });
        });
    });
