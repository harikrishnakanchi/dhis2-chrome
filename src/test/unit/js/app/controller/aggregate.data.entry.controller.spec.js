/*global Date:true*/
define(["aggregateDataEntryController", "testData", "angularMocks", "lodash", "utils", "orgUnitMapper", "moment", "timecop", "dataRepository", "approvalDataRepository", "orgUnitRepository", "systemSettingRepository"],
    function(AggregateDataEntryController, testData, mocks, _, utils, orgUnitMapper, moment, timecop, DataRepository, ApprovalDataRepository, OrgUnitRepository, SystemSettingRepository) {
        describe("aggregateDataEntryController ", function() {
            var scope, routeParams, db, q, location, anchorScroll, aggregateDataEntryController, rootScope, approvalStore,
                saveSuccessPromise, saveErrorPromise, dataEntryFormMock, parentProject, getApprovalDataSpy, getDataValuesSpy,
                orgUnits, window, approvalStoreSpy, getOrgUnitSpy, hustle, dataRepository, approvalDataRepository, timeout, orgUnitRepository, systemSettingRepository, origin1, origin2;

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
                dataRepository = new DataRepository();
                approvalDataRepository = new ApprovalDataRepository();

                scope.currentModule = {
                    id: 'mod2',
                    parent: {
                        id: 'parent'
                    }
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
                scope.year = 2014;
                scope.week = {
                    "weekNumber": 14,
                    "weekYear": 2014
                };

                orgUnitRepository = new OrgUnitRepository();
                systemSettingRepository = new SystemSettingRepository();
                parentProject = {
                    'id': 'parent',
                    'attributeValues': [{
                        'attribute': {
                            'code': 'Type',
                            'name': 'Type',
                        },
                        'value': 'Project'
                    }]
                };

                getOrgUnitSpy = spyOn(orgUnitRepository, "getParentProject");
                getOrgUnitSpy.and.returnValue(utils.getPromise(q, parentProject));
                spyOn(orgUnitRepository, "getAllModulesInOrgUnits").and.returnValue(utils.getPromise(q, []));
                spyOn(systemSettingRepository, "get").and.returnValue(utils.getPromise(q, {}));

                var queryBuilder = function() {
                    this.$index = function() {
                        return this;
                    };
                    this.$eq = function(v) {
                        return this;
                    };
                    this.compile = function() {
                        return "blah";
                    };
                    return this;
                };

                db = {
                    "objectStore": function() {},
                    "queryBuilder": queryBuilder
                };

                scope.dataentryForm = {
                    $setPristine: function() {}
                };

                scope.resourceBundle = {
                    "dataApprovalConfirmationMessage": ""
                };

                var getMockStore = function(data) {
                    var getAll = function() {
                        return utils.getPromise(q, data);
                    };
                    var upsert = function() {};
                    var find = function() {};
                    var each = function() {};

                    return {
                        getAll: getAll,
                        upsert: upsert,
                        find: find,
                        each: each,
                    };
                };
                approvalStore = getMockStore("approvals");

                spyOn(db, 'objectStore').and.callFake(function(storeName) {
                    if (storeName === "approvals")
                        return approvalStore;
                    return getMockStore(testData.get(storeName));
                });

                rootScope.currentUser = {
                    "firstName": "test1",
                    "lastName": "test1last",
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

                spyOn(location, "hash");

                saveSuccessPromise = utils.getPromise(q, {
                    "ok": "ok"
                });

                saveErrorPromise = utils.getRejectedPromise(q, {
                    "ok": "ok"
                });

                approvalStoreSpy = spyOn(approvalStore, "each");
                approvalStoreSpy.and.returnValue(utils.getPromise(q, [{}]));

                getApprovalDataSpy = spyOn(approvalDataRepository, "getApprovalData");
                getApprovalDataSpy.and.returnValue(utils.getPromise(q, {}));

                spyOn(approvalDataRepository, "clearApprovals").and.returnValue(utils.getPromise(q, {}));

                getDataValuesSpy = spyOn(dataRepository, "getDataValues");
                getDataValuesSpy.and.returnValue(utils.getPromise(q, undefined));

                spyOn(hustle, "publish");

                fakeModal = {
                    close: function() {
                        this.result.confirmCallBack();
                    },
                    dismiss: function(type) {
                        this.result.cancelCallback(type);
                    },
                    open: function(object) {}
                };

                spyOn(orgUnitRepository, "findAllByParent").and.returnValue(utils.getPromise(q, [origin1, origin2]));
                aggregateDataEntryController = new AggregateDataEntryController(scope, routeParams, q, hustle, db, dataRepository, systemSettingRepository, anchorScroll, location, fakeModal, rootScope, window, approvalDataRepository, timeout, orgUnitRepository);
            }));

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            it("should return the sum of the list ", function() {
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

                expect(scope.sum(list)).toBe(10);
            });

            it("should return the sum of valid values ", function() {
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

                expect(scope.sum(list)).toBe(7);
            });

            it("should return the sum of valid expressions ", function() {
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

                expect(scope.sum(list)).toBe(13);
            });

            it("should return the sum of the map ", function() {
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
                expect(scope.sum(list)).toBe(10);
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

            it("should group sections based on datasets", function() {
                scope.$apply();

                var dataSetKeys = _.keys(scope.groupedSections);
                expect(dataSetKeys.length).toBe(3);
                expect(dataSetKeys).toContain("DS_OPD");
                expect(dataSetKeys).toContain("Vacc");

                expect(scope.groupedSections.DS_OPD.length).toBe(2);
                expect(scope.groupedSections.Vacc.length).toBe(1);
            });

            it("should return the data set name given the id", function() {
                scope.$apply();
                var datasetId = "DS_OPD";
                expect(scope.getDataSetName(datasetId)).toEqual("OPD");
            });

            it("should submit data values to indexeddb and dhis", function() {
                spyOn(dataRepository, "save").and.returnValue(saveSuccessPromise);
                spyOn(scope.dataentryForm, '$setPristine');

                var aggregateDataEntryController = new AggregateDataEntryController(scope, routeParams, q, hustle, db, dataRepository, systemSettingRepository, anchorScroll, location, fakeModal, rootScope, window, approvalDataRepository, timeout, orgUnitRepository);

                scope.submit();
                scope.$apply();

                expect(dataRepository.save).toHaveBeenCalled();
                expect(hustle.publish).toHaveBeenCalledWith({
                    data: [],
                    type: 'uploadDataValues'
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

                var aggregateDataEntryController = new AggregateDataEntryController(scope, routeParams, q, hustle, db, dataRepository, systemSettingRepository, anchorScroll, location, fakeModal, rootScope, window, approvalDataRepository, timeout, orgUnitRepository);

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
                getApprovalDataSpy.and.returnValue(utils.getPromise(q, {
                    "isComplete": "true",
                    "isApproved": "true"
                }));

                spyOn(fakeModal, "open").and.returnValue({
                    result: utils.getPromise(q, {})
                });

                var aggregateDataEntryController = new AggregateDataEntryController(scope, routeParams, q, hustle, db, dataRepository, systemSettingRepository, anchorScroll, location, fakeModal, rootScope, window, approvalDataRepository, timeout, orgUnitRepository);


                scope.$apply();
                scope.submit();

                expect(fakeModal.open).toHaveBeenCalled();
            });

            it("should let the user know of failures when saving the data to indexedDB ", function() {

                spyOn(dataRepository, "save").and.returnValue(saveErrorPromise);

                var aggregateDataEntryController = new AggregateDataEntryController(scope, routeParams, q, hustle, db, dataRepository, systemSettingRepository, anchorScroll, location, fakeModal, rootScope, window, approvalDataRepository, timeout, orgUnitRepository);

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
                scope.currentModule = {
                    'id': 'Mod1',
                    'parent': {
                        'id': 'proj1'
                    }
                };
                scope.$apply();

                expect(dataRepository.getDataValues).toHaveBeenCalledWith('2014W14', ['Mod1', 'origin1', 'origin2']);
                expect(scope.dataValues).toEqual({});
            });

            it("should display data for the given period", function() {
                scope.year = 2014;
                scope.week = {
                    "weekNumber": 14,
                    "weekYear": 2014
                };
                scope.currentModule = {
                    id: 'mod2',
                    parent: {
                        id: 'parent'
                    }
                };
                getDataValuesSpy.and.returnValue(utils.getPromise(q, [{
                    "dataElement": "DE_Oedema",
                    "categoryOptionCombo": "32",
                    "value": "3",
                    "dataset": "abbc",
                    "orgUnit": "mod2"
                }, {
                    "dataElement": "DE_Oedema",
                    "categoryOptionCombo": "33",
                    "value": "12",
                    "dataset": "abbc",
                    "orgUnit": "mod2"
                }]));

                scope.$apply();

                expect(dataRepository.getDataValues).toHaveBeenCalledWith("2014W14", ["mod2", "origin1", "origin2"]);
                expect(scope.dataValues).toEqual({
                    "mod2": {
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

            it('should set dataset sections if module is selected', function() {
                spyOn(scope.dataentryForm, '$setPristine');

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

                expect(_.keys(scope.currentGroupedSections)).toEqual(['DS_OPD']);
                expect(_.keys(scope.currentGroupedSectionsForOrigins)).toEqual(['Geographic Origin']);
                expect(scope.dataentryForm.$setPristine).toHaveBeenCalled();
            });

            it("should display the correct submit option for auto approved projects", function() {
                getOrgUnitSpy.and.returnValue(utils.getPromise(q, {
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

            it("should submit data for first level approval", function() {
                var levelOneApprovalDataSaved = false;
                getApprovalDataSpy.and.callFake(function() {
                    if (levelOneApprovalDataSaved)
                        return utils.getPromise(q, {
                            "isComplete": true
                        });
                    return utils.getPromise(q, undefined);
                });

                spyOn(fakeModal, "open").and.returnValue({
                    result: utils.getPromise(q, {})
                });

                spyOn(approvalDataRepository, "markAsComplete").and.callFake(function() {
                    levelOneApprovalDataSaved = true;
                    return utils.getPromise(q, {});
                });

                var periodAndOrgUnit = {
                    "period": '2014W14',
                    "orgUnit": 'mod1'
                };
                var storedBy = "dataentryuser";
                scope.currentModule = {
                    id: 'mod1',
                    parent: {
                        id: 'parent'
                    }
                };

                scope.$apply();

                scope.firstLevelApproval();
                scope.$apply();

                expect(approvalDataRepository.markAsComplete).toHaveBeenCalledWith(periodAndOrgUnit, storedBy);

                expect(hustle.publish).toHaveBeenCalledWith({
                    "data": [periodAndOrgUnit],
                    "type": "uploadCompletionData"
                }, "dataValues");

                expect(scope.firstLevelApproveSuccess).toBe(true);
                expect(scope.secondLevelApproveSuccess).toBe(false);
                expect(scope.approveError).toBe(false);
                expect(scope.isCompleted).toEqual(true);
            });

            it("should submit data for auto approval", function() {
                getApprovalDataSpy.and.callFake(function() {
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

                getOrgUnitSpy.and.returnValue(utils.getPromise(q, {
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

                scope.currentModule = {
                    id: 'mod1',
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
                    "type": "uploadCompletionData"
                }, "dataValues");
                expect(hustle.publish).toHaveBeenCalledWith({
                    "data": [periodAndOrgUnit],
                    "type": "uploadApprovalData"
                }, "dataValues");
                expect(scope.submitAndApprovalSuccess).toBe(true);
            });

            it("should not submit data for approval", function() {
                spyOn(fakeModal, "open").and.returnValue({
                    result: utils.getPromise(q, {})
                });

                spyOn(approvalDataRepository, "markAsComplete").and.returnValue(utils.getRejectedPromise(q, {}));

                scope.firstLevelApproval();
                scope.$apply();

                expect(scope.firstLevelApproveSuccess).toBe(false);
                expect(scope.secondLevelApproveSuccess).toBe(false);
                expect(scope.approveError).toBe(true);
                expect(scope.isCompleted).toEqual(false);
            });

            it("should mark data as complete if proccessed", function() {
                scope.$apply();

                spyOn(fakeModal, "open").and.returnValue({
                    result: utils.getPromise(q, {})
                });
                spyOn(approvalDataRepository, "markAsComplete").and.returnValue(utils.getPromise(q, {}));

                scope.firstLevelApproval();
                scope.$apply();

                expect(scope.firstLevelApproveSuccess).toBe(true);
                expect(scope.secondLevelApproveSuccess).toBe(false);
                expect(scope.approveError).toBe(false);
            });

            it("should show a message if data is already complete", function() {
                getApprovalDataSpy.and.returnValue(utils.getPromise(q, {
                    "isComplete": true
                }));

                scope.$apply();

                expect(scope.isCompleted).toBeTruthy();
            });

            it("should mark data as approved if proccessed", function() {
                var levelTwoApprovalDataSaved = false;
                getApprovalDataSpy.and.callFake(function() {
                    if (levelTwoApprovalDataSaved)
                        return utils.getPromise(q, {
                            "isComplete": true,
                            "isApproved": true
                        });
                    return utils.getPromise(q, {
                        "isComplete": true
                    });
                });

                scope.$apply();

                spyOn(fakeModal, "open").and.returnValue({
                    result: utils.getPromise(q, {})
                });

                spyOn(approvalDataRepository, "markAsApproved").and.callFake(function() {
                    levelTwoApprovalDataSaved = true;
                    return utils.getPromise(q, {
                        "blah": "moreBlah"
                    });
                });

                scope.secondLevelApproval();
                scope.$apply();

                expect(scope.firstLevelApproveSuccess).toBe(false);
                expect(scope.secondLevelApproveSuccess).toBe(true);
                expect(scope.approveError).toBe(false);
                expect(scope.isCompleted).toEqual(true);
                expect(scope.isApproved).toEqual(true);
            });

            it("should show a message if data is already approved", function() {
                getApprovalDataSpy.and.returnValue(utils.getPromise(q, {
                    "isComplete": true,
                    'isApproved': true
                }));

                scope.$apply();

                expect(scope.isApproved).toBeTruthy();
            });

            it("should delete approvals if data is edited", function() {

                spyOn(dataRepository, "save").and.returnValue(saveSuccessPromise);

                var aggregateDataEntryController = new AggregateDataEntryController(scope, routeParams, q, hustle, db,
                    dataRepository, systemSettingRepository, anchorScroll, location, fakeModal, rootScope, window, approvalDataRepository, timeout, orgUnitRepository);

                scope.submit();
                scope.$apply();

                var periodAndOrgUnit = {
                    "period": "2014W14",
                    "orgUnit": "mod2"
                };

                expect(dataRepository.save).toHaveBeenCalled();
                expect(approvalDataRepository.clearApprovals.calls.argsFor(0)[0]).toEqual(periodAndOrgUnit);
                expect(hustle.publish).toHaveBeenCalledWith({
                    "data": periodAndOrgUnit,
                    "type": "deleteApprovals"
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

            it("should return true if data can be entered for orgUnit", function() {
                scope.$apply();
                expect(scope.shouldDataBeEnteredForOrgUnit("origin2")).toEqual(true);
                expect(scope.shouldDataBeEnteredForOrgUnit("mod2")).toEqual(true);
            });

            it("should return false if data can not be entered for orgUnit", function() {
                scope.$apply();
                expect(scope.shouldDataBeEnteredForOrgUnit("mod3")).toEqual(false);

            });

            it("should submit data for second level approval", function() {
                var levelTwoApprovalDataSaved = false;
                getApprovalDataSpy.and.callFake(function() {
                    if (levelTwoApprovalDataSaved)
                        return utils.getPromise(q, {
                            "isComplete": true,
                            "isApproved": true
                        });
                    return utils.getPromise(q, {
                        "isComplete": true
                    });
                });

                spyOn(fakeModal, "open").and.returnValue({
                    result: utils.getPromise(q, {})
                });

                spyOn(approvalDataRepository, "markAsApproved").and.callFake(function() {
                    levelTwoApprovalDataSaved = true;
                    return utils.getPromise(q, {});
                });

                var periodAndOrgUnit = {
                    "period": '2014W14',
                    "orgUnit": 'mod1',
                };
                var approvedBy = "dataentryuser";
                scope.currentModule = {
                    id: 'mod1',
                    parent: {
                        id: 'parent'
                    }
                };

                scope.$apply();

                scope.secondLevelApproval();
                scope.$apply();

                expect(approvalDataRepository.markAsApproved).toHaveBeenCalledWith(periodAndOrgUnit, approvedBy);
                expect(hustle.publish).toHaveBeenCalledWith({
                    "data": [periodAndOrgUnit],
                    "type": "uploadApprovalData"
                }, "dataValues");
                expect(scope.secondLevelApproveSuccess).toBe(true);
                expect(scope.approveError).toBe(false);
            });
        });
    });
