/*global Date:true*/
define(["dataEntryController", "testData", "angularMocks", "lodash", "utils", "orgUnitMapper", "moment"], function(DataEntryController, testData, mocks, _, utils, orgUnitMapper, moment) {
    describe("dataEntryController ", function() {
        var scope, db, q, dataService, location, anchorScroll, dataEntryController, rootScope, dataValuesStore, orgUnitStore, saveSuccessPromise, saveErrorPromise, modules, dataEntryFormMock;

        beforeEach(mocks.inject(function($rootScope, $q, $anchorScroll, $location) {
            q = $q;
            db = {
                objectStore: function() {}
            };
            modal = {
                'open': function() {
                    return {
                        result: utils.getPromise(q, {})
                    };
                }
            };
            location = $location;
            anchorScroll = $anchorScroll;
            rootScope = $rootScope;
            scope = $rootScope.$new();
            dataEntryFormMock = {
                $setPristine: function() {}
            };
            scope.dataentryForm = dataEntryFormMock;
            var getMockStore = function(data) {
                var getAll = function() {
                    return utils.getPromise(q, data);
                };
                var upsert = function() {};
                var find = function() {};
                return {
                    getAll: getAll,
                    upsert: upsert,
                    find: find
                };
            };

            dataValuesStore = getMockStore("dataValues");
            orgUnitStore = getMockStore("organisationUnits");

            dataService = {
                save: function() {}
            };

            saveSuccessPromise = utils.getPromise(q, {
                "ok": "ok"
            });

            saveErrorPromise = utils.getRejectedPromise(q, {
                "ok": "ok"
            });

            spyOn(db, 'objectStore').and.callFake(function(storeName) {
                if (storeName === "dataValues")
                    return dataValuesStore;
                if (storeName === "organisationUnits")
                    return orgUnitStore;
                return getMockStore(testData[storeName]);
            });

            modules = [{
                'name': 'somename',
                'displayName': 'somename',
                'id': 'id1'
            }];

            spyOn(orgUnitStore, 'getAll').and.returnValue(utils.getPromise(q, modules));
            spyOn(location, "hash");
            dataEntryController = new DataEntryController(scope, q, db, dataService, anchorScroll, location, modal);
        }));

        it("should initialize modules", function() {
            spyOn(orgUnitMapper, 'filterModules').and.returnValue(modules);

            scope.$apply();

            expect(location.hash).toHaveBeenCalledWith('top');
            expect(scope.modules).toEqual(modules);
            expect(db.objectStore).toHaveBeenCalledWith("organisationUnits");
            expect(orgUnitStore.getAll).toHaveBeenCalled();
            expect(orgUnitMapper.filterModules).toHaveBeenCalledWith(modules);
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
            var dataValues = {
                "name": "test"
            };
            scope.currentModule = {
                id: 'Module2',
                parent: {
                    id: 'parent'
                }
            };
            scope.year = 2014;
            scope.week = {
                "weekNumber": 14
            };
            spyOn(scope.dataentryForm, '$setPristine');
            spyOn(dataValuesStore, "find").and.returnValue(saveSuccessPromise);
            var dataEntryController = new DataEntryController(scope, q, db, dataService, anchorScroll, location);
            scope.$apply();

            spyOn(dataService, "save").and.returnValue(saveSuccessPromise);
            spyOn(dataValuesStore, "upsert").and.returnValue(saveSuccessPromise);

            scope.submit();
            scope.$apply();

            expect(dataValuesStore.upsert).toHaveBeenCalled();
            expect(dataService.save).toHaveBeenCalled();
            expect(scope.submitSuccess).toBe(true);
            expect(scope.saveSuccess).toBe(false);
            expect(scope.submitError).toBe(false);
            expect(scope.saveError).toBe(false);
            expect(scope.dataentryForm.$setPristine).toHaveBeenCalled();
        });

        it("should save data values as draft to indexeddb", function() {
            var dataValues = {
                "name": "test"
            };
            scope.currentModule = {
                id: 'Module2',
                parent: {
                    id: 'parent'
                }
            };
            scope.year = 2014;
            scope.week = {
                "weekNumber": 14
            };
            spyOn(scope.dataentryForm, '$setPristine');
            spyOn(dataValuesStore, "find").and.returnValue(saveSuccessPromise);
            var dataEntryController = new DataEntryController(scope, q, db, dataService, anchorScroll, location);
            scope.$apply();

            spyOn(dataService, "save");
            spyOn(dataValuesStore, "upsert").and.returnValue(saveSuccessPromise);

            scope.saveAsDraft();
            scope.$apply();

            expect(dataValuesStore.upsert).toHaveBeenCalled();
            expect(dataService.save).not.toHaveBeenCalled();
            expect(scope.submitSuccess).toBe(false);
            expect(scope.saveSuccess).toBe(true);
            expect(scope.submitError).toBe(false);
            expect(scope.saveError).toBe(false);
            expect(scope.dataentryForm.$setPristine).toHaveBeenCalled();
        });

        it("should let the user know of failures when submitting the data to dhis", function() {
            scope = rootScope.$new();
            scope.dataentryForm = dataEntryFormMock;
            var dataValues = {
                "name": "test"
            };
            scope.currentModule = {
                id: 'Module2',
                parent: {
                    id: 'parent'
                }
            };
            scope.year = 2014;
            scope.week = {
                "weekNumber": 14
            };
            spyOn(scope.dataentryForm, '$setPristine');
            spyOn(dataValuesStore, "find").and.returnValue(saveSuccessPromise);
            var dataEntryController = new DataEntryController(scope, q, db, dataService, anchorScroll, location);
            scope.$apply();
            spyOn(dataService, "save").and.returnValue(saveErrorPromise);
            spyOn(dataValuesStore, "upsert").and.returnValue(saveSuccessPromise);

            scope.submit();
            scope.$apply();

            expect(dataService.save).toHaveBeenCalled();
            expect(dataValuesStore.upsert).toHaveBeenCalled();
            expect(scope.submitSuccess).toBe(false);
            expect(scope.saveSuccess).toBe(false);
            expect(scope.submitError).toBe(true);
            expect(scope.saveError).toBe(false);
        });

        it("should let the user know of failures when saving the data to indexedDB ", function() {
            scope = rootScope.$new();
            scope.dataentryForm = dataEntryFormMock;
            var dataValues = {
                "name": "test"
            };
            scope.currentModule = {
                id: 'Module2',
                parent: {
                    id: 'parent'
                }
            };
            scope.year = 2014;
            scope.week = {
                "weekNumber": 14
            };

            spyOn(dataValuesStore, "find").and.returnValue(saveSuccessPromise);
            var dataEntryController = new DataEntryController(scope, q, db, dataService, anchorScroll, location);
            scope.$apply();
            spyOn(dataService, "save");
            spyOn(dataValuesStore, "upsert").and.returnValue(saveErrorPromise);

            scope.saveAsDraft();
            scope.$apply();

            expect(dataService.save).not.toHaveBeenCalled();
            expect(dataValuesStore.upsert).toHaveBeenCalled();
            expect(scope.submitSuccess).toBe(false);
            expect(scope.saveSuccess).toBe(false);
            expect(scope.submitError).toBe(false);
            expect(scope.saveError).toBe(true);
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
            scope.week = undefined;
            spyOn(dataValuesStore, 'find');

            scope.$apply();

            expect(dataValuesStore.find).not.toHaveBeenCalled();
        });

        it("should fetch empty data if no data exists for the given period", function() {
            scope.year = 2014;
            scope.week = {
                "weekNumber": 14
            };
            scope.currentModule = {
                'id': 'Mod1'
            };
            spyOn(dataValuesStore, 'find').and.returnValue(utils.getPromise(q, undefined));

            scope.$apply();

            expect(dataValuesStore.find).toHaveBeenCalledWith(['2014W14', 'Mod1']);
            expect(scope.dataValues).toEqual({});
        });

        it("should display data for the given period", function() {
            scope.year = 2014;
            scope.week = {
                "weekNumber": 14
            };
            scope.currentModule = {
                id: 'Module2',
                parent: {
                    id: 'parent'
                }
            };
            spyOn(dataValuesStore, 'find').and.returnValue(utils.getPromise(q, {
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

            expect(dataValuesStore.find).toHaveBeenCalledWith(["2014W14", "Module2"]);
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
            scope.week = {
                "weekNumber": 14
            };
            scope.currentModule = {
                'id': 'Module1',
                parent: {
                    id: 'parent'
                }
            };
            spyOn(scope.dataentryForm, '$setPristine');
            spyOn(dataValuesStore, 'find').and.returnValue(utils.getPromise(q, {}));

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
    });
});