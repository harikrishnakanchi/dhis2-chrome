define(['moment', 'timecop', 'angularMocks', 'utils', 'orgUnitRepository', 'changeLogRepository', 'pivotTableRepository', 'filesystemService', 'excelBuilder', 'pivotTableExportBuilder', 'opunitReportController'],
    function (moment, timecop, mocks, utils, OrgUnitRepository, ChangeLogRepository, PivotTableRepository, FileSystemService, ExcelBuilder, PivotTableExportBuilder, OpunitReportController) {
    var scope, q, routeParams, rootScope, mockOpUnit, lastUpdatedTime, currentTime, mockPivotTables, mockPivotTableData,
        orgUnitRepository, changeLogRepository, pivotTableRepository, filesystemService, pivotTableExportBuilder, opunitReportController;
    describe('opunitReportController', function () {
        beforeEach(mocks.inject(function ($rootScope, $q) {
            rootScope = $rootScope;
            scope = $rootScope.$new();
            q = $q;
            
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

            orgUnitRepository = new OrgUnitRepository();
            spyOn(orgUnitRepository, 'get').and.returnValue(utils.getPromise(q, mockOpUnit));
            
            changeLogRepository = new ChangeLogRepository();
            spyOn(changeLogRepository, 'get').and.returnValue(utils.getPromise(q, lastUpdatedTime));

            pivotTableRepository = new PivotTableRepository();
            spyOn(pivotTableRepository, 'getAll').and.returnValue(utils.getPromise(q, mockPivotTables));
            spyOn(pivotTableRepository, 'getPivotTableData').and.returnValue(utils.getPromise(q, mockPivotTableData));

            filesystemService = new FileSystemService();
            spyOn(filesystemService, 'promptAndWriteFile').and.returnValue(utils.getPromise(q, {}));

            pivotTableExportBuilder = new PivotTableExportBuilder();
            spyOn(pivotTableExportBuilder, 'build');

            spyOn(ExcelBuilder, 'createWorkBook').and.returnValue(new Blob());

            opunitReportController = new OpunitReportController(rootScope, q, scope, routeParams, orgUnitRepository, changeLogRepository, pivotTableRepository, filesystemService, pivotTableExportBuilder);
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

        it('should get the lastUpdated', function () {
            var projectId = rootScope.currentUser.selectedProject.id,
                REPORTS_LAST_UPDATED_TIME_FORMAT = "D MMMM[,] YYYY hh[.]mm A";

            scope.$apply();
            expect(changeLogRepository.get).toHaveBeenCalledWith('monthlyPivotTableData:' + projectId);
            expect(scope.lastUpdatedTimeForOpUnitReport).toEqual(moment(lastUpdatedTime).format(REPORTS_LAST_UPDATED_TIME_FORMAT));
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

        it('should filter out opunit pivot tables without data', function() {
            mockPivotTableData.isDataAvailable = false;
            scope.$apply();

            expect(scope.pivotTables).toEqual([]);
        });

        describe('should export to excel', function () {
            var spreadSheetContent;
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

                var expectedFilename = 'opUnitName.OpunitReport.[updated 22 November 2016 06.13 PM].xlsx';
                expect(filesystemService.promptAndWriteFile).toHaveBeenCalledWith(expectedFilename, jasmine.any(Blob), filesystemService.FILE_TYPE_OPTIONS.XLSX);
            });

            it('should contain project last downloaded time information', function () {
                scope.exportToExcel();

                expect(spreadSheetContent.data).toContain(['Updated', '22 November 2016 06.13 PM']);
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