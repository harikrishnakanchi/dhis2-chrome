define(["angularMocks", "dateUtils", "utils", "lodash", "moment", "pivotTableController", "timecop", "translationsService", "filesystemService", "pivotTableCsvBuilder"], function (mocks, dateUtils, utils, lodash, moment, PivotTableController, timecop, TranslationsService, FilesystemService, PivotTableCsvBuilder) {
    describe("pivotTableController", function () {
        var scope, rootScope, q, pivotTableController, translationsService, filesystemService, pivotTableCsvBuilder,
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
                weeksLabel: "weeks"
            };

            translationsService = new TranslationsService();
            spyOn(translationsService, "translate").and.returnValue({});

            filesystemService = new FilesystemService();
            spyOn(filesystemService, 'promptAndWriteFile').and.returnValue(utils.getPromise(q, {}));

            pivotTableCsvBuilder = new PivotTableCsvBuilder();
            spyOn(pivotTableCsvBuilder, 'build');

            pivotTableController = new PivotTableController(scope, rootScope, translationsService, filesystemService, pivotTableCsvBuilder);
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
                    columnConfigurations: [[columnA, columnB]],
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
            var csvContent, mockPivotTableCsv;

            beforeEach(function () {
                spyOn(window, 'Blob').and.callFake(function (contentArray) {
                    this.value = contentArray.join();
                });

                filesystemService.promptAndWriteFile.and.callFake(function (fileName, blob) {
                    csvContent = blob.value;
                });

                mockPivotTableCsv = 'mockCSVData';
                pivotTableCsvBuilder.build.and.returnValue(mockPivotTableCsv);

                scope.table = {
                    title: 'A table named T. Able',
                    dataSetCode: 'someDataSetCode'
                };
            });

            it('should prompt the user to download tabular data to CSV with lastUpdated date in the filename', function () {
                var REPORTS_LAST_UPDATED_TIME_FORMAT = "D MMMM[,] YYYY HH[:]mm";
                scope.updatedTime = moment('2015-10-29').format(REPORTS_LAST_UPDATED_TIME_FORMAT);

                scope.exportToCSV();
                expect(filesystemService.promptAndWriteFile).toHaveBeenCalledWith([scope.table.dataSetCode, scope.table.title, '[updated 29 October 2015 12.00 AM]', 'csv'].join('.'), jasmine.any(Blob), filesystemService.FILE_TYPE_OPTIONS.CSV);
            });

            it('should contain results of csv builder', function () {
                scope.exportToCSV();
                expect(csvContent).toContain(mockPivotTableCsv);
            });

            it("should include lastUpdated time", function () {
                var REPORTS_LAST_UPDATED_TIME_FORMAT_WITHOUT_COMMA = "D MMMM YYYY hh[.]mm A";
                scope.updatedTime = moment('2015-10-29').format(REPORTS_LAST_UPDATED_TIME_FORMAT_WITHOUT_COMMA);
                var expected = '"Updated","' + scope.updatedTime + '"';

                scope.exportToCSV();
                expect(csvContent).toContain(expected);
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
