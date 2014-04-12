define(["dataEntryController", "testData", "angularMocks", "lodash", "utils"], function(DataEntryController, testData, mocks, _, utils) {
    describe("dataEntryController ", function() {
        var scope, db, mockStore, q, dataService;

        beforeEach(mocks.inject(function($rootScope, $q) {
            q = $q;
            db = {
                objectStore: function() {}
            };
            scope = $rootScope.$new();

            mockStore = function(data) {
                var getAll = function() {
                    return utils.getPromise(q, data);
                };

                return {
                    getAll: getAll
                };
            };

            dataService = {
                save: function() {
                    return "foo";
                }
            };

            spyOn(db, 'objectStore').and.callFake(function(storeName) {
                return mockStore(testData[storeName]);
            });
        }));

        it("should return the sum of the list ", function() {
            var dataEntryController = new DataEntryController(scope, q, db);
            var list = ["1", "2", "3", "4"];
            expect(scope.sum(list)).toBe(10);
        });

        it("should return the sum of valid values ", function() {
            var dataEntryController = new DataEntryController(scope, q, db);
            var list = ["1", "2", undefined, "4"];

            expect(scope.sum(list)).toBe(7);
        });

        it("should return the sum of valid expressions ", function() {
            var dataEntryController = new DataEntryController(scope, q, db);
            var list = ["1+3", "2", "3", "4"];

            expect(scope.sum(list)).toBe(13);
        });

        it("should return the sum of the map ", function() {
            var dataEntryController = new DataEntryController(scope, q, db);
            var list = {
                a: "1",
                b: "2",
                c: "3",
                d: "4"
            };
            expect(scope.sum(list)).toBe(10);
        });

        it("should group sections based on datasets", function() {
            var dataEntryController = new DataEntryController(scope, q, db);
            scope.$apply();

            var dataSetKeys = _.keys(scope.groupedSections);
            expect(dataSetKeys.length).toBe(2);
            expect(dataSetKeys).toContain("DS_OPD");
            expect(dataSetKeys).toContain("Vacc");

            expect(scope.groupedSections.DS_OPD.length).toBe(2);
            expect(scope.groupedSections.Vacc.length).toBe(1);
        });

        it("should group set headers on sections", function() {
            var dataEntryController = new DataEntryController(scope, q, db);
            scope.$apply();

            var section1 = scope.groupedSections.DS_OPD[0];
            expect(section1.headers).toEqual([
                ["Resident", "Migrant"],
                ["LessThan5", "GreaterThan5", "LessThan5", "GreaterThan5", ]
            ]);

            expect(section1.categoryOptionComboIds).toEqual([1, 2, 3, 4]);
            var section2 = scope.groupedSections.Vacc[0];
            expect(section2.headers).toEqual([
                ["LessThan5", "GreaterThan5"]
            ]);
            expect(section2.categoryOptionComboIds).toEqual([1, 2]);
        });

        it("should get dataelements associated with sections", function() {
            var dataEntryController = new DataEntryController(scope, q, db);
            scope.$apply();

            var opdSections = scope.groupedSections.DS_OPD;

            var dataElements = opdSections[0].dataElements;
            expect(dataElements.length).toBe(2);
            expect(dataElements[0].id).toContain("DE1");
            expect(dataElements[1].id).toContain("DE2");

            dataElements = opdSections[1].dataElements;
            expect(dataElements.length).toBe(1);
            expect(dataElements[0].id).toContain("DE1");
        });

        it("should enrich dataelements with categories", function() {
            var dataEntryController = new DataEntryController(scope, q, db);
            scope.$apply();

            var opdSections = scope.groupedSections.DS_OPD;
            var dataElements = opdSections[0].dataElements;
            var categories = dataElements[0].categories;

            expect(categories.length).toBe(2);
        });


        it("should return the data set name given the id", function() {
            var dataEntryController = new DataEntryController(scope, q, db);
            scope.$apply();
            var datasetId = "DS_OPD";
            expect(scope.getDataSetName(datasetId)).toEqual("OPD");
        });

        it("should initialize data values", function() {
            var dataEntryController = new DataEntryController(scope, q, db);
            scope.$apply();
            expect(_.keys(scope.dataValues).length).toBe(testData.dataElements.length);
        });

        it("should call the dataservice save method when save is clicked and should success on successfull post", function() {
            var dataValues = {
                "name": "test"
            };
            scope.year = 2014;
            scope.week = {
                "weekNumber": 14
            };
            var dataEntryController = new DataEntryController(scope, q, db, dataService);
            var saveSuccessPromise = utils.getPromise(q, {
                "ok": "ok"
            });
            spyOn(dataService, "save").and.returnValue(saveSuccessPromise);


            scope.save();
            scope.$apply();

            expect(dataService.save).toHaveBeenCalled();
            expect(scope.success).toBe(true);
        });


        it("should call the dataservice save method when save is clicked and should error on post failure", function() {
            var dataValues = {
                "name": "test"
            };
            scope.year = 2014;
            scope.week = {
                "weekNumber": 14
            };
            var dataEntryController = new DataEntryController(scope, q, db, dataService);
            var saveErrorPromise = utils.getRejectedPromise(q, {
                "ok": "ok"
            });
            spyOn(dataService, "save").and.returnValue(saveErrorPromise);


            scope.save();
            scope.$apply();

            expect(dataService.save).toHaveBeenCalled();
            expect(scope.success).toBe(false);
        });
    });
});