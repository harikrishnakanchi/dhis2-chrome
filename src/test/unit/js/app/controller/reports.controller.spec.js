define(["angularMocks", "utils", "moment", "reportsController", "datasetRepository", "orgUnitRepository", "chartRepository", "pivotTableRepository"], function(mocks, utils, moment, ReportsController, DatasetRepository, OrgUnitRepository, ChartRepository, PivotTableRepository) {
    describe("reportsControllerspec", function() {

        var scope, reportsController, datasetRepository, orgUnitRepository, chartRepository, pivotTableRepository;

        beforeEach(mocks.inject(function($rootScope, $q) {
            scope = $rootScope.$new();
            q = $q;

            datasetRepository = new DatasetRepository();
            spyOn(datasetRepository, "findAllForOrgUnits").and.returnValue(utils.getPromise(q, []));

            chartRepository = new ChartRepository();
            spyOn(chartRepository, "getDataForChart").and.returnValue(utils.getPromise(q, []));
            spyOn(chartRepository, "getAll").and.returnValue(utils.getPromise(q, []));
            pivotTableRepository = new PivotTableRepository();
            spyOn(pivotTableRepository, "getAll").and.returnValue(utils.getPromise(q, []));
            spyOn(pivotTableRepository, "getDataForPivotTable").and.returnValue(utils.getPromise(q, []));

            orgUnitRepository = new OrgUnitRepository();
            spyOn(orgUnitRepository, "get").and.returnValue(utils.getPromise(q, {}));
            spyOn(orgUnitRepository, "getAllModulesInOrgUnits").and.returnValue(utils.getPromise(q, []));
            spyOn(orgUnitRepository, "findAllByParent").and.returnValue(utils.getPromise(q, []));

            scope.resourceBundle = {};

        }));

        it("should set the orgunit display name for modules", function() {
            routeParams = {
                "orgUnit": "mod1"
            };

            var mod1 = {
                "id": "mod1",
                "name": "module 1",
                "displayName": "module 1",
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Module"
                }],
                "parent": {
                    "name": "op unit",
                }
            };

            orgUnitRepository.get.and.returnValue(utils.getPromise(q, mod1));
            reportsController = new ReportsController(scope, q, routeParams, datasetRepository, orgUnitRepository, chartRepository, pivotTableRepository);
            scope.$apply();

            expect(scope.orgUnit.displayName).toEqual("op unit - module 1");
        });

        it("should set the orgunit display name for project", function() {
            routeParams = {
                "orgUnit": "prj1"
            };

            var prj1 = {
                "id": "prj1",
                "name": "project 1",
                "displayName": "project 1",
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Project"
                }]
            };

            orgUnitRepository.get.and.returnValue(utils.getPromise(q, prj1));
            reportsController = new ReportsController(scope, q, routeParams, datasetRepository, orgUnitRepository, chartRepository, pivotTableRepository);
            scope.$apply();

            expect(scope.orgUnit.displayName).toEqual("project 1");
        });

        it("should load datasets into scope along with their translated names", function() {
            routeParams = {
                "orgUnit": "prj1"
            };

            scope.resourceBundle = {
                "ds1": "Localised_ds1"
            };

            var prj1 = {
                "id": "prj1"
            };

            var mod1 = {
                "id": "mod1"
            };

            var datasets = [{
                "id": "ds1",
                "name": "ds1",
                "isOriginDataset": false,
                "isPopulationDataset": false,
                "isReferralDataset": false
            }, {
                "id": "ds2",
                "name": "ds2",
                "isOriginDataset": true,
                "isPopulationDataset": false,
                "isReferralDataset": false
            }, {
                "id": "ds3",
                "name": "ds3",
                "isOriginDataset": false,
                "isPopulationDataset": true,
                "isReferralDataset": false
            }, {
                "id": "ds4",
                "name": "ds4",
                "isOriginDataset": false,
                "isPopulationDataset": false,
                "isReferralDataset": true
            }];

            var expectedDatasets = [{
                "id": "ds1",
                "name": "ds1",
                "displayName": "Localised_ds1",
                "isOriginDataset": false,
                "isPopulationDataset": false,
                "isReferralDataset": false,
                "isChartsAvailable": false,
                "isPivotTablesAvailable": false,
                "isReportsAvailable": false
            }];

            orgUnitRepository.get.and.returnValue(utils.getPromise(q, prj1));
            orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, [mod1]));
            datasetRepository.findAllForOrgUnits.and.returnValue(utils.getPromise(q, datasets));

            reportsController = new ReportsController(scope, q, routeParams, datasetRepository, orgUnitRepository, chartRepository, pivotTableRepository);
            scope.$apply();

            expect(orgUnitRepository.getAllModulesInOrgUnits).toHaveBeenCalledWith("prj1");
            expect(datasetRepository.findAllForOrgUnits).toHaveBeenCalledWith(["mod1"]);
            expect(scope.datasets).toEqual(expectedDatasets);
        });

        it("should load Chart data", function() {
            routeParams = {
                "orgUnit": "mod1"
            };

            var mod1 = {
                "id": "mod1"
            };

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
                "type": "STACKED_COLUMN"
            }, {
                "name": "chart2",
                "title": "Title2",
                "dataSetCode": "dataSetCode2",
                "type": "LINE"
            }, {
                "name": "chart3 Notifications",
                "title": "Title1",
                "dataSetCode": "dataSetCode1",
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
                    "pe": ["2015W21", "2015W22", "2015W23", "2015W24", "2015W25", "2015W26", "2015W27"],
                    "co": [],
                    "ou": ["a510de00b66"],
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
                        "in": null,
                        "KHUdZOGzsH5": "Total Consultations <1 month Pediatric OPD",
                        "2015W20": "2015W20",
                        "a510de00b66": "Agg1",
                        "pe": "Period"
                    }
                },
                "rows": [
                    ["LjYh00yjwxn", "2015W23", "260.0"],
                    ["LjYh00yjwxn", "2015W24", "168.0"],
                    ["LjYh00yjwxn", "2015W25", "168.0"],
                    ["LjYh00yjwxn", "2015W26", "200.0"]
                ],
                "height": 22,
                "width": 3
            };

            orgUnitRepository.get.and.returnValue(utils.getPromise(q, mod1));
            orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, [mod1]));
            datasetRepository.findAllForOrgUnits.and.returnValue(utils.getPromise(q, datasets));
            chartRepository.getAll.and.returnValue(utils.getPromise(q, charts));
            chartRepository.getDataForChart.and.callFake(function(chartName, orgUnit) {
                if (chartName === "chart1")
                    return utils.getPromise(q, chartData1);
                if (chartName === "chart2")
                    return utils.getPromise(q, chartData2);
            });

            reportsController = new ReportsController(scope, q, routeParams, datasetRepository, orgUnitRepository, chartRepository, pivotTableRepository);
            scope.$apply();

            expect(chartRepository.getDataForChart).toHaveBeenCalledWith(charts[0].name, "mod1");
            expect(chartRepository.getDataForChart).toHaveBeenCalledWith(charts[1].name, "mod1");

            var unixTimestamp = function(period) {
                return moment(period, 'GGGG[W]W').unix();
            };

            var expectedChartData = [{
                "title": "Title1",
                "dataSetCode": "dataSetCode1",
                "type": "STACKED_COLUMN",
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
                "title": "Title2",
                "dataSetCode": "dataSetCode2",
                "type": "LINE",
                "data": [{
                    "key": "Total Consultations 1-23 months Pediatric OPD",
                    "values": [{
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
                }]
            }];

            expect(scope.chartData).toEqual(expectedChartData);

            expect(scope.datasets[0].isChartsAvailable).toBeTruthy();
            expect(scope.datasets[0].isPivotTablesAvailable).toBeFalsy();
            expect(scope.datasets[0].isReportsAvailable).toBeTruthy();

            expect(scope.datasets[2].isChartsAvailable).toBeFalsy();
            expect(scope.datasets[2].isReportsAvailable).toBeFalsy();
        });

        it("should load pivot tables into the scope", function() {
            routeParams = {
                "orgUnit": "mod1"
            };

            var mod1 = {
                "id": "mod1"
            };

            var datasets = [{
                "id": "ds1",
                "isOriginDataset": false
            }, {
                "id": "ds2",
                "isOriginDataset": false
            }, {
                "id": "ds3",
                "isOriginDataset": false
            }];

            var pivotTables = [{
                "name": "Table 1",
                "dataset": "ds1"
            }, {
                "name": "Table 2",
                "dataset": "ds2"
            }];

            var pivotTableData1 = "table 1 data";
            var pivotTableData2 = "table 2 data";

            orgUnitRepository.get.and.returnValue(utils.getPromise(q, mod1));
            orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, [mod1]));
            datasetRepository.findAllForOrgUnits.and.returnValue(utils.getPromise(q, datasets));
            pivotTableRepository.getAll.and.returnValue(utils.getPromise(q, pivotTables));
            pivotTableRepository.getDataForPivotTable.and.callFake(function(chartName, orgUnit) {
                if (chartName === "Table 1")
                    return utils.getPromise(q, pivotTableData1);
                if (chartName === "Table 2")
                    return utils.getPromise(q, pivotTableData2);
            });
            var expectedPivotTableData = [{
                "table": pivotTables[0],
                "dataset": "ds1",
                "data": pivotTableData1
            }, {
                "table": pivotTables[1],
                "dataset": "ds2",
                "data": pivotTableData2
            }];
            reportsController = new ReportsController(scope, q, routeParams, datasetRepository, orgUnitRepository, chartRepository, pivotTableRepository);
            scope.$apply();

            expect(pivotTableRepository.getDataForPivotTable).toHaveBeenCalledWith(pivotTables[0].name, "mod1");
            expect(pivotTableRepository.getDataForPivotTable).toHaveBeenCalledWith(pivotTables[1].name, "mod1");
            expect(scope.pivotTables).toEqual(expectedPivotTableData);
        });
    });
});
