define(["reportService", "angularMocks", "properties", "utils", "lodash", "timecop", "moment"], function(ReportService, mocks, properties, utils, _, timecop, moment) {
    describe("report service", function() {
        var http, httpBackend, reportService, q, scope, lastUpdatedAt;

        beforeEach(mocks.inject(function($injector) {
            http = $injector.get('$http');
            q = $injector.get('$q');
            httpBackend = $injector.get('$httpBackend');
            reportService = new ReportService(http, q);
            thisMoment = moment("2014-01-01T");
            lastUpdatedAt = thisMoment.toISOString();
            Timecop.install();
            Timecop.freeze(thisMoment.toDate());
        }));

        afterEach(function() {
            Timecop.returnToPresent();
            Timecop.uninstall();
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        it("should get report data for specified orgunit", function() {
            var orgUnitId = "ou1";
            var chartDefinition = {
                "id": "iRSWeHOmLgv",
                "name": "[FieldApp - AdultIPDWard] 1 Admission by age group",
                "type": "column",
                "title": "Admission by age group - Adult IPD Ward",
                "columns": [{
                    "dimension": "ad3af7f9d95",
                    "items": [{
                        "id": "a3902b51dab",
                        "name": "15-48 years"
                    }, {
                        "id": "a7a336284aa",
                        "name": ">49 years"
                    }]
                }],
                "rows": [{
                    "dimension": "pe",
                    "items": [{
                        "id": "LAST_12_WEEKS",
                        "name": "LAST_12_WEEKS"
                    }]
                }],
                "filters": [{
                    "dimension": "ou",
                    "items": [{
                        "id": "a2cf79e8f13",
                        "name": "MSF"
                    }]
                }, {
                    "dimension": "dx",
                    "items": [{
                        "id": "a7c6e2bd082",
                        "name": "New Admission - Emergency Department - Admission - Adult IPD Ward"
                    }, {
                        "id": "a0321bb4608",
                        "name": "New Admission - Other Facilities - Admission - Adult IPD Ward"
                    }, {
                        "id": "a5c577497f4",
                        "name": "New Admission - Out-Patient Department - Admission - Adult IPD Ward"
                    }, {
                        "id": "a551c464fcb",
                        "name": "Referred-in Admission - Intensive Care Unit - Admission - Adult IPD Ward"
                    }, {
                        "id": "ad3d3b10115",
                        "name": "Referred-in Admission - Operating Theatre - Admission - Adult IPD Ward"
                    }, {
                        "id": "afa1c3eff7b",
                        "name": "Referred-in Admission - Other Wards - Admission - Adult IPD Ward"
                    }]
                }]
            };

            var expectedUrl = properties.dhis.url + "/api/analytics?dimension=ad3af7f9d95:a3902b51dab;a7a336284aa&dimension=pe:LAST_12_WEEKS&filter=ou:" + orgUnitId + "&filter=dx:a7c6e2bd082;a0321bb4608;a5c577497f4;a551c464fcb;ad3d3b10115;afa1c3eff7b&lastUpdatedAt=" + lastUpdatedAt;

            httpBackend.expectGET(expectedUrl).respond(200, chartDefinition);

            var actualData;
            reportService.getReportDataForOrgUnit(chartDefinition, orgUnitId).then(function(data) {
                actualData = data;
            });

            httpBackend.flush();

            expect(_.omit(actualData, 'url')).toEqual(chartDefinition);
            expect(actualData.url).toEqual(expectedUrl);
        });

        it("should insert appropriate ou filter in the analytics GET url if it does not exist in chart definition", function() {
            var orgUnitId = "ou1";
            var chartDefinition = {
                "id": "iRSWeHOmLgv",
                "name": "[FieldApp - AdultIPDWard] 1 Admission by age group",
                "type": "column",
                "title": "Admission by age group - Adult IPD Ward",
                "columns": [{
                    "dimension": "ad3af7f9d95",
                    "items": [{
                        "id": "a3902b51dab",
                        "name": "Number"
                    }]
                }],
                "rows": [{
                    "dimension": "pe",
                    "items": [{
                        "id": "LAST_12_WEEKS",
                        "name": "LAST_12_WEEKS"
                    }]
                }],
                "filters": []
            };

            var expectedUrl = properties.dhis.url + "/api/analytics?dimension=ad3af7f9d95:a3902b51dab&dimension=pe:LAST_12_WEEKS&filter=ou:" + orgUnitId + "&lastUpdatedAt=" + lastUpdatedAt;

            httpBackend.expectGET(expectedUrl).respond(200, chartDefinition);

            reportService.getReportDataForOrgUnit(chartDefinition, orgUnitId);

            httpBackend.flush();
        });

        it("should get field app chart configs for specified datasets", function() {

            httpBackend.expectGET(properties.dhis.url + "/api/charts?filter=name:like:%5BFieldApp+-+&paging=false")
                .respond(200, {
                    "charts": [{
                        "id": "ch1",
                        "name": "[FieldApp - Funky Dataset]",
                        "href": properties.dhis.url + "/api/charts/ch1"
                    }, {
                        "id": "ch2",
                        "name": "[FieldApp - CoolDataset]",
                        "href": properties.dhis.url + "/api/charts/ch2"
                    }, {
                        "id": "ch3",
                        "name": "[FieldApp - Not needed Dataset]",
                        "href": properties.dhis.url + "/api/charts/ch3"
                    }]
                });

            httpBackend.expectGET(properties.dhis.url + "/api/charts/ch1?fields=*,program[id,name],programStage[id,name],columns[dimension,filter,items[id,name]],rows[dimension,filter,items[id,name]],filters[dimension,filter,items[id,name]]")
                .respond(200, {
                    "id": "ch1",
                    "name": "[FieldApp - Funky Dataset]",
                    "type": "line",
                    "columns": [{
                        "dimension": "in",
                        "items": [{
                            "id": "pgtbTi2TJOk",
                            "name": "Some indicator"
                        }]
                    }],
                    "rows": [{
                        "dimension": "in",
                        "items": [{
                            "id": "tqt3zzHDlgR",
                            "name": "Some other indicator"
                        }]
                    }],
                    "filters": [{
                        "dimension": "in",
                        "items": [{
                            "id": "IYpnsZJHOpS",
                            "name": "Yet another indicator"
                        }]
                    }]
                });

            httpBackend.expectGET(properties.dhis.url + "/api/charts/ch2?fields=*,program[id,name],programStage[id,name],columns[dimension,filter,items[id,name]],rows[dimension,filter,items[id,name]],filters[dimension,filter,items[id,name]]")
                .respond(200, {
                    "id": "ch2",
                    "name": "[FieldApp - CoolDataset]",
                    "type": "line",
                    "columns": [],
                    "rows": [],
                    "filters": []
                });

            var datasets = [{
                "id": "ds1",
                "code": "Funky Dataset"
            }, {
                "id": "ds2",
                "code": "CoolDataset"
            }];

            var actualData;
            reportService.getCharts(datasets).then(function(data) {
                actualData = data;
            });

            httpBackend.flush();

            expect(actualData).toEqual([{
                "id": "ch1",
                "name": "[FieldApp - Funky Dataset]",
                'dataset': 'ds1',
                "type": "line",
                "columns": [{
                    "dimension": "dx",
                    "items": [{
                        "id": "pgtbTi2TJOk",
                        "name": "Some indicator"
                    }]
                }],
                "rows": [{
                    "dimension": "dx",
                    "items": [{
                        "id": "tqt3zzHDlgR",
                        "name": "Some other indicator"
                    }]
                }],
                "filters": [{
                    "dimension": "dx",
                    "items": [{
                        "id": "IYpnsZJHOpS",
                        "name": "Yet another indicator"
                    }]
                }]
            }, {
                "id": "ch2",
                "name": "[FieldApp - CoolDataset]",
                'dataset': 'ds2',
                "type": "line",
                "columns": [],
                "rows": [],
                "filters": []
            }]);
        });


        it("should get field app report table configs for specified datasets", function() {
            httpBackend.expectGET(properties.dhis.url + "/api/reportTables?filter=name:like:%5BFieldApp+-+&paging=false")
                .respond(200, {
                    "reportTables": [{
                        "id": "tab1",
                        "name": "[FieldApp - Funky Dataset]",
                        "href": properties.dhis.url + "/api/reportTables/tab1"
                    }, {
                        "id": "tab2",
                        "name": "[FieldApp - CoolDataset]",
                        "href": properties.dhis.url + "/api/reportTables/tab2"
                    }, {
                        "id": "tab3",
                        "name": "[FieldApp - Not needed Dataset]",
                        "href": properties.dhis.url + "/api/reportTables/tab3"
                    }]
                });

            httpBackend.expectGET(properties.dhis.url + "/api/reportTables/tab1?fields=*,program[id,name],programStage[id,name],columns[dimension,filter,items[id,name]],rows[dimension,filter,items[id,name]],filters[dimension,filter,items[id,name]]")
                .respond(200, {
                    "id": "tab1",
                    "name": "[FieldApp - Funky Dataset]",
                    "type": "line",
                    "columns": [],
                    "rows": [],
                    "filters": []
                });

            httpBackend.expectGET(properties.dhis.url + "/api/reportTables/tab2?fields=*,program[id,name],programStage[id,name],columns[dimension,filter,items[id,name]],rows[dimension,filter,items[id,name]],filters[dimension,filter,items[id,name]]")
                .respond(200, {
                    "id": "tab2",
                    "name": "[FieldApp - CoolDataset]",
                    "type": "line",
                    "columns": [],
                    "rows": [],
                    "filters": []
                });

            var datasets = [{
                "id": "ds1",
                "code": "Funky Dataset"
            }, {
                "id": "ds2",
                "code": "CoolDataset"
            }];

            var actualData;

            reportService.getPivotTables(datasets).then(function(data) {
                actualData = data;
            });

            httpBackend.flush();

            expect(actualData).toEqual([{
                "id": "tab1",
                "name": "[FieldApp - Funky Dataset]",
                "dataset": "ds1",
                "type": "line",
                "columns": [],
                "rows": [],
                "filters": []
            }, {
                "id": "tab2",
                "name": "[FieldApp - CoolDataset]",
                "dataset": "ds2",
                "type": "line",
                "columns": [],
                "rows": [],
                "filters": []
            }]);
        });

        describe('getAllCharts', function () {
            it('should download field app charts modified since lastUpdated', function () {
                var lastUpdatedTime = '2016-02-19T04:28:32.082Z';

                reportService.getAllCharts(lastUpdatedTime).then(function (chartsFromService) {
                    expect(chartsFromService).toEqual([chart1DetailsResponse, chart2DetailsResponse]);
                });

                var updatedChartsResponse = {
                    'charts': [
                        { 'id': 'chart1' },
                        { 'id': 'chart2' }
                    ]
                };

                var chart1DetailsResponse = {
                    'id': 'chart1',
                    'more': 'details',
                    'rows': [],
                    'columns': [],
                    'filters': []
                };

                var chart2DetailsResponse = {
                    'id': 'chart2',
                    'more': 'details',
                    'rows': [],
                    'columns': [],
                    'filters': []
                };

                var expectedQueryParamsForUpdatedCharts = 'fields=id&filter=name:like:%5BFieldApp+-+&filter=lastUpdated:gte:' + lastUpdatedTime + '&paging=false';
                httpBackend.expectGET(properties.dhis.url + '/api/charts.json?' + expectedQueryParamsForUpdatedCharts).respond(200, updatedChartsResponse);

                var expectedQueryParamsForChartDetails = 'fields=id,name,title,type,sortOrder,columns%5Bdimension,filter,items%5Bid,name%5D%5D,rows%5Bdimension,filter,items%5Bid,name%5D%5D,filters%5Bdimension,filter,items%5Bid,name%5D%5D';
                httpBackend.expectGET(properties.dhis.url + '/api/charts/chart1.json?' + expectedQueryParamsForChartDetails).respond(200, chart1DetailsResponse);
                httpBackend.expectGET(properties.dhis.url + '/api/charts/chart2.json?' + expectedQueryParamsForChartDetails).respond(200, chart2DetailsResponse);
                httpBackend.flush();
            });

            it('should download all field app charts if lastUpdated is not provided', function () {
                reportService.getAllCharts();

                var expectedQueryParams = 'fields=id&filter=name:like:%5BFieldApp+-+&paging=false';
                httpBackend.expectGET(properties.dhis.url + '/api/charts.json?' + expectedQueryParams).respond(200, {});
                httpBackend.flush();
            });
        });

        describe('getAllCurrentChartIds', function () {
            it('should get the ids of all the current field app charts', function() {
                reportService.getAllCurrentChartIds().then(function (chartIdsFromService) {
                    expect(chartIdsFromService).toEqual(['chart1', 'chart2']);
                });

                var currentChartsResponse = {
                    'charts': [
                        { 'id': 'chart1' },
                        { 'id': 'chart2' }
                    ]
                };

                var expectedQueryParamsForUpdatedCharts = 'fields=id&filter=name:like:%5BFieldApp+-+&paging=false';
                httpBackend.expectGET(properties.dhis.url + '/api/charts.json?' + expectedQueryParamsForUpdatedCharts).respond(200, currentChartsResponse);
                httpBackend.flush();
            });
        });
    });
});
