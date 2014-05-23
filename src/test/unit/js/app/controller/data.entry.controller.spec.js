/*global Date:true*/
define(["dataEntryController", "testData", "angularMocks", "lodash", "utils", "orgUnitMapper", "moment", "dataRepository"], function(DataEntryController, testData, mocks, _, utils, orgUnitMapper, moment, DataRepository) {
    describe("dataEntryController ", function() {
        var scope, db, q, dataService, location, anchorScroll, dataEntryController, rootScope, approvalStore, saveSuccessPromise, saveErrorPromise, dataEntryFormMock,
            orgUnits, window, approvalService, approvalStoreSpy, hustle, dataRepository;

        beforeEach(module('hustle'));
        beforeEach(mocks.inject(function($rootScope, $q, $hustle, $anchorScroll, $location, $window) {
            q = $q;
            hustle = $hustle;
            window = $window;
            location = $location;
            anchorScroll = $anchorScroll;
            rootScope = $rootScope;

            scope = $rootScope.$new();
            dataRepository = new DataRepository();

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

            modal = {
                'open': function() {
                    return {
                        result: utils.getPromise(q, {})
                    };
                }
            };

            scope.dataentryForm = {
                $setPristine: function() {}
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

            approvalService = {
                approve: function() {}
            };

            dataService = {
                saveDataAsDraft: function() {},
                submitData: function() {},
                getDataValues: function() {}
            };

            rootScope.currentUser = {
                "firstName": "test1",
                "lastName": "test1last",
                "userCredentials": {
                    "username": "dataentryuser",
                    "userAuthorityGroups": [{
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

            getDataValuesPromise = utils.getPromise(q, undefined);

            saveSuccessPromise = utils.getPromise(q, {
                "ok": "ok"
            });

            saveErrorPromise = utils.getRejectedPromise(q, {
                "ok": "ok"
            });

            approvalStoreSpy = spyOn(approvalStore, "each");
            approvalStoreSpy.and.returnValue(utils.getPromise(q, [{}]));

            dataEntryController = new DataEntryController(scope, q, hustle, db, dataRepository, dataService, anchorScroll, location, modal, rootScope, window, approvalService);
        }));

        it("should initialize modules", function() {
            rootScope.currentUser = {
                "firstName": "test1",
                "lastName": "test1last",
                "userCredentials": {
                    "username": "dataentryuser",
                    "userAuthorityGroups": [{
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

            var expectedModules = [{
                'name': 'mod1',
                'displayName': 'mod1',
                'id': 'mod1',
                'parent': {
                    id: "proj_1"
                },
                'attributeValues': [{
                    'attribute': {
                        id: "a1fa2777924"
                    },
                    value: "Module"
                }]
            }, {
                'name': 'mod2',
                'displayName': 'mod2',
                'id': 'mod2',
                'parent': {
                    id: "proj_1"
                },
                'attributeValues': [{
                    'attribute': {
                        id: "a1fa2777924"
                    },
                    value: "Module"
                }]
            }, {
                'name': 'modunderopunit',
                'displayName': 'opunitUnderPrj - modunderopunit',
                'id': 'mod11',
                'parent': {
                    id: "opunit1"
                },
                'attributeValues': [{
                    'attribute': {
                        id: "a1fa2777924"
                    },
                    value: "Module"
                }]
            }];

            scope.$apply();

            dataEntryController = new DataEntryController(scope, q, hustle, db, dataRepository, dataService, anchorScroll, location, modal, rootScope);

            expect(scope.modules).toEqual(expectedModules);
        });

        it("should return the sum of the list ", function() {
            var list = {
                "option1": {
                    "value": 1
                },
                "option2": {
                    "value": 2
                },
                "option3": {
                    "value": 3
                },
                "option4": {
                    "value": 4
                }
            };

            expect(scope.sum(list)).toBe(10);
        });

        it("should return the sum of valid values ", function() {
            var list = {
                "option1": {
                    "value": 1
                },
                "option2": {
                    "value": 2
                },
                "option3": {
                    "value": undefined
                },
                "option4": {
                    "value": 4
                }
            };

            expect(scope.sum(list)).toBe(7);
        });

        it("should return the sum of valid expressions ", function() {
            var list = {
                "option1": {
                    "formula": "1 + 3",
                    "value": 4
                },
                "option2": {
                    "value": 2
                },
                "option3": {
                    "value": 3
                },
                "option4": {
                    "value": 4
                }
            };

            expect(scope.sum(list)).toBe(13);
        });

        it("should return the sum of the map ", function() {
            var list = {
                "option1": {
                    "value": 1
                },
                "option2": {
                    "value": 2
                },
                "option3": {
                    "value": 3
                },
                "option4": {
                    "value": 4
                }
            };
            expect(scope.sum(list)).toBe(10);
        });

        it("should evaluate expression on blur", function() {
            scope.dataValues = {
                "blah": {
                    "some": {
                        "value": "1+9"
                    }
                }
            };

            scope.evaluateExpression("blah", "some");

            expect(scope.dataValues.blah.some.value).toEqual(10);
        });

        it("should group sections based on datasets", function() {
            scope.$apply();

            var dataSetKeys = _.keys(scope.groupedSections);
            expect(dataSetKeys.length).toBe(2);
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
            spyOn(scope.dataentryForm, '$setPristine');
            spyOn(dataRepository, "getDataValues").and.returnValue(getDataValuesPromise);
            spyOn(dataRepository, "save").and.returnValue(saveSuccessPromise);
            spyOn(hustle, "publish");

            var dataEntryController = new DataEntryController(scope, q, hustle, db, dataRepository, dataService, anchorScroll, location, modal, rootScope);

            scope.currentModule = {
                id: 'mod2',
                parent: {
                    id: 'parent'
                }
            };
            scope.year = 2014;
            scope.week = {
                "weekNumber": 14
            };

            scope.submit();
            scope.$apply();

            expect(dataRepository.save).toHaveBeenCalled();
            expect(hustle.publish).toHaveBeenCalled();
            expect(scope.submitSuccess).toBe(true);
            expect(scope.saveSuccess).toBe(false);
            expect(scope.submitError).toBe(false);
            expect(scope.saveError).toBe(false);
            expect(scope.dataentryForm.$setPristine).toHaveBeenCalled();
        });

        it("should save data values as draft to indexeddb", function() {

            spyOn(scope.dataentryForm, '$setPristine');
            spyOn(dataRepository, "getDataValues").and.returnValue(getDataValuesPromise);
            spyOn(dataRepository, "saveAsDraft").and.returnValue(saveSuccessPromise);
            spyOn(hustle, "publish");

            var dataEntryController = new DataEntryController(scope, q, hustle, db, dataRepository, dataService, anchorScroll, location, modal, rootScope);

            scope.currentModule = {
                id: 'mod2',
                parent: {
                    id: 'parent'
                }
            };
            scope.year = 2014;
            scope.week = {
                "weekNumber": 14
            };

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

        it("should let the user know of failures when saving the data to indexedDB ", function() {
            spyOn(dataRepository, "getDataValues").and.returnValue(getDataValuesPromise);
            spyOn(dataRepository, "save").and.returnValue(saveErrorPromise);
            spyOn(hustle, "publish");


            var dataEntryController = new DataEntryController(scope, q, hustle, db, dataRepository, dataService, anchorScroll, location, modal, rootScope);
            scope.currentModule = {
                id: 'mod2',
                parent: {
                    id: 'parent'
                }
            };
            scope.year = 2014;
            scope.week = {
                "weekNumber": 14
            };

            scope.submit();
            scope.$apply();

            expect(dataRepository.save).toHaveBeenCalled();
            expect(hustle.publish).not.toHaveBeenCalled();
            expect(scope.submitSuccess).toBe(false);
            expect(scope.saveSuccess).toBe(false);
            expect(scope.submitError).toBe(true);
            expect(scope.saveError).toBe(false);
        });

        it("should let the user know of failures when saving to queue ", function() {

            spyOn(dataRepository, "getDataValues").and.returnValue(getDataValuesPromise);
            spyOn(dataRepository, "save").and.returnValue(saveSuccessPromise);
            spyOn(hustle, "publish").and.returnValue(saveErrorPromise);;


            var dataEntryController = new DataEntryController(scope, q, hustle, db, dataRepository, dataService, anchorScroll, location, modal, rootScope);
            scope.currentModule = {
                id: 'mod2',
                parent: {
                    id: 'parent'
                }
            };
            scope.year = 2014;
            scope.week = {
                "weekNumber": 14
            };

            scope.submit();
            scope.$apply();

            expect(dataRepository.save).toHaveBeenCalled();
            expect(hustle.publish).toHaveBeenCalled();
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
            var dataValues = {};
            var result = scope.safeGet(dataValues, "blah", "someOption");

            expect(dataValues).toEqual({
                blah: {
                    someOption: {
                        formula: '',
                        value: ''
                    }
                }
            });
            expect(result).toEqual({
                formula: '',
                value: ''
            });
        });

        it("safe get dataValues should return if already present", function() {
            var dataValues = {
                "blah": {
                    "someOption": "test"
                }
            };

            var result = scope.safeGet(dataValues, "blah", "someOption");

            expect(dataValues).toEqual({
                blah: {
                    someOption: 'test'
                }
            });
            expect(result).toEqual(dataValues.blah.someOption);
        });

        it("should fetch data only if period is defined", function() {
            spyOn(dataRepository, 'getDataValues');

            scope.week = undefined;
            scope.$apply();

            expect(dataRepository.getDataValues).not.toHaveBeenCalled();
        });

        it("should fetch empty data if no data exists for the given period", function() {
            scope.year = 2014;
            scope.week = {
                "weekNumber": 14
            };
            scope.currentModule = {
                'id': 'Mod1'
            };
            spyOn(dataRepository, "getDataValues").and.returnValue(getDataValuesPromise);

            scope.$apply();

            expect(dataRepository.getDataValues).toHaveBeenCalledWith('2014W14', 'Mod1');
            expect(scope.dataValues).toEqual({});
        });

        it("should display data for the given period", function() {
            scope.year = 2014;
            scope.week = {
                "weekNumber": 14
            };
            scope.currentModule = {
                id: 'mod2',
                parent: {
                    id: 'parent'
                }
            };
            spyOn(dataRepository, "getDataValues").and.returnValue(utils.getPromise(q, {
                "dataValues": [{
                    "dataElement": "DE_Oedema",
                    "categoryOptionCombo": "32",
                    "value": "3"
                }, {
                    "dataElement": "DE_Oedema",
                    "categoryOptionCombo": "33",
                    "value": "12"
                }],
                "blah": "some"
            }));

            scope.$apply();

            expect(dataRepository.getDataValues).toHaveBeenCalledWith("2014W14", "mod2");
            expect(scope.dataValues).toEqual({
                DE_Oedema: {
                    32: {
                        formula: '3',
                        value: '3'
                    },
                    33: {
                        formula: '12',
                        value: '12'
                    }
                }
            });
        });

        it('should set dataset sections if module is selected', function() {
            spyOn(scope.dataentryForm, '$setPristine');
            spyOn(dataRepository, "getDataValues").and.returnValue(getDataValuesPromise);

            scope.week = {
                "weekNumber": 14
            };
            scope.currentModule = {
                'id': 'mod1',
                parent: {
                    id: 'parent'
                }
            };

            scope.$apply();

            expect(_.keys(scope.currentGroupedSections)).toEqual(['DS_OPD']);
            expect(scope.dataentryForm.$setPristine).toHaveBeenCalled();
        });

        it('should prevent navigation if data entry form is dirty', function() {
            scope.dataentryForm = {};
            scope.dataentryForm.$dirty = false;
            scope.dataentryForm.$dirty = true;
            spyOn(location, "url");
            scope.$apply();

            expect(scope.preventNavigation).toEqual(true);
            expect(location.url).toHaveBeenCalled();

        });

        it('should not prevent navigation if data entry form is not dirty', function() {
            scope.dataentryForm = {};
            scope.dataentryForm.$dirty = true;
            scope.dataentryForm.$dirty = false;
            scope.$apply();

            expect(scope.preventNavigation).toEqual(false);

        });

        it("should return true if current week is selected", function() {
            var selectedWeek = {
                'weekNumber': 2,
                'startOfWeek': moment().startOf("isoWeek").format("YYYY-MM-DD"),
                'endOfWeek': moment().endOf("isoWeek").format("YYYY-MM-DD")
            };

            expect(scope.isCurrentWeekSelected(selectedWeek)).toEqual(true);
            scope.$apply();
        });

        it("should return false if current week is not selected", function() {
            var selectedWeek = {
                'weekNumber': 21,
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

        it("should print", function() {
            spyOn(window, "print");
            scope.printWindow();

            expect(window.print).toHaveBeenCalled();
        });


        it("should approve", function() {
            spyOn(dataRepository, "save").and.returnValue(saveSuccessPromise);
            spyOn(dataRepository, "getDataValues").and.returnValue(getDataValuesPromise);
            spyOn(approvalService, "approve").and.returnValue(utils.getPromise(q, {}));
            spyOn(hustle, "publish").and.returnValue(saveSuccessPromise);

            scope.currentModule = {
                id: 'mod2',
                parent: {
                    id: 'parent'
                }
            };
            scope.year = 2014;
            scope.week = {
                "weekNumber": 14
            };
            scope.dataentryForm.$dirty = true;
            scope.$apply();

            scope.approveData();

            scope.$apply();
            var expectedApprovalRequest = [{
                "dataSet": "Vacc",
                "period": "2014W14",
                "orgUnit": "mod2"
            }];

            expect(approvalService.approve).toHaveBeenCalledWith(expectedApprovalRequest);
            expect(scope.approveSuccess).toBe(true);
            expect(scope.approveError).toBe(false);
        });

        it("should show appropriate message on approval failure", function() {
            spyOn(dataRepository, "getDataValues").and.returnValue(getDataValuesPromise);
            spyOn(dataRepository, "save").and.returnValue(saveSuccessPromise);
            spyOn(hustle, "publish");

            spyOn(approvalService, "approve").and.returnValue(utils.getRejectedPromise(q, {}));

            scope.currentModule = {
                id: 'mod2',
                parent: {
                    id: 'parent'
                }
            };
            scope.year = 2014;
            scope.week = {
                "weekNumber": 14
            };
            scope.dataentryForm.$dirty = true;
            scope.$apply();

            scope.approveData();

            scope.$apply();

            expect(scope.approveSuccess).toBe(false);
            expect(scope.approveError).toBe(true);
        });

        it("should be read-only if data is already approved", function() {
            scope.currentModule = {
                id: 'mod2',
                parent: {
                    id: 'parent'
                }
            };
            scope.year = 2014;
            scope.week = {
                "weekNumber": 14
            };
            spyOn(dataRepository, "getDataValues").and.returnValue(getDataValuesPromise);
            approvalStoreSpy.and.returnValue(utils.getPromise(q, [{
                "isApproved": true
            }]));

            scope.$apply();

            expect(scope.isReadOnly).toBe(true);
        });

        it("should not be read-only if data is not approved", function() {
            spyOn(dataRepository, "getDataValues").and.returnValue(getDataValuesPromise);

            scope.currentModule = {
                id: 'mod2',
                parent: {
                    id: 'parent'
                }
            };
            scope.year = 2014;
            scope.week = {
                "weekNumber": 14
            };

            scope.$apply();

            expect(scope.isReadOnly).toBe(false);
        });

        it("should show not-ready-for-approval message if no data has been saved or submitted", function() {
            spyOn(dataRepository, "getDataValues").and.returnValue(getDataValuesPromise);

            scope.currentModule = {
                id: 'mod2',
                parent: {
                    id: 'parent'
                }
            };
            scope.year = 2014;
            scope.week = {
                "weekNumber": 14
            };

            scope.$apply();

            expect(scope.isSubmitted).toBe(false);
        });


        it("should show not-ready-for-approval message if data has been saved as draft", function() {
            spyOn(dataRepository, "getDataValues").and.returnValue(utils.getPromise(q, {
                "period": "2014W14",
                "orgUnit": "mod2",
                "isDraft": true,
                "dataValues": [{
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
                }]
            }));

            scope.currentModule = {
                id: 'mod2',
                parent: {
                    id: 'parent'
                }
            };
            scope.year = 2014;
            scope.week = {
                "weekNumber": 14
            };

            scope.$apply();

            expect(scope.isSubmitted).toBe(false);
        });

        it("should show ready-for-approval message if data has already been submitted for approval", function() {
            spyOn(dataRepository, "getDataValues").and.returnValue(utils.getPromise(q, {
                "period": "2014W14",
                "orgUnit": "mod2",
                "dataValues": [{
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
                }]
            }));

            scope.currentModule = {
                id: 'mod2',
                parent: {
                    id: 'parent'
                }
            };
            scope.year = 2014;
            scope.week = {
                "weekNumber": 14
            };

            scope.$apply();

            expect(scope.isSubmitted).toBe(true);
        });

    });
});