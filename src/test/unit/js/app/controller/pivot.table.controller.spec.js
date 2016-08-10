define(["angularMocks", "utils", "lodash", "moment", "pivotTableController", "timecop", "translationsService", "filesystemService"], function (mocks, utils, lodash, moment, PivotTableController, timecop, TranslationsService, FilesystemService) {
    describe("pivotTableController", function () {

        var scope, rootScope, q, pivotTableController, translationsService, filesystemService;

        beforeEach(mocks.inject(function ($rootScope, $q) {
            rootScope = $rootScope;
            scope = $rootScope.$new();
            q = $q;

            Timecop.install();
            Timecop.freeze(new Date("2015-10-29T12:43:54.972Z"));

            scope.locale = "en";

            rootScope.resourceBundle = {
                weeksLabel: "weeks",
                July: "July",
                August: "August",
                September: "September"
            };

            translationsService = new TranslationsService();
            spyOn(translationsService, "translate").and.returnValue({});

            filesystemService = new FilesystemService();
            spyOn(filesystemService, 'promptAndWriteFile').and.returnValue(utils.getPromise(q, {}));

            pivotTableController = new PivotTableController(scope, rootScope, translationsService, filesystemService);
            scope.$apply();
        }));

        afterEach(function() {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        describe('sortByColumn', function () {
            var rowA, rowB, columnA, columnB;

            beforeEach(function () {
                rowA = { rowNumber: 1, id: 'rowIdA', dataValuesFilter: { dx: 'rowIdA' }};
                rowB = { rowNumber: 2, id: 'rowIdB', dataValuesFilter: { dx: 'rowIdB' }};
                columnA = { id: 'columnIdA', dataValuesFilter: { pe: 'columnIdA' }};
                columnB = { id: 'columnIdB', dataValuesFilter: { pe: 'columnIdB' }};

                scope.table = {
                    dataValues: [
                        { dx: rowA.id, pe: columnA.id, value: 1 }, { dx: rowA.id, pe: columnB.id, value: 4 },
                        { dx: rowB.id, pe: columnA.id, value: 2 }, { dx: rowB.id, pe: columnB.id, value: 3 }
                    ],
                    columns: [[columnA, columnB]],
                    rows: [rowA, rowB]
                };
            });

            it('should sort the rows of the table in ascending order', function () {
                scope.table.sortAscending = true;

                scope.sortByColumn(columnB);
                expect(scope.table.rows).toEqual([rowB, rowA]);
            });

            it('should sort the rows of the table in descending order', function () {
                scope.table.sortDescending = true;

                scope.sortByColumn(columnA);
                expect(scope.table.rows).toEqual([rowB, rowA]);
            });

            it('should set the sorted property of the column', function () {
                scope.sortByColumn(columnA);
                expect(columnA.sorted).toEqual(true);
            });

            it('should reset the sorted property of the other columns', function () {
                columnB.sorted = true;

                scope.sortByColumn(columnA);
                expect(columnB.sorted).toEqual(false);
            });

            it('should restore the default sort order if column was already sorted', function () {
                scope.sortByColumn(columnA);
                scope.sortByColumn(columnA);
                expect(scope.table.rows).toEqual([rowA, rowB]);
                expect(columnA.sorted).toEqual(false);
            });

            it('should exclude data values with matching excluded category options', function () {
                scope.table = {
                    sortDescending: true,
                    dataValues: [
                        { dx: rowA.id, pe: columnA.id, value: 1 }, { dx: rowA.id, pe: columnB.id, value: 4, excludedFromTotals: true },
                        { dx: rowB.id, pe: columnA.id, value: 2 }, { dx: rowB.id, pe: columnB.id, value: 3 }
                    ],
                    columns: [[columnA, columnB]],
                    rows: [rowA, rowB]
                };
                scope.sortByColumn(columnB);
                expect(scope.table.rows).toEqual([rowB, rowA]);
            });
        });

        xdescribe("Export as csv", function () {
            it('should prompt the user to download tabular data to CSV with suggested filename', function () {
                scope.exportToCSV();
                expect(filesystemService.promptAndWriteFile).toHaveBeenCalledWith('NewConsultations.Consultations.29-Oct-2015.csv', jasmine.any(Blob), filesystemService.FILE_TYPE_OPTIONS.CSV);
            });

            describe('CSV Contents', function () {
                var csvContent;
                beforeEach(function () {
                    spyOn(window, 'Blob').and.callFake(function (contentArray) {
                        this.value = contentArray.join();
                    });

                    filesystemService.promptAndWriteFile.and.callFake(function (fileName, blob) {
                        csvContent = blob.value;
                    });

                    scope.resourceBundle = {
                        weeksLabel: "weeks",
                        July: "July",
                        August: "August",
                        October: "October",
                        September: "September",
                        dataElement: "Data Element",
                        category: "Category"
                    };

                    scope.exportToCSV();
                });

                it("should get headers if category is present", function () {
                    var expected = '"Data Element","Category","July 2015 (4 weeks)","August 2015 (5 weeks)"';
                    expect(csvContent).toContain(expected);
                });

                it("should get headers if category not present", function () {
                    scope.isCategoryPresent = false;
                    scope.exportToCSV();
                    scope.$apply();
                    var expected = '"Data Element","July 2015 (4 weeks)","August 2015 (5 weeks)"';

                    expect(csvContent).toContain(expected);
                });

                it("should get data for csv file when categories are present", function () {
                    var expectedDataValues =
                        '"New Consultations","1-23 months",1387,215\n' +
                        '"New Consultations","24-59 months",264,201\n' +
                        '"Follow-up Consultations","1-23 months",1772,\n' +
                        '"Follow-up Consultations","24-59 months",6433,';

                    expect(csvContent).toContain(expectedDataValues);
                });

                it("should get data for csv file when categories are not present", function () {
                    scope.data = {
                        "headers": [{
                            "name": "dx"
                        }, {
                            "name": "pe"
                        }, {
                            "name": "value"
                        }],
                        "metaData": {
                            "pe": ["201508", "201509"],
                            "names": {
                                "dx": "Data",
                                "a2cf79e8f13": "MSF",
                                "201508": "August 2015",
                                "201509": "September 2015",
                                "a0e7d3973e3": "New Consultations - Consultations - Out Patient Department - Pediatric",
                                "pe": "Period"
                            }
                        },
                        "rows": [
                            ["a0e7d3973e3", "201508", "215.0"],
                            ["a0e7d3973e3", "201509", "45.0"]
                        ],
                        "width": 3
                    };

                    scope.definition = {
                        "name": "[FieldApp - NewConsultations] Consultations",
                        "dataElements": [{
                            "id": "a0e7d3973e3",
                            "name": "New Consultations - Consultations - Out Patient Department - Pediatric"
                        }],
                        rows: [{
                            items: [
                                {
                                    id: 'a0e7d3973e3',
                                    name: 'New Consultations - Consultations - Out Patient Department - Pediatric'
                                }
                            ]
                        }]
                    };
                    pivotTableController = new PivotTableController(scope, rootScope, translationsService, filesystemService);
                    scope.exportToCSV();
                    scope.$apply();
                    var expectedDataValues = '"New Consultations",215,45';

                    expect(csvContent).toContain(expectedDataValues);
                });
            });
        });

        it("should get data element name", function() {
            var dataElementName = "FieldApp - test";
            var actualdataelementName = scope.getDataElementName(dataElementName);

            expect("FieldApp").toEqual(actualdataelementName);
        });

        it("should not display the download button if download is disabled", function() {
            scope.disableDownload = 'true';
            pivotTableController = new PivotTableController(scope, rootScope, translationsService);
            scope.$apply();

            expect(scope.showDownloadButton).toEqual(false);
        });

        it("should display the download button if download is not disabled", function() {
            scope.disableDownload = undefined;
            pivotTableController = new PivotTableController(scope, rootScope, translationsService);
            scope.$apply();

            expect(scope.showDownloadButton).toEqual(true);
        });
    });
});
