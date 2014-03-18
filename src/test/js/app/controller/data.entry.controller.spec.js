define(["dataEntryController", "testData", "angularMocks", "lodash"], function(DataEntryController, testData, mocks, _) {
    describe("dataEntryController ", function() {
        var scope, db, mockStore, q;

        var getPromise = function(response) {
            response = response || '';
            var deferred = q.defer();
            deferred.resolve(response);
            return deferred.promise;
        };

        beforeEach(mocks.inject(function($rootScope, $q) {
            q = $q;
            db = {
                objectStore: function() {}
            };
            mockStore = function(data) {
                var getAll = function() {
                    return getPromise(data);
                };

                return {
                    getAll: getAll
                };
            };

            spyOn(db, 'objectStore').and.callFake(function(storeName) {
                return mockStore(testData[storeName]);
            });
            scope = $rootScope.$new();
        }));

        it("should return the sum of the list ", function() {
            var dataEntryController = new DataEntryController(scope, q, db);
            var list = [1, 2, 3, 4];

            expect(scope.sum(list)).toBe(10);
        });

        it("should return the sum of the map ", function() {
            var dataEntryController = new DataEntryController(scope, q, db);
            var list = {
                a: 1,
                b: 2,
                c: 3,
                d: 4
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

            expect(scope.groupedSections["DS_OPD"].length).toBe(2);
            expect(scope.groupedSections["Vacc"].length).toBe(1);
        });

        it("should get dataelements associated with sections", function() {
            var dataEntryController = new DataEntryController(scope, q, db);
            scope.$apply();

            var opdSections = scope.groupedSections["DS_OPD"];

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

            var opdSections = scope.groupedSections["DS_OPD"];
            var dataElements = opdSections[0].dataElements;
            var categories = dataElements[0].categories;

            expect(categories.length).toBe(2);
        });

        it("should enrich dataelements with all category combinations", function() {
            var dataEntryController = new DataEntryController(scope, q, db);
            scope.$apply();

            var opdSections = scope.groupedSections["DS_OPD"];
            var dataElements = opdSections[0].dataElements;
            var categories = dataElements[0].categories;
            var category1Options = categories[0];
            var category2Options = categories[1];
            var allCatOptions = testData.categoryOptions;

            expect(category1Options.length).toBe(4);
            expect(category1Options.length).toBe(4);

            expect(category1Options).toEqual([allCatOptions[0], allCatOptions[1], allCatOptions[0], allCatOptions[1]]);
            expect(category2Options).toEqual([allCatOptions[2], allCatOptions[2], allCatOptions[3], allCatOptions[3]]);
        });

        it("should return the data set name given the id", function() {
            var dataEntryController = new DataEntryController(scope, q, db);
            scope.$apply();

            var datasetId = "DS_OPD";

            expect(scope.getDataSetName(datasetId)).toEqual("OPD");
        });

        it("should initialize section values", function() {
            var dataEntryController = new DataEntryController(scope, q, db);
            scope.$apply();

            expect(_.keys(scope.sectionValues).length).toBe(testData.sections.length);
            _.each(testData.sections, function(testDataSection) {
                expect(_.keys(scope.sectionValues[testDataSection.id]).length).toBe(testDataSection.dataElements.length);
            });
        });
    });
});