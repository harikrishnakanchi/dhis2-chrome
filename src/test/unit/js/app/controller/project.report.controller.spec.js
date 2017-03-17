define(["moment", "orgUnitRepository", "angularMocks", "projectReportController", "utils", "pivotTableRepository", "changeLogRepository", "translationsService", "timecop", "orgUnitGroupSetRepository", "filesystemService", "pivotTableExportBuilder", "excelBuilder"],
    function(moment, OrgUnitRepository, mocks, ProjectReportController, utils, PivotTableRepository, ChangeLogRepository, TranslationsService, timecop, OrgUnitGroupSetRepository, FilesystemService, PivotTableExportBuilder, ExcelBuilder) {
    describe("projectReportController", function() {
        var scope, rootScope, q,
            projectReportController,
            orgUnitRepository, pivotTableRepository, changeLogRepository, translationsService, orgUnitGroupSetRepository, filesystemService, pivotTableExportBuilder,
            mockPivotTables, pivotTableData, mockProjectOrgUnit, orgUnitGroupSets, currentTime, lastUpdatedTime;

        beforeEach(mocks.inject(function($rootScope, $q) {
            rootScope = $rootScope;
            scope = rootScope.$new();
            q = $q;

            currentTime = moment('2015-10-29T12:43:54.972Z');
            Timecop.install();
            Timecop.freeze(currentTime);
            lastUpdatedTime = '2015-10-28T12:43:54.972Z';

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
                endDateLabel: 'End Date',
                updated: 'Updated'
            };

            scope.startLoading = jasmine.createSpy('startLoading');
            scope.stopLoading = jasmine.createSpy('stopLoading');
            scope.locale = 'en';

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
            }, {
                id: 'pivotTable2',
                projectReport: false
            }];

            pivotTableData = {
                some: 'data',
                title: 'someTitle',
                isDataAvailable: true
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
            spyOn(pivotTableRepository, "getPivotTableData").and.returnValue(utils.getPromise($q, pivotTableData));

            changeLogRepository = new ChangeLogRepository();
            spyOn(changeLogRepository, 'get').and.returnValue(utils.getPromise($q, lastUpdatedTime));

            translationsService = new TranslationsService();
            spyOn(translationsService, 'translatePivotTableData').and.callFake(function(object) { return object; });
            spyOn(translationsService, 'translate').and.callFake(function(object) { return object; });

            orgUnitGroupSetRepository = new OrgUnitGroupSetRepository();
            spyOn(orgUnitGroupSetRepository, 'getAll').and.returnValue(utils.getPromise(q, orgUnitGroupSets));

            filesystemService = new FilesystemService();
            spyOn(filesystemService, 'promptAndWriteFile').and.returnValue(utils.getPromise(q, {}));

            pivotTableExportBuilder = new PivotTableExportBuilder();
            spyOn(pivotTableExportBuilder, 'build');

            spyOn(ExcelBuilder, 'createWorkBook').and.returnValue(new Blob());

            projectReportController = new ProjectReportController(rootScope, q, scope, orgUnitRepository, pivotTableRepository, changeLogRepository, translationsService, orgUnitGroupSetRepository, filesystemService, pivotTableExportBuilder);
        }));

        afterEach(function () {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        describe('Excel Export', function () {
            var spreadSheetContent,
                LAST_UPDATED_TIME_FORMAT = "D MMMM YYYY[,] h[:]mm A";

            beforeEach(function () {
                scope.$apply();

                spreadSheetContent = undefined;
                ExcelBuilder.createWorkBook.and.callFake(function (workBookContent) {
                    spreadSheetContent = _.first(workBookContent);
                    return new Blob();
                });
            });
            
            it('should prompt the user to save the Excel file with suggested filename', function () {
                scope.exportToExcel();

                var expectedFilename = 'Aweil - SS153.ProjectReport.[Updated ' + moment(lastUpdatedTime).format(LAST_UPDATED_TIME_FORMAT) + ']';
                expect(filesystemService.promptAndWriteFile).toHaveBeenCalledWith(expectedFilename, jasmine.any(Blob), filesystemService.FILE_TYPE_OPTIONS.XLSX);
            });

            it('should contain project basic information', function () {
                scope.exportToExcel();
                expect(spreadSheetContent.data).toContain(['Project Information']);
                expect(spreadSheetContent.data).toContain(['Country', 'SOUDAN Sud']);
            });

            it('should contain project last downloaded time information', function () {
                scope.exportToExcel();
                expect(spreadSheetContent.data).toContain(['Updated', moment(lastUpdatedTime).format(LAST_UPDATED_TIME_FORMAT)]);
            });

            it('should contain the title of each table', function () {
                scope.exportToExcel();
                expect(spreadSheetContent.data).toContain([pivotTableData.title]);
            });

            it('should contain the results of the pivot table export builder', function () {
                var mockPivotTableExport = ['mockPivotTableExport'];
                pivotTableExportBuilder.build.and.returnValue([mockPivotTableExport]);

                scope.exportToExcel();
                expect(spreadSheetContent.data).toContain(mockPivotTableExport);
            });
        });

        it('should filter out project report tables from pivot tables', function() {
            var projectReportPivotTable = _.find(mockPivotTables, { projectReport: true });
            scope.$apply();

            expect(pivotTableRepository.getPivotTableData).toHaveBeenCalledWith(projectReportPivotTable, rootScope.currentUser.selectedProject.id);
            expect(scope.pivotTables).toEqual([pivotTableData]);
        });

        it('should translate project report table', function () {
            var projectReportPivotTables = _.filter(mockPivotTables, { projectReport: true });
            scope.$apply();

            expect(translationsService.translate).toHaveBeenCalledWith(projectReportPivotTables);
        });

        it('should filter out project report tables without data', function() {
            pivotTableData.isDataAvailable = false;
            scope.$apply();

            expect(scope.pivotTables).toEqual([]);
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

        describe('lastUpdatedTimeForProjectReport', function () {
            it('should get the lastUpdated', function () {
                var projectId = rootScope.currentUser.selectedProject.id,
                    REPORTS_LAST_UPDATED_TIME_FORMAT = "D MMMM YYYY[,] h[:]mm A";

                scope.$apply();
                expect(changeLogRepository.get).toHaveBeenCalledWith('monthlyPivotTableData:' + projectId);
                expect(scope.lastUpdatedTimeForProjectReport).toEqual(moment(lastUpdatedTime).format(REPORTS_LAST_UPDATED_TIME_FORMAT));
            });

            it('should get the lastUpdated when the locale is French', function () {
                var projectId = rootScope.currentUser.selectedProject.id,
                    REPORTS_LAST_UPDATED_TIME_24HR_FORMAT = "D MMMM YYYY[,] HH[h]mm";

                scope.locale = 'fr';
                scope.$apply();
                expect(changeLogRepository.get).toHaveBeenCalledWith('monthlyPivotTableData:' + projectId);
                expect(scope.lastUpdatedTimeForProjectReport).toEqual(moment(lastUpdatedTime).locale(scope.locale).format(REPORTS_LAST_UPDATED_TIME_24HR_FORMAT));
            });
        });
    });
});
