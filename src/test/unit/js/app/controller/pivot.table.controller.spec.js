define(["angularMocks", "dateUtils", "utils", "lodash", "moment", "pivotTableController", "timecop", "translationsService", "filesystemService"], function (mocks, dateUtils, utils, lodash, moment, PivotTableController, timecop, TranslationsService, FilesystemService) {
    describe("pivotTableController", function () {

        var scope, rootScope, q, pivotTableController, translationsService, filesystemService,
            currentTime;

        beforeEach(mocks.inject(function ($rootScope, $q) {
            rootScope = $rootScope;
            scope = $rootScope.$new();
            q = $q;

            currentTime = moment('2015-10-29T12:43:54.972Z');
            Timecop.install();
            Timecop.freeze(currentTime);

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
                    getTotalOfDataValues: function (row, column) {
                        var mockDataValues = {
                            rowIdA: { columnIdA: 1, columnIdB: 4 },
                            rowIdB: { columnIdA: 2, columnIdB: 3 }
                        };
                        return mockDataValues[row.id][column.id];
                    },
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
        });

        describe("Export as csv", function () {
            it('should prompt the user to download tabular data to CSV with suggested filename', function () {
                scope.table = {
                    dataSetCode: 'someDataSetCode',
                    title: 'A table named T. Able'
                };

                scope.exportToCSV();
                expect(filesystemService.promptAndWriteFile).toHaveBeenCalledWith([scope.table.dataSetCode, scope.table.title, currentTime.format('DD-MMM-YYYY'), 'csv'].join('.'), jasmine.any(Blob), filesystemService.FILE_TYPE_OPTIONS.CSV);
            });

            describe('CSV Contents', function () {
                var csvContent, outerColumnA, innerColumnA1, innerColumnA2, rowA, rowB, mockValue,
                    DELIMETER = ',',
                    EMPTY_CELL = '';

                var escapeString = function (string) {
                    return '"' + string + '"';
                };

                beforeEach(function () {
                    spyOn(window, 'Blob').and.callFake(function (contentArray) {
                        this.value = contentArray.join();
                    });

                    filesystemService.promptAndWriteFile.and.callFake(function (fileName, blob) {
                        csvContent = blob.value;
                    });

                    outerColumnA = {
                        name: 'periodA',
                        dataValuesFilter: {
                            pe: 'periodA'
                        }
                    };
                    innerColumnA1 = {
                        name: 'male',
                        dataValuesFilter: {
                            genderCategory: 'male'
                        }
                    };
                    innerColumnA2 = {
                        name: 'female',
                        dataValuesFilter: {
                            genderCategory: 'female'
                        }
                    };
                    rowA = {
                        name: 'dataElementA',
                        dataValuesFilter: {
                            dx: 'dataElementIdA'
                        }
                    };
                    rowB = {
                        name: 'dataElementB',
                        dataValuesFilter: {
                            dx: 'dataElementIdB'
                        }
                    };
                    mockValue = 'mockValue';
                    scope.table = {
                        columns: [
                            [outerColumnA],
                            [innerColumnA1, innerColumnA2]
                        ],
                        rows: [rowA, rowB],
                        getDisplayName: function (item) {
                            return item.name;
                        },
                        getDataValue: function () {
                            return mockValue;
                        }
                    };
                    scope.baseColumnConfiguration = _.last(scope.table.columns);
                });

                it('should contain the outer column headers', function () {
                    scope.exportToCSV();

                    var expectedHeader = [EMPTY_CELL, escapeString(outerColumnA.name), escapeString(outerColumnA.name)].join(DELIMETER);
                    expect(csvContent).toContain(expectedHeader);
                });

                it('should contain the inner column headers', function () {
                    scope.exportToCSV();

                    var expectedHeader = [EMPTY_CELL, escapeString(innerColumnA1.name), escapeString(innerColumnA2.name)].join(DELIMETER);
                    expect(csvContent).toContain(expectedHeader);
                });

                it('should append the number of isoweeks to the column headers if column is a periodDimension and pivotTable is a monthlyReport', function () {
                    spyOn(dateUtils, 'getNumberOfISOWeeksInMonth').and.returnValue(4);
                    outerColumnA.periodDimension = true;
                    scope.table.monthlyReport = true;
                    scope.exportToCSV();

                    expect(csvContent).toContain(escapeString(outerColumnA.name + ' [4 '+ scope.resourceBundle.weeksLabel + ']'));
                });

                it('should contain dataValues for rows', function () {
                    scope.exportToCSV();

                    var expectedRowA = [escapeString(rowA.name), mockValue, mockValue].join(DELIMETER);
                    var expectedRowB = [escapeString(rowB.name), mockValue, mockValue].join(DELIMETER);

                    expect(csvContent).toContain(expectedRowA);
                    expect(csvContent).toContain(expectedRowB);
                });
            });
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
