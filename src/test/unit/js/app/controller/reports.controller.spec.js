define(["angularMocks", "utils", "moment", "timecop", "reportsController", "datasetRepository", "orgUnitRepository", "chartRepository", "pivotTableRepository", "translationsService", "customAttributes", "filesystemService", "saveSvgAsPng", "dataURItoBlob"], function(mocks, utils, moment, timecop, ReportsController, DatasetRepository, OrgUnitRepository, ChartRepository, PivotTableRepository, TranslationsService, CustomAttributes, FilesystemService, SVGUtils, dataURItoBlob) {
    describe("reportsController", function() {
        var scope, q, rootScope, routeParams,
            mockModule, mockDataSet,
            reportsController, datasetRepository, orgUnitRepository, chartRepository, pivotTableRepository, translationsService, filesystemService;

        beforeEach(mocks.inject(function($rootScope, $q) {
            rootScope = $rootScope;
            scope = $rootScope.$new();
            q = $q;

            mockModule = {
                id: 'someModuleId',
                name: 'Some Module Name',
                attributeValues: [{
                    attribute: {
                        code: 'Type'
                    },
                    value: 'Module'
                }],
                parent: {
                    name: 'Some Parent Name'
                }
            };

            mockDataSet = {
                id: 'someDataSetId',
                code: 'someDataSetCode'
            };

            routeParams = {
                orgUnit: mockModule.id
            };

            rootScope.resourceBundle = {};

            datasetRepository = new DatasetRepository();
            spyOn(datasetRepository, 'findAllForOrgUnits').and.returnValue(utils.getPromise(q, [mockDataSet]));

            chartRepository = new ChartRepository();
            spyOn(chartRepository, 'getDataForChart').and.returnValue(utils.getPromise(q, []));
            spyOn(chartRepository, 'getAll').and.returnValue(utils.getPromise(q, []));

            pivotTableRepository = new PivotTableRepository();
            spyOn(pivotTableRepository, 'getAll').and.returnValue(utils.getPromise(q, []));
            spyOn(pivotTableRepository, 'getPivotTableData').and.returnValue(utils.getPromise(q, {}));

            orgUnitRepository = new OrgUnitRepository();
            spyOn(orgUnitRepository, 'get').and.returnValue(utils.getPromise(q, mockModule));
            spyOn(orgUnitRepository, 'getAllModulesInOrgUnits').and.returnValue(utils.getPromise(q, [mockModule]));
            spyOn(orgUnitRepository, 'findAllByParent').and.returnValue(utils.getPromise(q, []));

            spyOn(CustomAttributes, 'getBooleanAttributeValue').and.returnValue(false);

            translationsService = new TranslationsService();
            spyOn(translationsService, 'translate').and.callFake(function (object) { return object; });
            spyOn(translationsService, 'translateReports').and.callFake(function (object) { return object; });
            spyOn(translationsService, 'translateCharts').and.callFake(function (object) { return object; });

            reportsController = new ReportsController(scope, q, routeParams, datasetRepository, orgUnitRepository, chartRepository, pivotTableRepository, translationsService);
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

        it("should load datasets ", function() {
            scope.$apply();

            expect(datasetRepository.findAllForOrgUnits).toHaveBeenCalledWith([mockModule.id]);
            expect(_.map(scope.datasets, 'id')).toEqual([mockDataSet.id]);
        });

        it("should load Chart data", function() {
            var datasets = [{
                "id": "ds1",
                "code": "dataSetCode1",
                "isOriginDataset": false,
                "isPopulationDataset": false,
                "isReferralDataset": false
            }, {
                "id": "ds2",
                "isOriginDataset": false,
                "code": "dataSetCode2",
                "isPopulationDataset": false,
                "isReferralDataset": false
            }, {
                "id": "ds3",
                "code": "dataSetCode3",
                "isOriginDataset": false,
                "isPopulationDataset": false,
                "isReferralDataset": false
            }];

            var charts = [{
                "name": "chart1",
                "title": "Title1",
                "dataSetCode": "dataSetCode1",
                "displayPosition": 1,
                "type": "STACKED_COLUMN",
                "weeklyChart": true
            }, {
                "name": "chart2",
                "title": "Title2",
                "dataSetCode": "dataSetCode2",
                "displayPosition": 2,
                "type": "LINE",
                "weeklyChart": true
            }, {
                "name": "chart3",
                "title": "Title3",
                "dataSetCode": "dataSetCode3",
                "displayPosition": 3,
                "type": "STACKED_COLUMN",
                "monthlyChart": true
            }, {
                "name": "chart4 Notifications",
                "title": "Title1",
                "dataSetCode": "dataSetCode1",
                "displayPosition": null,
                "type": "STACKED_COLUMN"
            }];

            var chartData1 = {
                "headers": [{
                    "name": "a1948a9c6f4",
                    "column": "Pediatric Age Group",
                    "type": "java.lang.String",
                    "hidden": false,
                    "meta": true
                }, {
                    "name": "pe",
                    "column": "Period",
                    "type": "java.lang.String",
                    "hidden": false,
                    "meta": true
                }, {
                    "name": "value",
                    "column": "Value",
                    "type": "java.lang.Double",
                    "hidden": false,
                    "meta": false
                }],
                "metaData": {
                    "pe": ["2015W25", "2015W26", "2015W27"],
                    "co": ["a5b4bc9fb13", "a356292c764", "a384d7501c2", "a44ec0d6da3", "a0a3ead9cab", "ad3a550cc4c", "a268522c516", "aa96411bdb6"],
                    "ou": ["a2cf79e8f13"],
                    "names": {
                        "a5b4bc9fb13": "(5-14 years, Male)",
                        "ac2f8253ff7": "New Admission - Out-Patient Department - Admission - Pediatric IPD Ward",
                        "dx": "Data",
                        "a0b89770007": "5-14 years",
                        "a1948a9c6f4": "Pediatric Age Group",
                        "afca0bdf0f1": "<1 month",
                        "a2cf79e8f13": "MSF",
                        "a3267f05ab8": "New Admission - Emergency Department - Admission - Pediatric IPD Ward",
                        "a0a3ead9cab": "(24-59 months, Female)",
                        "a9aa44b4f72": "New Admission - Other Facilities - Admission - Pediatric IPD Ward",
                        "a7fe8834446": "Referred-in Admission - Intensive Care Unit - Admission - Pediatric IPD Ward",
                        "ou": "Organisation unit",
                        "2015W25": "2015W25",
                        "2015W26": "2015W26",
                        "2015W27": "2015W27",
                        "abf819dca06": "24-59 months",
                        "pe": "Period",
                        "ab3a614eed1": "1-23 months",
                        "a356292c764": "(<1 month, Male)",
                        "a44ec0d6da3": "(1-23 months, Male)",
                        "a384d7501c2": "(<1 month, Female)",
                        "ad3a550cc4c": "(Female, 1-23 months)",
                        "a268522c516": "(24-59 months, Male)",
                        "a355d74e43f": "Referred-in Admission - Other Wards - Admission - Pediatric IPD Ward",
                        "aa96411bdb6": "(5-14 years, Female)",
                        "aa740de9a73": "Referred-in Admission - Operating Theatre - Admission - Pediatric IPD Ward"
                    }
                },
                "rows": [
                    ["a0b89770007", "2015W26", "48.0"],
                    ["abf819dca06", "2015W26", "36.0"],
                    ["afca0bdf0f1", "2015W26", "12.0"],
                    ["ab3a614eed1", "2015W26", "24.0"]
                ],
                "height": 4,
                "width": 3
            };

            var chartData2 = {
                "headers": [{
                    "name": "dx",
                    "column": "Data",
                    "type": "java.lang.String",
                    "hidden": false,
                    "meta": true
                }, {
                    "name": "pe",
                    "column": "Period",
                    "type": "java.lang.String",
                    "hidden": false,
                    "meta": true
                }, {
                    "name": "value",
                    "column": "Value",
                    "type": "java.lang.Double",
                    "hidden": false,
                    "meta": false
                }],
                "metaData": {
                    "pe": ["2015W21", "2015W22", "2015W23", "2015W24", "2015W25", "2015W26", "2015W27", "2015W17"],
                    "co": [],
                    "ou": ["a510de00b66", "KHUdZOGzsHr"],
                    "dx": ["KHUdZOGzsHr"],
                    "names": {
                        "LjYh00yjwxn": "Total Consultations 1-23 months Pediatric OPD",
                        "2015W18": "2015W18",
                        "ou": "Organisation unit",
                        "2015W19": "2015W19",
                        "dx": "Data",
                        "2015W25": "2015W25",
                        "2015W26": "2015W26",
                        "2015W27": "2015W27",
                        "2015W21": "2015W21",
                        "2015W22": "2015W22",
                        "2015W23": "2015W23",
                        "2015W24": "2015W24",
                        "2015W17": "2015W17",
                        "in": null,
                        "KHUdZOGzsH5": "Total Consultations <1 month Pediatric OPD",
                        "2015W20": "2015W20",
                        "a510de00b66": "Agg1",
                        "pe": "Period",
                        "KHUdZOGzsHr": "Total Consultations - Pediatric IPD"
                    }
                },
                "rows": [
                    ["LjYh00yjwxn", "2015W23", "260.0"],
                    ["LjYh00yjwxn", "2015W24", "168.0"],
                    ["LjYh00yjwxn", "2015W25", "168.0"],
                    ["LjYh00yjwxn", "2015W26", "200.0"],
                    ["KHUdZOGzsHr", "2015W17", "400.0"]
                ],
                "height": 22,
                "width": 3
            };

            datasetRepository.findAllForOrgUnits.and.returnValue(utils.getPromise(q, datasets));
            chartRepository.getAll.and.returnValue(utils.getPromise(q, charts));
            chartRepository.getDataForChart.and.callFake(function(chartName, orgUnit) {
                if (chartName === "chart1")
                    return utils.getPromise(q, chartData1);
                if (chartName === "chart2")
                    return utils.getPromise(q, chartData2);
                if (chartName === 'chart3')
                    return utils.getPromise(q);
            });

            scope.$apply();

            expect(chartRepository.getDataForChart).toHaveBeenCalledWith(charts[0].name, mockModule.id);
            expect(chartRepository.getDataForChart).toHaveBeenCalledWith(charts[1].name, mockModule.id);

            var unixTimestamp = function(period) {
                return moment(period, 'GGGG[W]W').unix();
            };

            var expectedChartData = [{
                "definition":{
                    "name": "chart1",
                    "title": "Title1",
                    "dataSetCode": "dataSetCode1",
                    "displayPosition": 1,
                    "type": "STACKED_COLUMN",
                    "weeklyChart": true
                },
                "data": [{
                    "key": "5-14 years",
                    "values": [{
                        "label": unixTimestamp('2015W25'),
                        "value": 0
                    }, {
                        "label": unixTimestamp('2015W26'),
                        "value": 48
                    }, {
                        "label": unixTimestamp('2015W27'),
                        "value": 0
                    }]
                }, {
                    "key": "24-59 months",
                    "values": [{
                        "label": unixTimestamp('2015W25'),
                        "value": 0
                    }, {
                        "label": unixTimestamp('2015W26'),
                        "value": 36
                    }, {
                        "label": unixTimestamp('2015W27'),
                        "value": 0
                    }]
                }, {
                    "key": "<1 month",
                    "values": [{
                        "label": unixTimestamp('2015W25'),
                        "value": 0
                    }, {
                        "label": unixTimestamp('2015W26'),
                        "value": 12
                    }, {
                        "label": unixTimestamp('2015W27'),
                        "value": 0
                    }]
                }, {
                    "key": "1-23 months",
                    "values": [{
                        "label": unixTimestamp('2015W25'),
                        "value": 0
                    }, {
                        "label": unixTimestamp('2015W26'),
                        "value": 24
                    }, {
                        "label": unixTimestamp('2015W27'),
                        "value": 0
                    }]
                }]
            }, {
                "definition": {
                    "name": "chart2",
                    "title": "Title2",
                    "dataSetCode": "dataSetCode2",
                    "displayPosition": 2,
                    "type": "LINE",
                    "weeklyChart": true
                },
                "data": [{
                    "key": "Total Consultations 1-23 months Pediatric OPD",
                    "values": [{
                        "label": unixTimestamp('2015W17'),
                        "value": 0
                    },{
                        "label": unixTimestamp('2015W21'),
                        "value": 0
                    }, {
                        "label": unixTimestamp('2015W22'),
                        "value": 0
                    }, {
                        "label": unixTimestamp('2015W23'),
                        "value": 260
                    }, {
                        "label": unixTimestamp('2015W24'),
                        "value": 168
                    }, {
                        "label": unixTimestamp('2015W25'),
                        "value": 168
                    }, {
                        "label": unixTimestamp('2015W26'),
                        "value": 200
                    }, {
                        "label": unixTimestamp('2015W27'),
                        "value": 0
                    }]
                },{
                    "key": "Total Consultations",
                    "values": [{
                        "label": unixTimestamp('2015W17'),
                        "value": 400
                    },{
                        "label": unixTimestamp('2015W21'),
                        "value": 0
                    }, {
                        "label": unixTimestamp('2015W22'),
                        "value": 0
                    }, {
                        "label": unixTimestamp('2015W23'),
                        "value": 0
                    }, {
                        "label": unixTimestamp('2015W24'),
                        "value": 0
                    }, {
                        "label": unixTimestamp('2015W25'),
                        "value": 0
                    }, {
                        "label": unixTimestamp('2015W26'),
                        "value": 0
                    }, {
                        "label": unixTimestamp('2015W27'),
                        "value": 0
                    }]
                }]
            }, undefined];

            expect(scope.charts).toEqual(expectedChartData);

            expect(scope.datasets[0].isWeeklyChartsAvailable).toBeTruthy();
            expect(scope.datasets[0].isMonthlyChartsAvailable).toBeFalsy();

            expect(scope.datasets[1].isWeeklyChartsAvailable).toBeTruthy();
            expect(scope.datasets[1].isMonthlyChartsAvailable).toBeFalsy();

            expect(scope.datasets[2].isWeeklyChartsAvailable).toBeFalsy();
            expect(scope.datasets[2].isMonthlyChartsAvailable).toBeFalsy();
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

            it('should translate the pivot tables', function () {
                scope.$apply();
                expect(translationsService.translateReports).toHaveBeenCalledWith([pivotTableData]);
            });

            it('should set the pivot tables on the scope', function () {
                var translatedPivotTableData = {
                    some: 'translatedData'
                };
                translationsService.translateReports.and.returnValue([translatedPivotTableData]);

                scope.$apply();
                expect(scope.pivotTables).toEqual([translatedPivotTableData]);
            });
        });

        describe('download chart', function () {
            var svgElement, blobObject;

            beforeEach(function () {
                routeParams = {orgUnit: 'mod1'};

                Timecop.install();
                Timecop.freeze(new Date("2016-07-21T12:43:54.972Z"));

                var mockdataURI = 'data:text/plain;charset=utf-8;base64,aGVsbG8gd29ybGQ=';
                spyOn(SVGUtils, 'svgAsPngUri').and.callFake(function(svgEl, options, callback) {
                    callback(mockdataURI);
                });

                var mockElement = document.createElement('div');
                svgElement = document.createElement('svg');

                mockElement.appendChild(svgElement);
                spyOn(document, 'getElementById').and.returnValue(mockElement);

                blobObject = dataURItoBlob(mockdataURI);

                filesystemService = new FilesystemService();
                spyOn(filesystemService, 'promptAndWriteFile').and.returnValue(utils.getPromise(q, {}));

                reportsController = new ReportsController(scope, q, routeParams, datasetRepository, orgUnitRepository, chartRepository, pivotTableRepository, translationsService, filesystemService);

                var mockChartDefinition = {id: 'chartId', name: '[FieldApp - ServiceName] ChartName'};
                scope.downloadChartAsPng(mockChartDefinition);
            });

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            it('should convert SVG to PNG DataURI', function () {
                expect(SVGUtils.svgAsPngUri).toHaveBeenCalledWith(svgElement, {}, jasmine.any(Function));
            });

            it('should prompt user to save chart as PNG with suggested name', function () {
                expect(filesystemService.promptAndWriteFile).toHaveBeenCalledWith('ServiceName.ChartName.21-Jul-2016.png', blobObject, filesystemService.FILE_TYPE_OPTIONS.PNG);
            });
        });
    });
});
