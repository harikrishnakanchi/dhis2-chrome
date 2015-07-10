define(["chartService", "angularMocks", "properties", "utils", "lodash"], function(ChartService, mocks, properties, utils, _) {
    describe("chart service", function() {
        var http, httpBackend, chartService;

        beforeEach(mocks.inject(function($injector) {
            http = $injector.get('$http');
            httpBackend = $injector.get('$httpBackend');

            chartService = new ChartService(http);
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        it("should get Chart Data for orgUnit", function() {
            var chart = {
                "id": "KGYOPiEVkv6",
                "name": "AA1 - Med Dept Demo 1",
                "relativePeriods": {
                    "last12Months": true,
                    "last12Weeks": false,
                    "thisYear": false,
                    "last3Months": true,
                    "last52Weeks": false
                },
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

            httpBackend.expectGET(properties.dhis.url + "/api/analytics.json?dimension=dx:indicator1;indicator2;a6c05884686&dimension=pe:LAST_12_MONTHS;LAST_3_MONTHS&displayProperty=NAME&filter=ou:orgUnitId").respond(200, chart);
            var actualData;
            chartService.getChartDataForOrgUnit(chart, "orgUnitId").then(function(data) {
                actualData = data;
            });

            httpBackend.flush();

            expect(actualData).toEqual(chart);

        });

        it("should get all field app charts", function() {
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

            httpBackend.expectGET(properties.dhis.url + "/api/charts.json?fields=name,id,type,organisationUnits,relativePeriods,dataElements,indicators,title&filter=name:like:%5BFieldApp+-+&paging=false").respond(200, {
                "charts": charts
            });

            var actualData;
            chartService.getAllFieldAppCharts(datasets).then(function(data) {
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
