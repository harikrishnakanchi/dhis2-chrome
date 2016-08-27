define(["angularMocks", "utils", "moment", "timecop", "reportsController", "datasetRepository", "orgUnitRepository", "chartRepository", "pivotTableRepository", "translationsService", "changeLogRepository", "customAttributes", "filesystemService", "saveSvgAsPng", "dataURItoBlob"], function(mocks, utils, moment, timecop, ReportsController, DatasetRepository, OrgUnitRepository, ChartRepository, PivotTableRepository, TranslationsService, ChangeLogRepository, CustomAttributes, FilesystemService, SVGUtils, dataURItoBlob) {
    describe("reportsController", function() {
        var scope, q, rootScope, routeParams,
            mockModule, mockDataSet, mockProject,
            reportsController, datasetRepository, orgUnitRepository, chartRepository, pivotTableRepository, translationsService, changeLogRepository, filesystemService;

        beforeEach(mocks.inject(function($rootScope, $q) {
            rootScope = $rootScope;
            scope = $rootScope.$new();
            q = $q;

            mockModule = {
                id: 'someModuleId',
                name: 'Some Module Name',
                attributeValues: 'someAttributeValues',
                parent: {
                    name: 'Some Parent Name'
                }
            };
            mockDataSet = {
                id: 'someDataSetId',
                code: 'someDataSetCode'
            };
            mockProject = {
                id: 'someProjectId'
            };
            routeParams = {
                orgUnit: mockModule.id
            };
            rootScope.resourceBundle = {};
            rootScope.currentUser = {
                selectedProject: mockProject
            };

            datasetRepository = new DatasetRepository();
            spyOn(datasetRepository, 'findAllForOrgUnits').and.returnValue(utils.getPromise(q, [mockDataSet]));

            chartRepository = new ChartRepository();
            spyOn(chartRepository, 'getAll').and.returnValue(utils.getPromise(q, []));
            spyOn(chartRepository, 'getChartData').and.returnValue(utils.getPromise(q, {}));

            pivotTableRepository = new PivotTableRepository();
            spyOn(pivotTableRepository, 'getAll').and.returnValue(utils.getPromise(q, []));
            spyOn(pivotTableRepository, 'getPivotTableData').and.returnValue(utils.getPromise(q, {}));

            orgUnitRepository = new OrgUnitRepository();
            spyOn(orgUnitRepository, 'get').and.returnValue(utils.getPromise(q, mockModule));
            spyOn(orgUnitRepository, 'getAllModulesInOrgUnits').and.returnValue(utils.getPromise(q, [mockModule]));
            spyOn(orgUnitRepository, 'findAllByParent').and.returnValue(utils.getPromise(q, []));

            changeLogRepository = new ChangeLogRepository();
            spyOn(changeLogRepository, 'get').and.returnValue(utils.getPromise(q, {}));

            filesystemService = new FilesystemService();
            spyOn(filesystemService, 'promptAndWriteFile').and.returnValue(utils.getPromise(q, {}));

            spyOn(CustomAttributes, 'getBooleanAttributeValue').and.returnValue(false);

            translationsService = new TranslationsService();
            spyOn(translationsService, 'translate').and.callFake(function (object) { return object; });
            spyOn(translationsService, 'translatePivotTableData').and.callFake(function (object) { return object; });

            reportsController = new ReportsController(rootScope, scope, q, routeParams, datasetRepository, orgUnitRepository, chartRepository, pivotTableRepository, translationsService, filesystemService, changeLogRepository);
        }));

        it('should set the orgunit display name for modules', function() {
            scope.$apply();
            expect(scope.orgUnit.displayName).toEqual(mockModule.parent.name + ' - ' + mockModule.name);
        });

        it('should set the flag whether current orgUnit is a linelist module', function() {
            CustomAttributes.getBooleanAttributeValue.and.returnValue('someBooleanValue');
            scope.$apply();

            expect(CustomAttributes.getBooleanAttributeValue).toHaveBeenCalledWith(mockModule.attributeValues, CustomAttributes.LINE_LIST_ATTRIBUTE_CODE);
            expect(scope.orgUnit.lineListService).toEqual('someBooleanValue');
        });

        it("should load dataSets", function() {
            scope.$apply();

            expect(datasetRepository.findAllForOrgUnits).toHaveBeenCalledWith([mockModule.id]);
            expect(_.map(scope.datasets, 'id')).toEqual([mockDataSet.id]);
        });

        describe('loading of charts', function () {
            var chartA, chartB, chartData;

            beforeEach(function () {
                chartA = {
                    dataSetCode: 'someDataSetCode'
                };
                chartB = {
                    dataSetCode: 'someOtherDataSetCode'
                };
                chartData = {
                    some: 'data',
                    categories: ['someCategory']
                };

                chartRepository.getAll.and.returnValue(utils.getPromise(q, [chartA, chartB]));
                chartRepository.getChartData.and.returnValue(utils.getPromise(q, chartData));
                scope.$apply();
            });


            it('should load all chart definitions', function () {
                expect(chartRepository.getAll).toHaveBeenCalled();
            });

            it('should get chartData for relevant dataSets of the module', function () {
                expect(chartRepository.getChartData).toHaveBeenCalledWith(chartA, mockModule.id);
                expect(chartRepository.getChartData).toHaveBeenCalledTimes(1);
            });

            xit('should translate the charts', function () {
                expect(translationsService.translateChartData).toHaveBeenCalledWith([chartData]);
            });

            it('should set the charts on the scope', function () {
                expect(scope.charts).toEqual([chartData]);
            });
        });

        describe('loading of pivot tables', function () {
            var pivotTableA, pivotTableB, pivotTableData;

            beforeEach(function () {
                pivotTableA = {
                    dataSetCode: 'someDataSetCode'
                };
                pivotTableB = {
                    dataSetCode: 'someOtherDataSetCode'
                };
                pivotTableData = {
                    some: 'data'
                };

                pivotTableRepository.getAll.and.returnValue(utils.getPromise(q, [pivotTableA, pivotTableB]));
                pivotTableRepository.getPivotTableData.and.returnValue(utils.getPromise(q, pivotTableData));
                scope.$apply();
            });


            it('should load all pivot table definitions', function () {
                expect(pivotTableRepository.getAll).toHaveBeenCalled();
            });

            it('should get pivotTableData for relevant dataSets of the module', function () {
                expect(pivotTableRepository.getPivotTableData).toHaveBeenCalledWith(pivotTableA, mockModule.id);
                expect(pivotTableRepository.getPivotTableData).toHaveBeenCalledTimes(1);
            });

            it('should translate the pivot tables', function () {
                expect(translationsService.translatePivotTableData).toHaveBeenCalledWith([pivotTableData]);
            });

            it('should set the pivot tables on the scope', function () {
                expect(scope.pivotTables).toEqual([pivotTableData]);
            });
        });

        describe('download chart', function () {
            var svgElement, mockDataUri, mockChart, currentTime, DATETIME_FORMAT;

            beforeEach(function () {
                DATETIME_FORMAT = "DD-MMM-YYYY";
                currentTime = moment('2016-07-31T12:00:00');
                Timecop.install();
                Timecop.freeze(currentTime);

                mockDataUri = 'data:text/plain;charset=utf-8;base64,aGVsbG8gd29ybGQ=';
                spyOn(SVGUtils, 'svgAsPngUri').and.callFake(function(svgEl, options, callback) {
                    callback(mockDataUri);
                });

                var mockElement = document.createElement('div');
                svgElement = document.createElement('svg');

                mockElement.appendChild(svgElement);
                spyOn(document, 'getElementById').and.returnValue(mockElement);

                mockChart = {
                    dataSetCode: 'ServiceName',
                    title: 'ChartName'
                };
                scope.downloadChartAsPng(mockChart);
            });

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            it('should convert SVG to PNG DataURI', function () {
                expect(SVGUtils.svgAsPngUri).toHaveBeenCalledWith(svgElement, {}, jasmine.any(Function));
            });

            it('should prompt user to save chart as PNG with suggested name', function () {
                var expectedFileName = [mockChart.dataSetCode, mockChart.title, currentTime.format(DATETIME_FORMAT), 'png'].join('.');
                expect(filesystemService.promptAndWriteFile).toHaveBeenCalledWith(expectedFileName, dataURItoBlob(mockDataUri), filesystemService.FILE_TYPE_OPTIONS.PNG);
            });
        });

        describe('Updated date and time for charts and reports', function () {
            it('should get the lastUpdated for reports and charts', function () {
                scope.$apply();
                expect(changeLogRepository.get).toHaveBeenCalledWith('monthlyPivotTableData:' + mockProject.id);
                expect(changeLogRepository.get).toHaveBeenCalledWith('weeklyPivotTableData:' + mockProject.id);
                expect(changeLogRepository.get).toHaveBeenCalledWith('weeklyChartData:' + mockProject.id);
                expect(changeLogRepository.get).toHaveBeenCalledWith('monthlyChartData:' + mockProject.id);
            });

            it('should set the updated time on scope', function () {
                scope.$apply();
                expect(scope.updatedForWeeklyChart).toBeDefined();
                expect(scope.updatedForWeeklyPivotTable).toBeDefined();
                expect(scope.updatedForMonthlyChart).toBeDefined();
                expect(scope.updatedForMonthlyPivotTable).toBeDefined();
            });
        });
    });
});
