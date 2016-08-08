define(["moment", "orgUnitRepository", "angularMocks", "projectReportController", "utils", "pivotTableRepository", "changeLogRepository", "translationsService", "timecop", "orgUnitGroupSetRepository", "filesystemService"],
    function(moment, OrgUnitRepository, mocks, ProjectReportController, utils, PivotTableRepository, ChangeLogRepository, TranslationsService, timecop, OrgUnitGroupSetRepository, FilesystemService) {
    describe("projectReportController", function() {
        var scope, rootScope, q,
            projectReportController,
            orgUnitRepository, pivotTableRepository, changeLogRepository, translationsService, orgUnitGroupSetRepository, filesystemService,
            mockPivotTables, pivotTableData, mockProjectOrgUnit, orgUnitGroupSets, currentTime;

        beforeEach(mocks.inject(function($rootScope, $q) {
            rootScope = $rootScope;
            scope = rootScope.$new();
            q = $q;

            currentTime = moment('2015-10-29T12:43:54.972Z');
            Timecop.install();
            Timecop.freeze(currentTime);

            rootScope.currentUser = {
                selectedProject: {
                    id: "xyz",
                    name: "Aweil - SS153"
                }
            };

            scope.resourceBundle = {
                country: 'Country',
                nameLabel: 'Name',
                projectInformationLabel: 'Project Information',
                projectCodeLabel: 'Project Code',
                projectTypeLabel: 'Project Type',
                contextLabel: 'Context',
                typeOfPopulationLabel: 'Type of population',
                reasonForInterventionLabel: 'Reason For Intervention',
                modeOfOperationLabel: 'Mode Of Operation',
                modelOfManagementLabel: 'Model Of Management',
                openingDateLabel: 'Opening Date',
                endDateLabel: 'End Date'
            };

            mockProjectOrgUnit = {
                "id": "xyz",
                "name": "Aweil - SS153",
                "openingDate": "2007-12-31",
                "parent": {
                    "id": "a18da381f7d",
                    "name": "SOUDAN Sud"
                },
                "attributeValues": [
                    {
                        "attribute": {
                            "name": "Context",
                            "code" : "prjCon"
                        },
                        "value": "Cross-border instability"
                    },
                    {
                        "attribute": {
                            "name": "Project Code",
                            "code": "projCode"
                        },
                        "value": "SS153"
                    },
                    {
                        "attribute": {
                            "name": "Mode Of Operation",
                            "code": "modeOfOperation"
                        },
                        "value": "Direct operation"
                    },
                    {
                        "attribute": {
                            "name": "Project Type",
                            "code": "projectType"
                        },
                        "value": "Regular Project"
                    },
                    {
                        "attribute": {
                            "name": "Model Of Management",
                            "code": "modelOfManagement"
                        },
                        "value": "Collaboration"
                    },
                    {
                        "attribute": {
                            "name": "Type",
                            "code": "Type"
                        },
                        "value": "Project"
                    },
                    {
                        "attribute": {
                            "name": "Type of population",
                            "code": "prjPopType"
                        },
                        "value": "General Population"
                    },
                    {
                        "attribute": {
                            "name": "Reason For Intervention",
                            "code": "reasonForIntervention"
                        },
                        "value": "Access to health care"
                    },
                    {
                        "attribute": {
                            "name": "Location",
                            "code": "prjLoc"
                        },
                        "value": "Northern Bar El Ghazal"
                    }
                ]
            };

            mockPivotTables = [{
                id: 'pivotTable1',
                projectReport: true,
                title: 'Hospitalization',
                rows: [{
                    items: [{
                        id: 'adf6cf9405c',
                        name: 'Average bed occupation rate (%) - Adult IPD Ward'
                    }, {
                        id: 'ae70aadc5cf',
                        name: 'Average length of bed use (days) - Adult IPD Ward'
                    }]
                }]
            }, {
                id: 'pivotTable2',
                projectReport: false
            }];

            pivotTableData = {
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

            orgUnitGroupSets = [{
                "code": "project_type",
                "id": "D6yNgLkqIKR",
                "name": "Project Type",
                "organisationUnitGroups": [{
                    "id": "koFDuOVZsoU",
                    "name": "Regular Project"
                }, {
                    "id": "vxKtTBwL2S2",
                    "name": "Emergency Project"
                }, {
                    "id": "I97gskdFUWe",
                    "name": "Vaccination Campaign"
                }]
            }, {
                "code": "model_of_management",
                "id": "a2d4a1dee27",
                "name": "Model Of Management",
                "organisationUnitGroups": [{
                    "id": "aa9a24c9126",
                    "name": "MSF Management"
                }, {
                    "id": "a11a7a5d55a",
                    "name": "Collaboration"
                }]
            }, {
                "code": "context",
                "id": "a5c18ef7277",
                "name": "Context",
                "organisationUnitGroups": [{
                    "id": "a16b4a97ce4",
                    "name": "Post-conflict"
                }, {
                    "id": "ac606ebc28f",
                    "name": "Internal Instability"
                }, {
                    "id": "abfef86a4b6",
                    "name": "Cross-border instability"
                }, {
                    "id": "af40faf6384",
                    "name": "Stable"
                }]
            }, {
                "code": "reason_for_intervention",
                "id": "a86f66f29d4",
                "name": "Reason For Intervention",
                "organisationUnitGroups": [{
                    "id": "ab4b1006371",
                    "name": "Armed Conflict"
                }, {
                    "id": "a9e29c075cc",
                    "name": "Epidemic"
                }, {
                    "id": "a8014cfca5c",
                    "name": "Natural Disaster"
                }, {
                    "id": "a559915efe5",
                    "name": "Access to health care"
                }]
            }, {
                "code": "type_of_population",
                "id": "a8a579d5fab",
                "name": "Type of Population",
                "organisationUnitGroups": [{
                    "id": "a35778ed565",
                    "name": "Most-at-risk Population"
                }, {
                    "id": "afbdf5ffe08",
                    "name": "General Population"
                }, {
                    "id": "a48f665185e",
                    "name": "Refugee"
                }, {
                    "id": "a969403a997",
                    "name": "Internally Displaced People"
                }]
            }, {
                "code": "mode_of_operation",
                "id": "a9ca3d1ed93",
                "name": "Mode Of Operation",
                "organisationUnitGroups": [{
                    "id": "a92cee050b0",
                    "name": "Remote operation"
                }, {
                    "id": "a560238bc90",
                    "name": "Direct operation"
                }]
            }];

            orgUnitRepository = new OrgUnitRepository();
            spyOn(orgUnitRepository, "get").and.returnValue(utils.getPromise($q, mockProjectOrgUnit));

            pivotTableRepository = new PivotTableRepository();
            spyOn(pivotTableRepository, "getAll").and.returnValue(utils.getPromise($q, mockPivotTables));
            spyOn(pivotTableRepository, "getDataForPivotTable").and.returnValue(utils.getPromise($q, pivotTableData));

            changeLogRepository = new ChangeLogRepository();
            spyOn(changeLogRepository, 'get').and.returnValue(utils.getPromise($q, {}));

            translationsService = new TranslationsService();
            spyOn(translationsService, "translateReports").and.callFake(function(object) { return object; });
            spyOn(translationsService, 'translate').and.callFake(function(object) { return object; });

            orgUnitGroupSetRepository = new OrgUnitGroupSetRepository();
            spyOn(orgUnitGroupSetRepository, 'getAll').and.returnValue(utils.getPromise(q, orgUnitGroupSets));

            filesystemService = new FilesystemService();
            spyOn(filesystemService, 'promptAndWriteFile').and.returnValue(utils.getPromise(q, {}));

            projectReportController = new ProjectReportController(rootScope, q, scope, orgUnitRepository, pivotTableRepository, changeLogRepository, translationsService, orgUnitGroupSetRepository, filesystemService);
        }));

        afterEach(function () {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        describe('CSV Export', function () {
            var csvContent;

            beforeEach(function () {
                scope.$apply();
                scope.pivotTables[0].currentOrderOfItems = ["adf6cf9405c", "ae70aadc5cf"];
                
                spyOn(window, 'Blob').and.callFake(function (contentArray) {
                    this.value = contentArray.join();
                });

                filesystemService.promptAndWriteFile.and.callFake(function (fileName, blob) {
                    csvContent = blob.value;
                });

                scope.exportToCSV();
            });
            
            it('should prompt the user to save the CSV file with suggested filename', function () {
                var expectedFilename = 'Aweil - SS153.ProjectReport.' + currentTime.format('DD-MMM-YYYY') + '.csv';
                expect(filesystemService.promptAndWriteFile).toHaveBeenCalledWith(expectedFilename, jasmine.any(Blob), filesystemService.FILE_TYPE_OPTIONS.CSV);
            });

            describe('CSV contents', function () {
                it('should contain project basic information', function () {
                    expect(csvContent).toContain('"Project Information"\n"Country","SOUDAN Sud"');
                });

                it('should contain pivot table headers', function () {
                    expect(csvContent).toContain('"Hospitalization","November 2015","December 2015"');
                });

                it('should contain pivot table data', function () {
                    expect(csvContent).toContain('"Average bed occupation rate (%) - Adult IPD Ward",1.1,1.2\n"Average length of bed use (days) - Adult IPD Ward",2.1,2.2');
                });
            });
        });

        it('should filter out project report tables from pivot tables', function() {
            scope.$apply();
            expect(scope.pivotTables[0].definition).toEqual(mockPivotTables[0]);
            expect(scope.pivotTables[0].data).toEqual(pivotTableData);
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
                    value: new Date("12/31/2007").toLocaleDateString()
                },
                {
                    name : "End Date",
                    value: ""
                }
            ];

            scope.$apply();
            expect(orgUnitRepository.get).toHaveBeenCalledWith("xyz");
            expect(scope.projectAttributes).toEqual(expectedProjectAttributes);
        });

        it('should get the lastUpdated', function () {
            var lastUpdatedTime = currentTime, projectId = rootScope.currentUser.selectedProject.id,
            CHART_LAST_UPDATED_TIME_FORMAT = "D MMMM[,] YYYY HH[:]mm A";
            changeLogRepository.get.and.returnValue(utils.getPromise(q, lastUpdatedTime));
            scope.$apply();
            expect(changeLogRepository.get).toHaveBeenCalledWith('monthlyPivotTableData:' + projectId);
            expect(scope.lastUpdatedTimeForProjectReport).toEqual(moment(lastUpdatedTime).format(CHART_LAST_UPDATED_TIME_FORMAT));
        });
    });
});
