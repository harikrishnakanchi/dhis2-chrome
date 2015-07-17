define(["angularMocks", "utils", "reportsController", "datasetRepository", "orgUnitRepository", "chartService"], function(mocks, utils, ReportsController, DatasetRepository, OrgUnitRepository, ChartService) {
    describe("reportsControllerspec", function() {

        var reportsController, datasetRepository, orgUnitRepository, chartService;

        beforeEach(mocks.inject(function($rootScope, $q) {
            scope = $rootScope.$new();
            q = $q;

            datasetRepository = new DatasetRepository();
            spyOn(datasetRepository, "findAllForOrgUnits").and.returnValue(utils.getPromise(q, []));

            orgUnitRepository = new OrgUnitRepository();
            spyOn(orgUnitRepository, "get").and.returnValue(utils.getPromise(q, {}));
            spyOn(orgUnitRepository, "getAllModulesInOrgUnits").and.returnValue(utils.getPromise(q, []));

            chartService = new ChartService();
            spyOn(chartService, "getAllFieldAppCharts").and.returnValue(utils.getPromise(q, []));
            spyOn(chartService, "getChartDataForOrgUnit").and.returnValue(utils.getPromise(q, []));
        }));

        it("should set the orgunit display name for modules", function() {
            routeParams = {
                'orgUnit': 'mod1'
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
            reportsController = new ReportsController(scope, q, routeParams, datasetRepository, orgUnitRepository, chartService);
            scope.$apply();

            expect(scope.orgUnit.displayName).toEqual('op unit - module 1');
        });

        it("should set the orgunit display name for project", function() {
            routeParams = {
                'orgUnit': 'prj1'
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
            reportsController = new ReportsController(scope, q, routeParams, datasetRepository, orgUnitRepository, chartService);
            scope.$apply();

            expect(scope.orgUnit.displayName).toEqual('project 1');
        });

        it("should load datasets into scope", function() {
            routeParams = {
                'orgUnit': 'prj1'
            };

            var prj1 = {
                'id': 'prj1'
            };

            var mod1 = {
                "id": "mod1"
            };

            var datasets = [{
                "id": "ds1"
            }, {
                "id": "ds2"
            }];

            orgUnitRepository.get.and.returnValue(utils.getPromise(q, prj1));
            orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, [mod1]));
            datasetRepository.findAllForOrgUnits.and.returnValue(utils.getPromise(q, datasets));

            reportsController = new ReportsController(scope, q, routeParams, datasetRepository, orgUnitRepository, chartService);
            scope.$apply();

            expect(orgUnitRepository.getAllModulesInOrgUnits).toHaveBeenCalledWith("prj1");
            expect(datasetRepository.findAllForOrgUnits).toHaveBeenCalledWith(["mod1"]);
            expect(scope.datasets).toEqual(datasets);
        });

        it("should load Chart data", function() {
            routeParams = {
                'orgUnit': 'mod1'
            };

            var mod1 = {
                "id": "mod1"
            };

            var datasets = [{
                "id": "ds1"
            }, {
                "id": "ds2"
            }, {
                "id": "ds3"
            }];

            var charts = [{
                "name": "chart1",
                "title": "Title1",
                "dataset": "ds1",
                "type": "stackedcolumn"
            }, {
                "name": "chart2",
                "title": "Title2",
                "dataset": "ds2",
                "type": "line"
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
            chartService.getAllFieldAppCharts.and.returnValue(utils.getPromise(q, charts));
            chartService.getChartDataForOrgUnit.and.callFake(function(chart, orgUnit) {
                if (chart.name === 'chart1')
                    return utils.getPromise(q, chartData1);
                if (chart.name === 'chart2')
                    return utils.getPromise(q, chartData2);
            });

            reportsController = new ReportsController(scope, q, routeParams, datasetRepository, orgUnitRepository, chartService);
            scope.$apply();

            expect(chartService.getAllFieldAppCharts).toHaveBeenCalledWith(datasets);
            expect(chartService.getChartDataForOrgUnit).toHaveBeenCalledWith(charts[0], 'mod1');
            expect(chartService.getChartDataForOrgUnit).toHaveBeenCalledWith(charts[1], 'mod1');

            var expectedChartData = [{
                "title": "Title1",
                "dataset": "ds1",
                "type": "stackedcolumn",
                "data": [{
                    "key": "5-14 years",
                    "values": [{
                        label: 201525,
                        value: 0
                    }, {
                        label: 201526,
                        value: 48
                    }, {
                        label: 201527,
                        value: 0
                    }]

                }, {
                    "key": "24-59 months",
                    "values": [{
                        label: 201525,
                        value: 0
                    }, {
                        label: 201526,
                        value: 36
                    }, {
                        label: 201527,
                        value: 0
                    }]
                }, {
                    "key": "<1 month",
                    "values": [{
                        label: 201525,
                        value: 0
                    }, {
                        label: 201526,
                        value: 12
                    }, {
                        label: 201527,
                        value: 0
                    }]
                }, {
                    "key": "1-23 months",
                    "values": [{
                        label: 201525,
                        value: 0
                    }, {
                        label: 201526,
                        value: 24
                    }, {
                        label: 201527,
                        value: 0
                    }]
                }]
            }, {
                "title": "Title2",
                "dataset": "ds2",
                "type": "line",
                "data": [{
                    "key": "Total Consultations 1-23 months Pediatric OPD",
                    "values": [{
                        label: 201521,
                        value: 0
                    }, {
                        label: 201522,
                        value: 0
                    }, {
                        label: 201523,
                        value: 260
                    }, {
                        label: 201524,
                        value: 168
                    }, {
                        label: 201525,
                        value: 168
                    }, {
                        label: 201526,
                        value: 200
                    }, {
                        label: 201527,
                        value: 0
                    }]

                }]

            }];

            expect(scope.chartData).toEqual(expectedChartData);
        });

    });
});
