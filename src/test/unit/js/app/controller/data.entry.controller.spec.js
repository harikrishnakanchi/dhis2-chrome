define(["dataEntryController", "testData", "angularMocks", "lodash", "utils", "orgUnitMapper"], function(DataEntryController, testData, mocks, _, utils, orgUnitMapper) {
    describe("dataEntryController ", function() {
        var scope, db, q, dataService, location, anchorScroll, dataEntryController, rootScope, dataValuesStore, orgUnitStore, saveSuccessPromise, saveErrorPromise, modules;

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
            }
            location = $location;
            anchorScroll = $anchorScroll;
            rootScope = $rootScope;
            scope = $rootScope.$new();
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
            }]
            spyOn(orgUnitStore, 'getAll').and.returnValue(utils.getPromise(q, modules));
            dataEntryController = new DataEntryController(scope, q, db, dataService, anchorScroll, location, modal);
        }));

        it("should initialize modules", function() {
            spyOn(orgUnitMapper, 'filterModules').and.returnValue(modules);

            scope.$apply();

            expect(scope.modules).toEqual(modules);
            expect(db.objectStore).toHaveBeenCalledWith("organisationUnits");
            expect(orgUnitStore.getAll).toHaveBeenCalled();
            expect(orgUnitMapper.filterModules).toHaveBeenCalledWith(modules);
        });

        it("should return the sum of the list ", function() {
            var list = ["1", "2", "3", "4"];
            expect(scope.sum(list)).toBe(10);
        });

        it("should return the sum of valid values ", function() {
            var list = ["1", "2", undefined, "4"];

            expect(scope.sum(list)).toBe(7);
        });

        it("should return the sum of valid expressions ", function() {
            var list = ["1+3", "2", "3", "4"];

            expect(scope.sum(list)).toBe(13);
        });

        it("should return the sum of the map ", function() {
            var list = {
                a: "1",
                b: "2",
                c: "3",
                d: "4"
            };
            expect(scope.sum(list)).toBe(10);
        });

        it("should evaluate expression on blur", function() {
            scope.dataValues = {
                "blah": {
                    "some": "1+9"
                }
            };

            scope.evaluateExpression("blah", "some");

            expect(scope.dataValues.blah.some).toEqual(10);
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

        it("should save user to indexeddb and dhis", function() {
            var dataValues = {
                "name": "test"
            };
            scope.currentModule = {
                id: 'Module2'
            };
            scope.year = 2014;
            scope.week = {
                "weekNumber": 14
            };
            spyOn(dataValuesStore, "find").and.returnValue(saveSuccessPromise);
            var dataEntryController = new DataEntryController(scope, q, db, dataService, anchorScroll, location);
            scope.$apply();

            spyOn(dataService, "save").and.returnValue(saveSuccessPromise);
            spyOn(dataValuesStore, "upsert").and.returnValue(saveSuccessPromise);

            scope.save();
            scope.$apply();

            expect(dataValuesStore.upsert).toHaveBeenCalled();
            expect(dataService.save).toHaveBeenCalled();
            expect(scope.success).toBe(true);
            expect(scope.error).toBe(false);
        });

        it("should let the user know of failures when saving the data to dhis", function() {
            scope = rootScope.$new();
            var dataValues = {
                "name": "test"
            };
            scope.currentModule = {
                id: 'Module2'
            };
            scope.year = 2014;
            scope.week = {
                "weekNumber": 14
            };
            spyOn(dataValuesStore, "find").and.returnValue(saveSuccessPromise);
            var dataEntryController = new DataEntryController(scope, q, db, dataService, anchorScroll, location);
            scope.$apply();
            spyOn(dataService, "save").and.returnValue(saveErrorPromise);
            spyOn(dataValuesStore, "upsert").and.returnValue(saveSuccessPromise);

            scope.save();
            scope.$apply();

            expect(dataService.save).toHaveBeenCalled();
            expect(dataValuesStore.upsert).toHaveBeenCalled();
            expect(scope.error).toBe(true);
            expect(scope.success).toBe(false);
        });

        it("should let the user know of failures when saving the data to indexedDB", function() {
            scope = rootScope.$new();
            var dataValues = {
                "name": "test"
            };
            scope.currentModule = {
                id: 'Module2'
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

            scope.save();
            scope.$apply();

            expect(dataService.save).not.toHaveBeenCalled();
            expect(dataValuesStore.upsert).toHaveBeenCalled();
            expect(scope.error).toBe(true);
            expect(scope.success).toBe(false);
        });

        it("should fetch max length to calculate col span for category options", function() {
            var maxCols = scope.maxcolumns([
                [1, 2],
                [4, 5, 4, 5]
            ]);

            expect(maxCols).toEqual(4);
        });

        it("safe get dataValues should initialize if not present", function() {
            var dataValues = {};

            var result = scope.safeGet(dataValues, "blah");

            expect(dataValues).toEqual({
                "blah": {}
            });
            expect(result).toEqual({});
        });

        it("safe get dataValues should return if already present", function() {
            var dataValues = {
                "blah": "test"
            };

            var result = scope.safeGet(dataValues, "blah");

            expect(dataValues).toEqual({
                "blah": "test"
            });
            expect(result).toEqual(dataValues.blah);
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
                id: 'Module2'
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
                "DE_Oedema": {
                    "32": "3",
                    "33": "12"
                }
            });
        });

        it('should set dataset sections if module is selected', function() {
            scope.week = {
                "weekNumber": 14
            };
            scope.currentModule = {
                'id': 'Module1'
            };
            spyOn(dataValuesStore, 'find').and.returnValue(utils.getPromise(q, {}));

            scope.$apply();

            expect(_.keys(scope.currentGroupedSections)).toEqual(['DS_OPD']);
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
    });
});