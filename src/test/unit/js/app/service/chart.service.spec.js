define(["chartService", "angularMocks", "properties", "utils", "lodash", "timecop", "moment"], function(ChartService, mocks, properties, utils, _, timecop, moment) {
    describe("chart service", function() {
        var http, httpBackend, chartService, q, scope, lastUpdatedAt;

        beforeEach(mocks.inject(function($injector, $q, $rootScope) {
            http = $injector.get('$http');
            q = $q;
            scope = $rootScope;
            httpBackend = $injector.get('$httpBackend');

            thisMoment = moment("2014-01-01T");
            lastUpdatedAt = thisMoment.toISOString();
            Timecop.install();
            Timecop.freeze(thisMoment.toDate());

            chartService = new ChartService(http);
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        describe("chart service", function() {
            var http, httpBackend, chartService, q, mockChartRepository, scope, lastUpdatedAt;

            beforeEach(mocks.inject(function($injector, $q, $rootScope) {
                http = $injector.get('$http');
                q = $q;
                scope = $rootScope;
                httpBackend = $injector.get('$httpBackend');
                mockChartRepository = jasmine.createSpyObj('chartRepository', ['getAll']);

                thisMoment = moment("2014-01-01T");
                lastUpdatedAt = thisMoment.toISOString();
                Timecop.install();
                Timecop.freeze(thisMoment.toDate());

                chartService = new ChartService(http, mockChartRepository);
            }));

            afterEach(function() {
                httpBackend.verifyNoOutstandingExpectation();
                httpBackend.verifyNoOutstandingRequest();
            });

            describe("get chart data", function() {
                it("should get chart data when the dimensions are category options", function() {
                    var chartDefinition = {
                        "id": "TfnK0wFIgtf",
                        "name": "[FieldApp - GeneralIPDWard] Admission by Age Group",
                        "category": "pe",
                        "series": "a425c1a4618",
                        "relativePeriods": {
                            "last12Weeks": true
                        },
                        "categoryDimensions": [{
                            "dataElementCategory": {
                                "id": "a425c1a4618",
                                "name": "Default Age"
                            },
                            "categoryOptions": [{
                                "id": "a0b89770007",
                                "name": "5-14 years"
                            }, {
                                "id": "abacfb5842a",
                                "name": "<5 years"
                            }, {
                                "id": "af973e20283",
                                "name": ">=15 years"
                            }]
                        }],
                        "rows": [{
                            "id": "pe"
                        }],
                        "filters": [{
                            "id": "ou"
                        }, {
                            "id": "de"
                        }],
                        "filterDimensions": ["ou", "dx"],
                        "dataElements": [{
                            "id": "a0523c1e0d7",
                            "name": "New Admission - Emergency Department - Admission - General IPD Ward",
                            "code": "a0523c1e0d7"
                        }, {
                            "id": "a405970844a",
                            "name": "New Admission - Out-Patient Department - Admission - General IPD Ward",
                            "code": "a405970844a"
                        }],
                        "indicators": []
                    };

                    httpBackend.expectGET(properties.dhis.url + "/api/analytics.json?dimension=a425c1a4618:a0b89770007;abacfb5842a;af973e20283&dimension=pe:LAST_12_WEEKS&displayProperty=NAME&filter=ou:orgUnitId&filter=dx:a0523c1e0d7;a405970844a&lastUpdatedAt=" + lastUpdatedAt).respond(200, chartDefinition);
                    var actualData;
                    chartService.getChartDataForOrgUnit(chartDefinition, "orgUnitId").then(function(data) {
                        actualData = data;
                    });

                    httpBackend.flush();
                });

                it("should get Chart Data for orgUnit", function() {
                    var chart = {
                        "id": "KGYOPiEVkv6",
                        "name": "AA1 - Med Dept Demo 1",
                        "category": "pe",
                        "series": "dx",
                        "relativePeriods": {
                            "last12Months": true,
                            "last12Weeks": false,
                            "thisYear": false,
                            "last3Months": true,
                            "last52Weeks": false
                        },
                        "categoryDimensions": [],
                        "rows": [{
                            "id": "pe"
                        }],
                        "filters": [{
                            "id": "ou"
                        }],
                        "filterDimensions": ["ou"],
                        "dataElements": [{
                            "id": "a6c05884686",
                            "name": "Malaria (P. falciparum) - V1 - ER_OPD",
                            "code": "a6c05884686"
                        }],
                        "indicators": [{
                            "id": "indicator1",
                            "name": "Indicator 1"
                        }, {
                            "id": "indicator2",
                            "name": "Indicator 2"
                        }]

                    };

                    httpBackend.expectGET(properties.dhis.url + "/api/analytics.json?dimension=dx:indicator1;indicator2;a6c05884686&dimension=pe:LAST_12_MONTHS;LAST_3_MONTHS&displayProperty=NAME&filter=ou:orgUnitId&lastUpdatedAt=" + lastUpdatedAt).respond(200, chart);
                    var actualData;
                    chartService.getChartDataForOrgUnit(chart, "orgUnitId").then(function(data) {
                        actualData = data;
                    });

                    httpBackend.flush();

                    expect(actualData).toEqual(chart);

                });

            });

            describe("get chart definition", function() {

                it("should get all field app charts for specified datasets", function() {
                    var charts = [{
                        "name": "[FieldApp - Funky Dataset]",
                        "someAttribute": "someValue"
                    }, {
                        "name": "[FieldApp - CoolDataset]",
                        "someAttribute": "someValue"
                    }, {
                        "name": "[FieldApp - Not needed Dataset]",
                        "someAttribute": "someValue"
                    }];

                    var datasets = [{
                        "id": "ds1",
                        "code": "Funky Dataset"
                    }, {
                        "id": "ds2",
                        "code": "CoolDataset"
                    }];

                    httpBackend.expectGET(properties.dhis.url + "/api/charts.json?fields=:all&filter=name:like:%5BFieldApp+-+&paging=false").respond(200, {
                        "charts": charts
                    });

                    var actualData;

                    chartService.getAllFieldAppChartsForDataset(datasets).then(function(data) {
                        actualData = data;
                    });

                    httpBackend.flush();

                    expect(actualData).toEqual([{
                        "name": "[FieldApp - Funky Dataset]",
                        'dataset': 'ds1',
                        "someAttribute": "someValue"
                    }, {
                        "name": "[FieldApp - CoolDataset]",
                        'dataset': 'ds2',
                        "someAttribute": "someValue"
                    }]);
                });
            });
        });
    });

});
