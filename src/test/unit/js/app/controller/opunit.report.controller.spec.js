define(['moment', 'timecop', 'angularMocks', 'utils', 'orgUnitRepository', 'changeLogRepository', 'pivotTableRepository', 'filesystemService', 'translationsService', 'excelBuilder', 'pivotTableExportBuilder', 'opUnitReportController'],
    function (moment, timecop, mocks, utils, OrgUnitRepository, ChangeLogRepository, PivotTableRepository, FileSystemService, TranslationsService, ExcelBuilder, PivotTableExportBuilder, OpUnitReportController) {
    var scope, q, routeParams, rootScope, mockOpUnit, lastUpdatedTime, currentTime, mockPivotTables, mockPivotTableData,
        orgUnitRepository, changeLogRepository, pivotTableRepository, filesystemService, translationsService, pivotTableExportBuilder, opUnitReportController;
    describe('opUnitReportController', function () {
        beforeEach(mocks.inject(function ($rootScope, $q) {
            rootScope = $rootScope;
            scope = $rootScope.$new();
            q = $q;

            scope.resourceBundle = {
                updated: 'Updated'
            };

            routeParams = {
                opUnit: 'opUnitId'
            };

            mockOpUnit = {
                id: 'opUnitId',
                name: 'opUnitName'
            };

            rootScope.currentUser = {
                selectedProject: {
                    id: "someProjectId"
                }
            };

            mockPivotTables = [{
                id: 'somePivotTableId',
                opUnitReport: true
            }, {
                id: 'someOtherPivotTableId',
                opUnitReport: false
            }];

            mockPivotTableData = {
                some: 'data',
                isDataAvailable: true
            };

            currentTime = moment('2016-11-23T12:43:54.972Z');
            Timecop.install();
            Timecop.freeze(currentTime);
            lastUpdatedTime = '2016-11-22T12:43:54.972Z';

            scope.startLoading = jasmine.createSpy('startLoading');
            scope.stopLoading = jasmine.createSpy('stopLoading');
            scope.locale = 'en';

            orgUnitRepository = new OrgUnitRepository();
            spyOn(orgUnitRepository, 'get').and.returnValue(utils.getPromise(q, mockOpUnit));
            
            changeLogRepository = new ChangeLogRepository();
            spyOn(changeLogRepository, 'get').and.returnValue(utils.getPromise(q, lastUpdatedTime));

            pivotTableRepository = new PivotTableRepository();
            spyOn(pivotTableRepository, 'getAll').and.returnValue(utils.getPromise(q, mockPivotTables));
            spyOn(pivotTableRepository, 'getPivotTableData').and.returnValue(utils.getPromise(q, mockPivotTableData));

            filesystemService = new FileSystemService();
            spyOn(filesystemService, 'promptAndWriteFile').and.returnValue(utils.getPromise(q, {}));

            translationsService = new TranslationsService();
            spyOn(translationsService, 'translatePivotTableData').and.callFake(function(object) { return object; });
            spyOn(translationsService, 'translate').and.callFake(function(object) { return object; });

            pivotTableExportBuilder = new PivotTableExportBuilder();
            spyOn(pivotTableExportBuilder, 'build');

            spyOn(ExcelBuilder, 'createWorkBook').and.returnValue(new Blob());

            opUnitReportController = new OpUnitReportController(rootScope, q, scope, routeParams, orgUnitRepository, changeLogRepository, pivotTableRepository, filesystemService, translationsService, pivotTableExportBuilder);
        }));

        afterEach(function () {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });
        
        it('should get the opunit name and set it to scope', function () {
            scope.$apply();
            expect(orgUnitRepository.get).toHaveBeenCalledWith(routeParams.opUnit);
            expect(scope.opUnitName).toEqual(mockOpUnit.name);
        });

        describe('lastUpdatedTimeForOpUnitReport', function () {
            it('should get the lastUpdated', function () {
                var projectId = rootScope.currentUser.selectedProject.id,
                    REPORTS_LAST_UPDATED_TIME_FORMAT = "D MMMM YYYY[,] h[:]mm A";

                scope.$apply();
                expect(changeLogRepository.get).toHaveBeenCalledWith('monthlyPivotTableData:' + projectId);
                expect(scope.lastUpdatedTimeForOpUnitReport).toEqual(moment(lastUpdatedTime).format(REPORTS_LAST_UPDATED_TIME_FORMAT));
            });

            it('should get the lastUpdated when the locale is French', function () {
                var projectId = rootScope.currentUser.selectedProject.id,
                    REPORTS_LAST_UPDATED_TIME_24HR_FORMAT = "D MMMM YYYY[,] HH[h]mm";

                scope.locale = 'fr';
                scope.$apply();
                expect(changeLogRepository.get).toHaveBeenCalledWith('monthlyPivotTableData:' + projectId);
                expect(scope.lastUpdatedTimeForOpUnitReport).toEqual(moment(lastUpdatedTime).locale(scope.locale).format(REPORTS_LAST_UPDATED_TIME_24HR_FORMAT));
            });
        });

        it('should filter out opunit pivot tables from all pivot tables to get data', function() {
            var opUnitReportPivotTable = {
                id: 'somePivotTableId',
                opUnitReport: true
            };
            scope.$apply();
            expect(pivotTableRepository.getPivotTableData).toHaveBeenCalledWith(opUnitReportPivotTable, routeParams.opUnit);
            expect(scope.pivotTables).toEqual([mockPivotTableData]);
        });

        it('should translate opunit pivot tables', function () {
            var opUnitReportPivotTables = _.filter(mockPivotTables, { opUnitReport: true });
            scope.$apply();

            expect(translationsService.translate).toHaveBeenCalledWith(opUnitReportPivotTables);
        });

        it('should filter out opunit pivot tables without data', function() {
            mockPivotTableData.isDataAvailable = false;
            scope.$apply();

            expect(scope.pivotTables).toEqual([]);
        });

        it('should translate pivot table data', function() {
            scope.$apply();

            expect(translationsService.translatePivotTableData).toHaveBeenCalledWith([mockPivotTableData]);
        });

        describe('should export to excel', function () {
            var spreadSheetContent,
                LAST_UPDATED_TIME_FORMAT = "D MMMM YYYY[,] h[:]mm A";

            beforeEach(function () {
                scope.$apply();

                spreadSheetContent = undefined;
                ExcelBuilder.createWorkBook.and.callFake(function (workBookContent) {
                    spreadSheetContent = _.first(workBookContent);
                    return new Blob();
                });
            });

            it('should prompt the user to save the Excel file with suggested filename', function () {
                scope.exportToExcel();

                var expectedFilename = 'opUnitName.OpUnitReport.[Updated ' + moment(lastUpdatedTime).format(LAST_UPDATED_TIME_FORMAT) + '].xlsx';
                expect(filesystemService.promptAndWriteFile).toHaveBeenCalledWith(expectedFilename, jasmine.any(Blob), filesystemService.FILE_TYPE_OPTIONS.XLSX);
            });

            it('should contain project last downloaded time information', function () {
                scope.exportToExcel();

                expect(spreadSheetContent.data).toContain(['Updated', moment(lastUpdatedTime).format(LAST_UPDATED_TIME_FORMAT)]);
            });

            it('should contain the title of each table', function () {
                scope.exportToExcel();

                expect(spreadSheetContent.data).toContain([mockPivotTableData.title]);
            });

            it('should contain the results of the pivot table export builder', function () {
                var mockPivotTableExport = ['mockPivotTableExport'];
                pivotTableExportBuilder.build.and.returnValue([mockPivotTableExport]);

                scope.exportToExcel();
                expect(spreadSheetContent.data).toContain(mockPivotTableExport);
            });
        });
    });
});