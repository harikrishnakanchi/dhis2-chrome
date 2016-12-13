define(["angularMocks", "dateUtils", "utils", "lodash", "moment", "pivotTableController", "timecop", "translationsService", "filesystemService", "pivotTableExportBuilder", "excelBuilder"], function (mocks, dateUtils, utils, lodash, moment, PivotTableController, timecop, TranslationsService, FilesystemService, PivotTableExportBuilder, ExcelBuilder) {
    describe("pivotTableController", function () {
        var scope, rootScope, q, pivotTableController, translationsService, filesystemService, pivotTableExportBuilder,
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

            pivotTableExportBuilder = new PivotTableExportBuilder();
            spyOn(pivotTableExportBuilder, 'build');

            spyOn(ExcelBuilder, 'createWorkBook').and.returnValue(new Blob());

            pivotTableController = new PivotTableController(scope, rootScope, translationsService, filesystemService, pivotTableExportBuilder);
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

        describe("Export as Excel", function () {
            var spreadSheetContent, mockPivotTableExport;

            beforeEach(function () {
                ExcelBuilder.createWorkBook.and.callFake(function (workBookContent) {
                    spreadSheetContent = _.first(workBookContent);
                    return new Blob();
                });

                mockPivotTableExport = ['mockPivotTableExport'];
                pivotTableExportBuilder.build.and.returnValue([mockPivotTableExport]);

                scope.table = {
                    title: 'A table named T. Able',
                    serviceCode: 'someDataSetServiceCode'
                };
            });

            it('should prompt the user to download tabular data as Excel with lastUpdated date in the filename', function () {
                var REPORTS_LAST_UPDATED_TIME_FORMAT = "D MMMM[,] YYYY HH[:]mm";
                scope.updatedTime = moment('2015-10-29').format(REPORTS_LAST_UPDATED_TIME_FORMAT);

                scope.exportToExcel();
                expect(filesystemService.promptAndWriteFile).toHaveBeenCalledWith([scope.table.serviceCode, scope.table.title, '[updated 29 October 2015 12.00 AM]'].join('.'), jasmine.any(Blob), filesystemService.FILE_TYPE_OPTIONS.XLSX);
            });

            it('should contain results of csv builder', function () {
                scope.exportToExcel();
                expect(spreadSheetContent.data).toContain(mockPivotTableExport);
            });

            it("should include lastUpdated time", function () {
                var REPORTS_LAST_UPDATED_TIME_FORMAT_WITHOUT_COMMA = "D MMMM YYYY hh[.]mm A";
                scope.updatedTime = moment('2015-10-29').format(REPORTS_LAST_UPDATED_TIME_FORMAT_WITHOUT_COMMA);
                var expected = ["Updated", scope.updatedTime];

                scope.exportToExcel();
                expect(spreadSheetContent.data).toContain(expected);
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
