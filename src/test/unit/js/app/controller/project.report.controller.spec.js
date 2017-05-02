define(["moment", "orgUnitRepository", "angularMocks", "dateUtils", "projectReportController", "utils", "orgUnitMapper", "pivotTableRepository", "changeLogRepository",
"translationsService", "timecop", "orgUnitGroupSetRepository", "filesystemService", "pivotTableExportBuilder", "excelBuilder", "customAttributes"],
    function(moment, OrgUnitRepository, mocks, dateUtils, ProjectReportController, utils, orgUnitMapper, PivotTableRepository, ChangeLogRepository,
             TranslationsService, timecop, OrgUnitGroupSetRepository, FilesystemService, PivotTableExportBuilder, ExcelBuilder, customAttributes) {
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
                "openingDate": moment("2007-12-31").toDate(),
                "parent": {
                    "id": "a18da381f7d",
                    "name": "SOUDAN Sud"
                },
                "attributeValues": [
                    {
                        "attribute": {
                            "name": "Project Code",
                            "code": "projCode"
                        },
                        "value": "SS153"
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
                            "name": "Location",
                            "code": "prjLoc"
                        },
                        "value": "Northern Bar El Ghazal"
                    }
                ],
                "organisationUnitGroups": [{
                    "id": 'someOrgUnitGroupId',
                    "organisationUnitGroupSet": {
                        "id": 'someGroupSetId'
                    }
                }]
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
                isDataAvailable: true,
                columnConfigurations: [{}],
                columns: [{}]
            };

            orgUnitGroupSets = [{
                id: 'someGroupSetId',
                name: 'someGroupSetName',
                attributeValues: [{
                    value: 4,
                    attribute: {
                        code: 'groupSetLevel'
                    }
                }],
                organisationUnitGroups: [{
                    id: 'someOrgUnitGroupId',
                    name: 'someOrgUnitGroupName'
                }]
            }, {
                id: 'someOtherGroupSetId',
                name: 'someOtherGroupSetName',
                attributeValues: [{
                    value: 5,
                    attribute: {
                        code: 'groupSetLevel'
                    }
                }]
            }];

            var mockMappedProject = _.merge(mockProjectOrgUnit, {
                orgUnitGroupSets: {
                    'someGroupSetId': {
                        id: 'someOrgUnitGroupId',
                        name: 'someOrgUnitGroupName'
                    }
                },
                location: "Northern Bar El Ghazal",
                projectCode: "SS153"
            });

            spyOn(dateUtils, 'getPeriodRangeInYears').and.returnValue(['old year', 'new year']);

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
            spyOn(orgUnitMapper, 'mapOrgUnitToProject').and.returnValue(mockMappedProject);

            spyOn(customAttributes, 'getAttributeValue').and.callFake(function (attributeValues, code) {
                 return attributeValues[0].value;
            });

            projectReportController = new ProjectReportController(rootScope, q, scope, orgUnitRepository, pivotTableRepository, changeLogRepository, translationsService, orgUnitGroupSetRepository, filesystemService, pivotTableExportBuilder);
        }));

        afterEach(function () {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        describe('Excel Export', function () {
            var spreadSheetContent,
                LAST_UPDATED_TIME_FORMAT = "D MMMM YYYY[,] h[.]mm A";

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

        it('should add organisationUnitGroups which lists project basic info', function () {
            scope.$apply();
            expect(orgUnitMapper.mapOrgUnitToProject).toHaveBeenCalledWith(mockProjectOrgUnit, [orgUnitGroupSets[0]]);
            expect(scope.projectAttributes).toEqual([{
                name: 'Country',
                value: 'SOUDAN Sud'
            },
                {
                name: "Name",
                value: "Aweil - SS153"
            }, {
                name: "Project Code",
                value: "SS153"
            }, {
                name: "Opening Date",
                value: "12/31/2007"
            }, {
                name: "End Date",
                value: ""
            }, {
                    name: "someGroupSetName",
                    value: "someOrgUnitGroupName"
            }]);
        });

        describe('yearlyReport', function () {
            it('should generate last four years', function () {
                expect(dateUtils.getPeriodRangeInYears).toHaveBeenCalledWith(4);

                scope.$apply();
                expect(scope.last4years).toEqual(['new year', 'old year']);
            });

            it('should set current year as selectedYear', function () {
                expect(scope.selectedYear).toEqual('new year');
            });
        });

        describe('lastUpdatedTimeForProjectReport', function () {
            it('should get the lastUpdated', function () {
                var projectId = rootScope.currentUser.selectedProject.id,
                    REPORTS_LAST_UPDATED_TIME_FORMAT = "D MMMM YYYY[,] h[.]mm A";

                scope.$apply();
                expect(changeLogRepository.get).toHaveBeenCalledWith('yearlyPivotTableData:' + projectId);
                expect(scope.lastUpdatedTimeForProjectReport).toEqual(moment(lastUpdatedTime).format(REPORTS_LAST_UPDATED_TIME_FORMAT));
            });

            it('should get the lastUpdated when the locale is French', function () {
                var projectId = rootScope.currentUser.selectedProject.id,
                    REPORTS_LAST_UPDATED_TIME_24HR_FORMAT = "D MMMM YYYY[,] HH[h]mm";

                scope.locale = 'fr';
                scope.$apply();
                expect(changeLogRepository.get).toHaveBeenCalledWith('yearlyPivotTableData:' + projectId);
                expect(scope.lastUpdatedTimeForProjectReport).toEqual(moment(lastUpdatedTime).locale(scope.locale).format(REPORTS_LAST_UPDATED_TIME_24HR_FORMAT));
            });
        });
    });
});
