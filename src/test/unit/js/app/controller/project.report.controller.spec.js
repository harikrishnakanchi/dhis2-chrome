define(["orgUnitRepository", "angularMocks", "projectReportController", "utils", "pivotTableRepository", "timecop"], function(OrgUnitRepository, mocks, ProjectReportController, utils, PivotTableRepository, timecop) {
    describe("projectReportController", function() {
        var scope, rootScope, projectReportController, orgUnitRepository, pivotTableRepository, pivotTables, data, q;

        beforeEach(mocks.inject(function($rootScope, $q) {
            rootScope = $rootScope;
            q = $q;

            Timecop.install();
            Timecop.freeze(new Date("2015-10-29T12:43:54.972Z"));

            rootScope.currentUser = {
                userCredentials: {
                    username: "test_user"
                },
                selectedProject: {
                    id: "xyz",
                    name: "Aweil - SS153"
                }
            };

            scope = rootScope.$new();

            var projectBasicInfo = {
                "attributeValues": [
                    {
                        "attribute": {
                            "name": "Context"
                        },
                        "value": "Cross-border instability"
                    },
                    {
                        "attribute": {
                            "name": "Project Code"
                        },
                        "value": "SS153"
                    },
                    {
                        "attribute": {
                            "name": "Mode Of Operation"
                        },
                        "value": "Direct operation"
                    },
                    {
                        "attribute": {
                            "name": "Project Type"
                        },
                        "value": "Regular Project"
                    },
                    {
                        "attribute": {
                            "name": "Model Of Management"
                        },
                        "value": "Collaboration"
                    },
                    {
                        "attribute": {
                            "name": "Type"
                        },
                        "value": "Project"
                    },
                    {
                        "attribute": {
                            "name": "Type of population"
                        },
                        "value": "General Population"
                    },
                    {
                        "attribute": {
                            "name": "Reason For Intervention"
                        },
                        "value": "Access to health care"
                    },
                    {
                        "attribute": {
                            "name": "Location"
                        },
                        "value": "Northern Bar El Ghazal"
                    }
                ],
                "id": "xyz",
                "name": "Aweil - SS153",
                "openingDate": "2007-12-31",
                "parent": {
                    "id": "a18da381f7d",
                    "name": "SOUDAN Sud"
                }
            };
            pivotTables = [{
                "name": "[FieldApp - ProjectReport] 2 Hospitalization",
                "id": "prEqldr6Juk",
                "sortOrder": 0,
                "columns": [
                {
                    "dimension": "pe",
                    "items": [
                        {
                            "name": "LAST_12_MONTHS",
                            "id": "LAST_12_MONTHS"
                        }
                    ]
                }
            ],
                "filters": [
                {
                    "dimension": "ou",
                    "items": [
                        {
                            "name": "Aweil - SS153",
                            "id": "a3f1fcbc237"
                        }
                    ]
                }
            ],
                "rows": [
                {
                    "dimension": "dx",
                    "items": [
                        {
                            "name": "Average bed occupation rate (%) - Adult IPD Ward",
                            "id": "adf6cf9405c"
                        },
                        {
                            "name": "Average length of bed use (days) - Adult IPD Ward",
                            "id": "ae70aadc5cf"
                        }
                    ]
                }
            ],
                "categoryDimensions": [],
                "sortAscending": false,
                "sortDescending": false,
                "sortable": false,
                "dataSetCode": "ProjectReport"
        }, {
                    id: "xVYnmknNChg",
                    name: "[FieldApp - AdultIPDWard] Previous 12 weeks of all cases"
            }];
            data = {
                "headers": [{
                    "name": "dx",
                    "column": "Data"
                }, {
                    "name": "pe",
                    "column": "Period"
                }, {
                    "name": "value",
                    "column": "Value"
                }],
                "metaData": {
                    "names": {
                        "201511": "November 2015",
                        "201512": "December 2015",
                        "adf6cf9405c": "Average bed occupation rate (%) - Adult IPD Ward",
                        "ae70aadc5cf": "Average length of bed use (days) - Adult IPD Ward",
                        "dx": "Data",
                        "pe": "Period"
                    },
                    "dx": [
                        "adf6cf9405c",
                        "ae70aadc5cf"
                    ],
                    "pe": [
                        "201511",
                        "201512"
                    ]
                },
                "rows": [
                    ["adf6cf9405c", "201511", "1.1"],
                    ["adf6cf9405c", "201512", "1.2"],
                    ["ae70aadc5cf", "201511", "2.1"],
                    ["ae70aadc5cf", "201512", "2.2"]
                ],
                "height": 132,
                "width": 3
            };

            scope.resourceBundle = {
                projectInformationLabel: "Project Information"
            };

            orgUnitRepository = new OrgUnitRepository();
            pivotTableRepository = new PivotTableRepository();
            spyOn(orgUnitRepository, "get").and.returnValue(utils.getPromise($q, projectBasicInfo));
            spyOn(pivotTableRepository, "getAll").and.returnValue(utils.getPromise($q, pivotTables));
            spyOn(pivotTableRepository, "getDataForPivotTable").and.returnValue(utils.getPromise($q, data));

            projectReportController = new ProjectReportController(rootScope, $q, scope, orgUnitRepository, pivotTableRepository);
        }));

        it("should get csv file name in expected format", function() {
            expect(scope.getCsvFileName()).toEqual("Aweil - SS153_ProjectReport_29-Oct-2015.csv");
        });

        it('should get data for csv file', function() {
            var expectedData = [
                ['Project Information'],
                ['Country', 'SOUDAN Sud'],
                ['Name', 'Aweil - SS153'],
                ['Project Code', 'SS153'],
                ['Project Type', 'Regular Project'],
                ['Context', 'Cross-border instability'],
                ['Type of population', 'General Population'],
                ['Reason For Intervention', 'Access to health care'],
                ['Mode Of Operation', 'Direct operation'],
                ['Model Of Management', 'Collaboration'],
                ['Opening Date', '12/31/2007'],
                ['End Date', ''],
                [],
                ['Hospitalization', ['November 2015'],
                    ['December 2015']
                ],
                ['Average bed occupation rate (%) - Adult IPD Ward', '1.1', '1.2'],
                ['Average length of bed use (days) - Adult IPD Ward', '2.1', '2.2'],
                []
            ];
            scope.$apply();
            scope.pivotTables[0].dataDimensionItems = ["adf6cf9405c", "ae70aadc5cf"];
            expect(scope.getData()).toEqual(expectedData);
        });

        it('should get table name if it is present', function() {
            var tableName = '[FieldApp - ProjectReport] 1 Consultations';
            expect(scope.getTableName(tableName)).toEqual("Consultations");
        });

        it('should get empty string if table name is not present', function() {
            var tableName = '[FieldApp - ProjectReport]';
            expect(scope.getTableName(tableName)).toEqual("");
        });

        it('should filter out project report tables from pivot tables', function() {
            scope.$apply();
            expect(scope.pivotTables[0].table).toEqual(pivotTables[0]);
            expect(scope.pivotTables[0].data).toEqual(data);
        });

        it("should add the projectAttributes which lists all the project basic info into the scope", function() {
            var expectedProjectAttributes = [
                {
                    name: "Country",
                    value: "SOUDAN Sud"
                }, {
                    name: "Name",
                    value: "Aweil - SS153"
                }, {
                    name: 'Project Code',
                    value: 'SS153'
                },
                {
                    name: 'Project Type',
                    value: 'Regular Project'
                },
                {
                    name: 'Context',
                    value: 'Cross-border instability'
                },
                {
                    name: 'Type of population',
                    value: 'General Population'
                }, {
                    name: 'Reason For Intervention',
                    value: 'Access to health care'
                },
                {
                    name: 'Mode Of Operation',
                    value: 'Direct operation'
                }, {
                    name: 'Model Of Management',
                    value: 'Collaboration'
                },  {
                    name : "Opening Date",
                    value: "12/31/2007"
                },
                {
                    name : "End Date",
                    value: ""
                }
            ];
            scope.$apply();
            expect(orgUnitRepository.get).toHaveBeenCalledWith("xyz");
            expect(_.isEqual(scope.projectAttributes, expectedProjectAttributes)).toBe(true);
        });
    });
});