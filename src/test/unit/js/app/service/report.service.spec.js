define(["reportService", "angularMocks", "properties", "utils", "lodash", "timecop", "moment", "dhisUrl"], function(ReportService, mocks, properties, utils, _, timecop, moment, dhisUrl) {
    describe("report service", function() {
        var http, httpBackend, reportService, q, currentMomentInTime;

        beforeEach(mocks.inject(function($injector) {
            http = $injector.get('$http');
            q = $injector.get('$q');
            httpBackend = $injector.get('$httpBackend');

            currentMomentInTime = moment("2014-01-01");
            Timecop.install();
            Timecop.freeze(currentMomentInTime);

            reportService = new ReportService(http, q);
        }));

        afterEach(function() {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        describe('getReportDataForOrgUnit', function () {
            var chartDefinition, orgUnitId;

            beforeEach(function () {
                orgUnitId = 'someOrgUnitId';
                chartDefinition = {
                    columns: [{
                        dimension: 'columnDimensionId',
                        items: [{
                            id: 'columnDimensionItemA'
                        }, {
                            id: 'columnDimensionItemB'
                        }]
                    }],
                    rows: [{
                        dimension: 'rowDimensionId',
                        items: [{
                            id: 'rowDimensionItemA'
                        }]
                    }],
                    filters: [{
                        dimension: 'ou',
                        items: [{
                            id: 'configuredOrgUnitId'
                        }]
                    }, {
                        dimension: 'filterDimensionId',
                        items: [{
                            id: 'filterDimensionItemA'
                        }, {
                            id: 'filterDimensionItemB'
                        }]
                    }]
                };

                currentMomentInTime = moment("2017-02-02");
                Timecop.install();
                Timecop.freeze(currentMomentInTime);
            });

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            it('should download data for the specified dimensions and filters', function () {
                httpBackend.expectGET(new RegExp(dhisUrl.analytics +
                    '.*dimension=columnDimensionId:columnDimensionItemA;columnDimensionItemB' +
                    '.*dimension=rowDimensionId:rowDimensionItemA' +
                    '.*filter=filterDimensionId:filterDimensionItemA;filterDimensionItemB'
                )).respond(200, {});

                reportService.getReportDataForOrgUnit(chartDefinition, orgUnitId);
                httpBackend.flush();
            });

            it('should add a timestamp to the URL for cache-busting', function () {
                httpBackend.expectGET(new RegExp('lastUpdatedAt=' + currentMomentInTime.toISOString())).respond(200, {});

                reportService.getReportDataForOrgUnit(chartDefinition, orgUnitId);
                httpBackend.flush();
            });

            it('should replace the existing orgUnit filter with the specified orgUnit', function () {
                httpBackend.expectGET(new RegExp('filter=ou:' + orgUnitId)).respond(200, {});

                reportService.getReportDataForOrgUnit(chartDefinition, orgUnitId);
                httpBackend.flush();
            });

            it('should replace the existing orgUnit filter with multiple specified orgUnits', function () {
                var orgUnitIds = ['someOrgUnitIdA', 'someOrgUnitIdB'];
                httpBackend.expectGET(new RegExp('filter=ou:' + orgUnitIds.join(';'))).respond(200, {});

                reportService.getReportDataForOrgUnit(chartDefinition, orgUnitIds);
                httpBackend.flush();
            });

            it('should replace the existing orgUnit row dimensions', function () {
                chartDefinition = {
                    rows: [{
                        dimension: 'ou',
                        items: [{
                            id: 'configuredOrgUnitId'
                        }]
                    }]
                };
                httpBackend.expectGET(new RegExp('dimension=ou:' + orgUnitId)).respond(200, {});

                reportService.getReportDataForOrgUnit(chartDefinition, orgUnitId);
                httpBackend.flush();
            });

            it('should replace the existing period column dimensions', function () {
                properties.projectDataSync.numYearsToSyncYearlyReports = 1;

                chartDefinition = {
                    yearlyReport: true,
                    columns: [{
                        dimension: 'pe'
                    }]
                };

                var expectedPeriodRange = ['201601', '201602', '201603', '201604', '201605', '201606', '201607', '201608', '201609', '201610', '201611', '201612', '201701', '201702'];

                httpBackend.expectGET(new RegExp('dimension=pe:' + expectedPeriodRange.join(';'))).respond(200, {});

                reportService.getReportDataForOrgUnit(chartDefinition, orgUnitId);
                httpBackend.flush();
            });

            it('should return the report data', function () {
                var mockReportData = { some: 'data' };

                httpBackend.expectGET(/.*/).respond(200, mockReportData);

                reportService.getReportDataForOrgUnit(chartDefinition, orgUnitId).then(function(reportData) {
                    expect(_.omit(reportData, 'url')).toEqual(mockReportData);
                });
                httpBackend.flush();
            });
        });

        describe('getUpdatedCharts', function () {
            var chartIds;

            beforeEach(function () {
                chartIds = {
                    charts: [
                        { id: 'chart1' },
                        { id: 'chart2' }
                    ]
                };
            });

            it('downloads the id of each chart', function () {
                var expectedQueryParams = 'fields=id&filter=name:like:%5BPraxis+-+&paging=false';

                httpBackend.expectGET(dhisUrl.charts + '.json?' + expectedQueryParams).respond(200, {});

                reportService.getUpdatedCharts();
                httpBackend.flush();
            });

            it('downloads the details of each chart', function () {
                httpBackend.expectGET(/.*charts.json.*/).respond(200, chartIds);

                var expectedQueryParams = encodeURI('fields=id,name,title,translations,relativePeriods,type,' +
                                                    'categoryDimensions[dataElementCategory,categoryOptions[:identifiable]],' +
                                                    'dataDimensionItems[dataElement[id,name,shortName,description],indicator[id,name,shortName,description],programIndicator[id,name,shortName,description]],' +
                                                    'columns[dimension,items[id,name]],' +
                                                    'rows[dimension,items[id,name]],' +
                                                    'filters[dimension,items[id]]');
                httpBackend.expectGET(dhisUrl.charts + '/' + 'chart1.json?' + expectedQueryParams).respond(200, {});
                httpBackend.expectGET(dhisUrl.charts + '/' + 'chart2.json?' + expectedQueryParams).respond(200, {});

                reportService.getUpdatedCharts();
                httpBackend.flush();
            });

            it('returns the details of each chart', function () {
                var chart1 = { id: 'chart1' },
                    chart2 = { id: 'chart2' };

                httpBackend.expectGET(/.*charts.json.*/).respond(200, chartIds);
                httpBackend.expectGET(/.*chart1.json.*/).respond(200, chart1);
                httpBackend.expectGET(/.*chart2.json.*/).respond(200, chart2);

                reportService.getUpdatedCharts().then(function (response) {
                    expect(response).toEqual([chart1, chart2]);
                });

                httpBackend.flush();
            });

            it('downloads the id of each chart modified since specific lastUpdated timestamp', function () {
                reportService.getUpdatedCharts('someTimestamp');

                httpBackend.expectGET(/.*filter=lastUpdated:gte:someTimestamp.*/).respond(200, {});
                httpBackend.flush();
            });
        });

        describe('getAllChartIds', function () {
            it('should get the ids of all field app charts', function() {
                reportService.getAllChartIds().then(function (chartIdsFromService) {
                    expect(chartIdsFromService).toEqual(['chart1', 'chart2']);
                });

                var chartIdsResponse = {
                    'charts': [
                        { 'id': 'chart1' },
                        { 'id': 'chart2' }
                    ]
                };

                var expectedQueryParamsForChartIds = 'fields=id&filter=name:like:%5BPraxis+-+&paging=false';
                httpBackend.expectGET(dhisUrl.charts + '.json?' + expectedQueryParamsForChartIds).respond(200, chartIdsResponse);
                httpBackend.flush();
            });
        });

        describe('getUpdatedPivotTables', function () {
            var pivotTableIds;

            beforeEach(function () {
                pivotTableIds = {
                    reportTables: [
                        { id: 'pivotTable1' },
                        { id: 'pivotTable2' }
                    ]
                };
            });

            it('downloads the id of each pivot table', function () {
                var expectedQueryParams = 'fields=id&filter=name:like:%5BPraxis+-+&paging=false';

                httpBackend.expectGET(dhisUrl.pivotTables + '.json?' + expectedQueryParams).respond(200, {});

                reportService.getUpdatedPivotTables();
                httpBackend.flush();
            });

            it('downloads the details of each pivot table', function () {
                httpBackend.expectGET(/.*reportTables.json.*/).respond(200, pivotTableIds);

                var expectedQueryParams = encodeURI('fields=id,name,title,translations,sortOrder,relativePeriods,' +
                                                    'categoryDimensions[dataElementCategory,categoryOptions[:identifiable]],' +
                                                    'dataDimensionItems[dataElement[id,name,shortName,description],indicator[id,name,shortName,description],programIndicator[id,name,shortName,description]],' +
                                                    'columns[dimension,items[id,name]],' +
                                                    'rows[dimension,items[id,name]],' +
                                                    'filters[dimension,items[id]]');
                httpBackend.expectGET(dhisUrl.pivotTables + '/pivotTable1.json?' + expectedQueryParams).respond(200, {});
                httpBackend.expectGET(dhisUrl.pivotTables + '/pivotTable2.json?' + expectedQueryParams).respond(200, {});

                reportService.getUpdatedPivotTables();
                httpBackend.flush();
            });

            it('returns the details of each pivot table', function () {
                var pivotTable1 = { id: 'table1' },
                    pivotTable2 = { id: 'table2' };

                httpBackend.expectGET(/.*reportTables.json.*/).respond(200, pivotTableIds);
                httpBackend.expectGET(/.*pivotTable1.json.*/).respond(200, pivotTable1);
                httpBackend.expectGET(/.*pivotTable2.json.*/).respond(200, pivotTable2);

                reportService.getUpdatedPivotTables().then(function (response) {
                    expect(response).toEqual([pivotTable1, pivotTable2]);
                });

                httpBackend.flush();
            });

            it('downloads the id of each pivot table modified since specified lastUpdated timestamp', function () {
                reportService.getUpdatedPivotTables('someTimestamp');

                httpBackend.expectGET(/.*filter=lastUpdated:gte:someTimestamp.*/).respond(200, {});
                httpBackend.flush();
            });
        });

        describe('getAllPivotTableIds', function () {
            it('should get the ids of all field app pivot tables', function() {
                reportService.getAllPivotTableIds().then(function (pivotTableIdsFromService) {
                    expect(pivotTableIdsFromService).toEqual(['pivotTable1', 'pivotTable2']);
                });

                var pivotTableIdsResponse = {
                    'reportTables': [
                        { 'id': 'pivotTable1' },
                        { 'id': 'pivotTable2' }
                    ]
                };

                var expectedQueryParamsForPivotTableIds = 'fields=id&filter=name:like:%5BPraxis+-+&paging=false';

                httpBackend.expectGET(dhisUrl.pivotTables + '.json?' + expectedQueryParamsForPivotTableIds).respond(200, pivotTableIdsResponse);
                httpBackend.flush();
            });
        });

        describe('getAllEventReportIds', function () {
            it('should get all the ids of all praxis app event reports', function () {
                var someEventReportId = 'someEventReportId';
                var someOtherEventReportId = 'someOtherEventReportId';


                reportService.getAllEventReportIds().then(function (eventReports) {
                    expect(eventReports).toEqual([someEventReportId, someOtherEventReportId]);
                });

                var eventReportsIdsResponse = {
                    'eventReports': [
                        {'id': someEventReportId},
                        {'id': someOtherEventReportId}
                    ]
                };
                var expectedQueryParamsForEventReportIds = 'fields=id&filter=name:like:%5BPraxis+-+&paging=false';

                httpBackend.expectGET(dhisUrl.eventReports + '.json?' + expectedQueryParamsForEventReportIds).respond(200, eventReportsIdsResponse);
                httpBackend.flush();
            });
        });

        describe('getUpdatedEventReports', function () {

            var eventReportIds;
            beforeEach(function () {
                eventReportIds = {
                    eventReports: [
                        {id: 'someEventReportId'},
                        {id: 'someOtherEventReportId'}
                    ]
                };
            });

            it('downloads the id of each event report', function () {
                var expectedQueryParams = 'fields=id&filter=name:like:%5BPraxis+-+&paging=false';

                httpBackend.expectGET(dhisUrl.eventReports + '.json?' + expectedQueryParams).respond(200, {});

                reportService.getUpdatedEventReports();
                httpBackend.flush();
            });

            it('should download the id of each event report modified since specified lastUpdated timestamp', function () {
                reportService.getUpdatedEventReports('someTimeStamp');
                httpBackend.expectGET(/.*filter=lastUpdated:gte:someTimeStamp.*/).respond(200, {});
                httpBackend.flush();
            });

            it('should download the event report details', function () {
                httpBackend.expectGET(/.*eventReports.json.*/).respond(200, eventReportIds);

                var expectedQueryParams = encodeURI('fields=id,name,title,translations,sortOrder,relativePeriods,categoryDimensions,' +
                    'dataElementDimensions[:all,legendSet[id,name,legends[id,name]],dataElement[id,name]]' +
                    ',columns[dimension,items[id,name]],rows[dimension,items[id,name]]');
                httpBackend.expectGET(dhisUrl.eventReports + '/someEventReportId.json?' + expectedQueryParams).respond(200, {});
                httpBackend.expectGET(dhisUrl.eventReports + '/someOtherEventReportId.json?' + expectedQueryParams).respond(200, {});

                reportService.getUpdatedEventReports();
                httpBackend.flush();
            });

            it('should return the updated event reports', function () {
                var someEventReport = 'someEventReport';
                var someOtherEventReport = 'someOtherEventReport';
                httpBackend.expectGET(/.*eventReports.json.*/).respond(200, eventReportIds);
                httpBackend.expectGET(/.*someEventReportId.json.*/).respond(200, someEventReport);
                httpBackend.expectGET(/.*someOtherEventReportId.json.*/).respond(200, someOtherEventReport);

                reportService.getUpdatedEventReports().then(function (data) {
                    expect(data).toEqual([someEventReport, someOtherEventReport]);
                });

                httpBackend.flush();
            });
        });
    });
});
