define(["angularMocks", "utils", "moment", "timecop", "reportsController", "dataSetRepository", "programRepository", "orgUnitRepository", "chartRepository", "pivotTableRepository", "referralLocationsRepository", "translationsService", "changeLogRepository", "customAttributes", "filesystemService", "saveSvgAsPng", "dataURItoBlob", "lodash"],
    function(mocks, utils, moment, timecop, ReportsController, DatasetRepository, ProgramRepository, OrgUnitRepository, ChartRepository, PivotTableRepository, ReferralLocationsRepository, TranslationsService, ChangeLogRepository, customAttributes, FilesystemService, SVGUtils, dataURItoBlob, _) {
    describe("reportsController", function() {
        var scope, q, rootScope, routeParams,
            mockModule, mockDataSet, mockGeographicOriginDataSet, mockReferralLocationDataSet, mockProgram, mockProject, mockOrigin, mockReferralLocations,
            reportsController, datasetRepository, programRepository, orgUnitRepository, chartRepository, pivotTableRepository, referralLocationsRepository, translationsService, changeLogRepository, filesystemService;

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
            mockOrigin = {
                id: 'mockOriginId'
            };
            mockDataSet = {
                id: 'someDataSetId',
                serviceCode: 'someDataSetServiceCode'
            };
            mockGeographicOriginDataSet = {
                id: 'geographicOriginDatasetId',
                serviceCode: 'GeographicOrigin'
            };
            mockReferralLocationDataSet = {
                id: 'referralLocation',
                serviceCode: 'ReferralLocation'
            };
            mockProgram = {
                id: 'someProgramId',
                serviceCode: 'someProgramServiceCode'
            };
            mockProject = {
                id: 'someProjectId'
            };
            mockReferralLocations = [{"referralNameA": {name: 'someLocation'}}, {"referralNameB": {name: 'someOtherLocation'}}];
            routeParams = {
                orgUnit: mockModule.id
            };
            rootScope.resourceBundle = {};

            scope.startLoading = jasmine.createSpy('startLoading');
            scope.stopLoading = jasmine.createSpy('stopLoading');
            scope.orgUnit = {id: 'someId', parent: {id: 'someOrgUnitId'}};
            scope.locale = 'en';

            rootScope.currentUser = {
                selectedProject: mockProject
            };

            datasetRepository = new DatasetRepository();
            spyOn(datasetRepository, 'findAllForOrgUnits').and.returnValue(utils.getPromise(q, [mockDataSet]));

            programRepository = new ProgramRepository();
            spyOn(programRepository, 'getProgramForOrgUnit').and.returnValue(utils.getPromise(q, mockProgram));

            chartRepository = new ChartRepository();
            spyOn(chartRepository, 'getAll').and.returnValue(utils.getPromise(q, []));
            spyOn(chartRepository, 'getChartData').and.returnValue(utils.getPromise(q, {}));

            pivotTableRepository = new PivotTableRepository();
            spyOn(pivotTableRepository, 'getAll').and.returnValue(utils.getPromise(q, []));
            spyOn(pivotTableRepository, 'getPivotTableData').and.returnValue(utils.getPromise(q, {}));

            orgUnitRepository = new OrgUnitRepository();
            spyOn(orgUnitRepository, 'get').and.returnValue(utils.getPromise(q, mockModule));
            spyOn(orgUnitRepository, 'getAllModulesInOrgUnits').and.returnValue(utils.getPromise(q, [mockModule]));
            spyOn(orgUnitRepository, 'findAllByParent').and.returnValue(utils.getPromise(q, [mockOrigin]));
            spyOn(orgUnitRepository, 'enrichWithParent').and.callFake(function(orgUnit){ return orgUnit; });

            changeLogRepository = new ChangeLogRepository();
            spyOn(changeLogRepository, 'get').and.returnValue(utils.getPromise(q, {}));

            filesystemService = new FilesystemService();
            spyOn(filesystemService, 'promptAndWriteFile').and.returnValue(utils.getPromise(q, {}));

            spyOn(customAttributes, 'getBooleanAttributeValue').and.returnValue(false);

            translationsService = new TranslationsService();
            spyOn(translationsService, 'translate').and.callFake(function (object) { return object; });
            spyOn(translationsService, 'translatePivotTableData').and.callFake(function (object) { return object; });
            spyOn(translationsService, 'translateChartData').and.callFake(function (object) { return object; });

            referralLocationsRepository = new ReferralLocationsRepository();
            spyOn(referralLocationsRepository, 'get').and.returnValue(utils.getPromise(q, mockReferralLocations));

            reportsController = new ReportsController(rootScope, scope, q, routeParams, datasetRepository, programRepository, orgUnitRepository, chartRepository, pivotTableRepository, translationsService, filesystemService, changeLogRepository, referralLocationsRepository);
        }));

        it('should set the orgunit display name for modules', function() {
            scope.$apply();
            expect(scope.orgUnit.displayName).toEqual(mockModule.parent.name + ' - ' + mockModule.name);
        });

        it('should set the flag whether current orgUnit is a linelist module', function() {
            customAttributes.getBooleanAttributeValue.and.returnValue('someBooleanValue');
            scope.$apply();

            expect(customAttributes.getBooleanAttributeValue).toHaveBeenCalledWith(mockModule.attributeValues, customAttributes.LINE_LIST_ATTRIBUTE_CODE);
            expect(scope.orgUnit.lineListService).toEqual('someBooleanValue');
        });

        describe('loading of services', function () {
            beforeEach(function () {
                programRepository.getProgramForOrgUnit.and.returnValue(utils.getPromise(q, undefined));
            });

            it('should load dataSets', function() {
                scope.$apply();

                expect(datasetRepository.findAllForOrgUnits).toHaveBeenCalledWith([mockModule, mockOrigin]);
                expect(_.map(scope.services, 'id')).toEqual([mockDataSet.id]);
            });

            it('should load program', function () {
                scope.$apply();

                expect(programRepository.getProgramForOrgUnit).toHaveBeenCalledWith(mockOrigin.id);
            });

            it('should set the default service code if dataSet has no service code', function () {
                mockDataSet.serviceCode = undefined;

                scope.$apply();

                expect(_.map(scope.services, 'serviceCode')).toEqual(['noServiceCode']);
            });

            it('should filter out population, referral and linelist data sets', function () {
                var excludedDataSets = [{
                    id: 'populationDataSet',
                    isPopulationDataset: true
                }, {
                    id: 'lineListDataSet',
                    isLineListService: true
                }];
                datasetRepository.findAllForOrgUnits.and.returnValue(utils.getPromise(q, excludedDataSets));

                scope.$apply();
                expect(scope.services).toEqual([]);
            });

            it('should sort the services', function () {
                datasetRepository.findAllForOrgUnits.and.returnValue(utils.getPromise(q, [{ name: 'serviceB' }, { name: 'serviceA' }]));

                scope.$apply();
                expect(_.map(scope.services, 'name')).toEqual(['serviceA', 'serviceB']);
            });

            it('should filter out geographic origin service for lineListModule if there is no data for geographic origin', function () {
                chartRepository.getChartData.and.returnValue(utils.getPromise(q, []));
                pivotTableRepository.getPivotTableData.and.returnValue(utils.getPromise(q, []));
                datasetRepository.findAllForOrgUnits.and.returnValue(utils.getPromise(q, [mockGeographicOriginDataSet]));
                programRepository.getProgramForOrgUnit.and.returnValue(utils.getPromise(q, mockProgram));
                customAttributes.getBooleanAttributeValue.and.returnValue(true);
                scope.$apply();
                expect(_.map(scope.services, 'id')).toEqual([mockProgram.id]);
            });

            it('should filter out referralLocation service for lineListModule if there is no data for referralLocation', function () {
                chartRepository.getChartData.and.returnValue(utils.getPromise(q, []));
                pivotTableRepository.getPivotTableData.and.returnValue(utils.getPromise(q, []));
                datasetRepository.findAllForOrgUnits.and.returnValue(utils.getPromise(q, [mockReferralLocationDataSet]));
                programRepository.getProgramForOrgUnit.and.returnValue(utils.getPromise(q, mockProgram));
                customAttributes.getBooleanAttributeValue.and.returnValue(true);
                scope.$apply();
                expect(_.map(scope.services, 'id')).toEqual([mockProgram.id]);
            });
        });

        describe('loading of charts', function () {
            var chartA, chartB, chartData;

            beforeEach(function () {
                chartA = {
                    serviceCode: 'someDataSetServiceCode'
                };
                chartB = {
                    serviceCode: 'someOtherDataSetServiceCode'
                };
                chartData = {
                    isDataAvailable: true,
                    categories: ['someCategory']
                };

                chartRepository.getAll.and.returnValue(utils.getPromise(q, [chartA, chartB]));
                chartRepository.getChartData.and.returnValue(utils.getPromise(q, chartData));
            });

            it('should load all chart definitions', function () {
                scope.$apply();
                expect(chartRepository.getAll).toHaveBeenCalled();
            });

            it('should get chartData for relevant dataSets of the module', function () {
                scope.$apply();
                expect(chartRepository.getChartData).toHaveBeenCalledWith(chartA, mockModule.id);
                expect(chartRepository.getChartData).toHaveBeenCalledTimes(1);
            });

            it('should not get the notification chartData', function () {
                var notificationChart = {
                    serviceCode: 'someDataSetServiceCode',
                    name: 'Something - Notifications'
                };
                chartRepository.getAll.and.returnValue(utils.getPromise(q, [notificationChart]));
                scope.$apply();
                expect(chartRepository.getChartData).not.toHaveBeenCalled();
            });

            it('should translate charts', function () {
                scope.$apply();
                expect(translationsService.translate).toHaveBeenCalledWith([chartA]);
            });

            it('should translate the chart data', function () {
                scope.$apply();
                expect(translationsService.translateChartData).toHaveBeenCalledWith([chartData]);
            });

            it('should set the charts on the scope', function () {
                scope.$apply();
                expect(scope.charts).toEqual([chartData]);
            });

            it('should filter out charts without data', function () {
                chartData.isDataAvailable = false;
                scope.$apply();
                expect(scope.charts).toEqual([]);
            });
        });

        describe('loading of pivot tables', function () {
            var pivotTableA, pivotTableB, pivotTableData;

            beforeEach(function () {
                pivotTableA = {
                    serviceCode: 'someDataSetServiceCode'
                };
                pivotTableB = {
                    serviceCode: 'someOtherDataSetServiceCode'
                };
                pivotTableData = {
                    isDataAvailable: true
                };

                pivotTableRepository.getAll.and.returnValue(utils.getPromise(q, [pivotTableA, pivotTableB]));
                pivotTableRepository.getPivotTableData.and.returnValue(utils.getPromise(q, pivotTableData));
            });


            it('should load all pivot table definitions', function () {
                scope.$apply();
                expect(pivotTableRepository.getAll).toHaveBeenCalled();
            });

            it('should get pivotTableData for relevant dataSets of the module', function () {
                scope.$apply();
                expect(pivotTableRepository.getPivotTableData).toHaveBeenCalledWith(pivotTableA, mockModule.id);
                expect(pivotTableRepository.getPivotTableData).toHaveBeenCalledTimes(1);
            });

            it('should not get the notification pivotTableData', function () {
                var notificationPivotTable = {
                    serviceCode: 'someDataSetServiceCode',
                    name: 'Something - Notifications'
                };
                pivotTableRepository.getAll.and.returnValue(utils.getPromise(q, [notificationPivotTable]));
                scope.$apply();
                expect(pivotTableRepository.getPivotTableData).not.toHaveBeenCalled();
            });

            it('should translate pivot tables', function () {
                scope.$apply();
                expect(translationsService.translate).toHaveBeenCalledWith([pivotTableA]);
            });

            it('should translate the pivot table data', function () {
                scope.$apply();
                expect(translationsService.translatePivotTableData).toHaveBeenCalledWith([pivotTableData]);
            });

            it('should set the pivot tables on the scope', function () {
                scope.$apply();
                expect(scope.pivotTables).toEqual([pivotTableData]);
            });

            it('should filter out pivot tables without data', function () {
                pivotTableData.isDataAvailable = false;
                scope.$apply();
                expect(scope.pivotTables).toEqual([]);
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
                    serviceCode: 'ServiceName',
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
                var expectedFileName = [mockChart.serviceCode, mockChart.title, currentTime.format(DATETIME_FORMAT)].join('.');
                expect(filesystemService.promptAndWriteFile).toHaveBeenCalledWith(expectedFileName, dataURItoBlob(mockDataUri), filesystemService.FILE_TYPE_OPTIONS.PNG);
            });
        });

        it('should get the referral locations for the module and set it on scope', function () {
            scope.$apply();
            expect(referralLocationsRepository.get).toHaveBeenCalledWith(scope.orgUnit.parent.id);
            expect(scope.referralLocations).toEqual(mockReferralLocations);
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

        describe('SelectedService', function () {
            var mockDataSet, mockProgram, chartA, chartB, chartDataA, chartDataB;

            beforeEach(function () {
                mockDataSet = {
                    id: 'someDataSetId',
                    serviceCode: 'serviceCodeA'
                };

                mockProgram = {
                    id: 'someProgramId',
                    serviceCode: 'serviceCodeB'
                };

                datasetRepository.findAllForOrgUnits.and.returnValue(utils.getPromise(q, [mockDataSet]));
                programRepository.getProgramForOrgUnit.and.returnValue(utils.getPromise(q, mockProgram));

                chartA = {
                    serviceCode: 'serviceCodeA'
                };
                chartB = {
                    serviceCode: 'serviceCodeB'
                };

                chartDataA = {
                    isDataAvailable: true,
                    serviceCode: 'serviceCodeA',
                    categories: ['someCategory']
                };

                chartDataB = {
                    isDataAvailable: true,
                    serviceCode: 'serviceCodeB',
                    categories: ['someCategory']
                };

                chartRepository.getAll.and.returnValue(utils.getPromise(q, [chartA, chartB]));
                chartRepository.getChartData.and.returnValues(utils.getPromise(q, chartDataA), utils.getPromise(q, chartDataB));
            });

            it('should select the first service from the alphabetically sorted services which has at least one chart or report', function () {
                scope.$apply();

                expect(scope.selectedService).toEqual(scope.services[0]);
            });
        });
    });
});
