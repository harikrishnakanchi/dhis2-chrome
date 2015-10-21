define(['downloadReportsConsumer', 'angularMocks', 'utils', 'timecop', 'reportService', 'chartRepository', 'pivotTableRepository', 'userPreferenceRepository', 'datasetRepository', 'changeLogRepository'],
    function(DownloadReportsConsumer, mocks, utils, timecop, ReportService, ChartRepository, PivotTableRepository, UserPreferenceRepository, DatasetRepository, ChangeLogRepository) {

        describe('Download Reports Consumer', function() {
            var downloadReportsConsumer, reportService, chartRepository, userPreferenceRepository, datasetRepository, changeLogRepository, scope, q;

            beforeEach(mocks.inject(function($q, $rootScope) {

                scope = $rootScope;
                q = $q;

                datasetRepository = new DatasetRepository();
                spyOn(datasetRepository, 'findAllForOrgUnits').and.returnValue(utils.getPromise(q, {}));

                userPreferenceRepository = new UserPreferenceRepository();
                spyOn(userPreferenceRepository, 'getCurrentProjects').and.returnValue(utils.getPromise(q, {}));
                spyOn(userPreferenceRepository, 'getUserModules').and.returnValue(utils.getPromise(q, {}));

                reportService = new ReportService();
                spyOn(reportService, 'getCharts').and.returnValue(utils.getPromise(q, {}));
                spyOn(reportService, 'getPivotTables').and.returnValue(utils.getPromise(q, {}));
                spyOn(reportService, 'getReportDataForOrgUnit').and.returnValue(utils.getPromise(q, {}));

                chartRepository = new ChartRepository();
                spyOn(chartRepository, 'upsert').and.returnValue(utils.getPromise(q, {}));
                spyOn(chartRepository, 'upsertChartData').and.returnValue(utils.getPromise(q, {}));

                pivotTableRepository = new PivotTableRepository();
                spyOn(pivotTableRepository, 'upsert').and.returnValue(utils.getPromise(q, {}));
                spyOn(pivotTableRepository, 'upsertPivotTableData').and.returnValue(utils.getPromise(q, {}));

                changeLogRepository = new ChangeLogRepository();
                spyOn(changeLogRepository, 'get').and.returnValue(utils.getPromise(q, '2014-09-30T11:00:00.000Z'));
                spyOn(changeLogRepository, 'upsert').and.returnValue(utils.getPromise(q, {}));

                Timecop.install();
                Timecop.freeze(new Date('2014-10-01T12:00:00.000Z'));

                downloadReportsConsumer = new DownloadReportsConsumer(reportService, chartRepository, pivotTableRepository, userPreferenceRepository, datasetRepository, changeLogRepository, $q);
            }));

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            it('should download all field app tables', function() {
                var fieldAppPivotTables = [{
                    "id": "table1",
                    "name": "Field App - Nutrition Monthly Pediatric",
                    "someAttribute": "someValue"
                }];


                userPreferenceRepository.getUserModules.and.returnValue(utils.getPromise(q, [{
                    "id": "mod1"
                }]));
                datasetRepository.findAllForOrgUnits.and.returnValue(utils.getPromise(q, [{
                    "id": "ds1"
                }]));

                reportService.getPivotTables.and.returnValue(utils.getPromise(q, fieldAppPivotTables));
                reportService.getReportDataForOrgUnit.and.returnValue(utils.getPromise(q, [{
                    "id": "id12"
                }]));
                pivotTableRepository.upsert.and.returnValue(utils.getPromise(q, fieldAppPivotTables));

                downloadReportsConsumer.run();
                scope.$apply();

                expect(datasetRepository.findAllForOrgUnits).toHaveBeenCalledWith(["mod1"]);
                expect(reportService.getPivotTables).toHaveBeenCalledWith([{
                    id: 'ds1'
                }]);
                expect(pivotTableRepository.upsert).toHaveBeenCalledWith(fieldAppPivotTables);
                expect(reportService.getReportDataForOrgUnit).toHaveBeenCalledWith(fieldAppPivotTables[0], "mod1");
                expect(pivotTableRepository.upsertPivotTableData).toHaveBeenCalledWith('Field App - Nutrition Monthly Pediatric', 'mod1', [{
                    id: 'id12'
                }]);
            });

            it('should download all field app charts definitions for relevant datasets', function() {
                var datasetsAssociatedWithUserModules = [{
                    "id": "ds1",
                    "name": "Out Patient Department - General",
                    "shortName": "Out Patient Department - General",
                    "code": "OutPatientDepartmentGeneral"
                }, {
                    "id": "ds2",
                    "name": "General IPD Ward",
                    "shortName": "General IPD Ward",
                    "code": "GeneralIPDWard"
                }];

                var fieldAppCharts = [{
                    "id": "chart1",
                    "name": "[FieldApp - GeneralIPDWard] Admission by Age Group",
                    "relativePeriods": {
                        "last12Months": false,
                        "last12Weeks": true
                    },
                    "indicators": [],
                    "dataElements": [{
                        "id": "de1",
                        "name": "New Admission - Emergency Department - Admission - General IPD Ward",
                        "code": "de1"
                    }]
                }, {
                    "id": "chart2",
                    "name": "[FieldApp - OutPatientDepartmentGeneral] Total Consultations",
                    "relativePeriods": {
                        "last12Months": true,
                        "last12Weeks": false
                    },
                    "indicators": [],
                    "dataElements": [{
                        "id": "de2",
                        "name": "New Consultations - Consultations - Out Patient Department - General",
                        "code": "de2"
                    }]
                }];

                var userProjects = [{
                    "id": "prj1"
                }, {
                    "id": "prj2"
                }];

                var userModules = [{
                    "name": "Mod1",
                    "id": "Mod1"
                }, {
                    "name": "Mod2",
                    "id": "Mod2"
                }];

                userPreferenceRepository.getCurrentProjects.and.returnValue(utils.getPromise(q, userProjects));
                userPreferenceRepository.getUserModules.and.returnValue(utils.getPromise(q, userModules));
                datasetRepository.findAllForOrgUnits.and.returnValue(utils.getPromise(q, datasetsAssociatedWithUserModules));
                reportService.getCharts.and.returnValue(utils.getPromise(q, fieldAppCharts));
                chartRepository.upsert.and.returnValue(utils.getPromise(q, fieldAppCharts));
                reportService.getReportDataForOrgUnit.and.callFake(function(chart, modId) {
                    if (chart === fieldAppCharts[0] && modId === "Mod1")
                        return utils.getPromise(q, "data1");
                    if (chart === fieldAppCharts[0] && modId === "Mod2")
                        return utils.getPromise(q, "data2");
                    if (chart === fieldAppCharts[1] && modId === "Mod1")
                        return utils.getPromise(q, "data3");
                    if (chart === fieldAppCharts[1] && modId === "Mod2")
                        return utils.getPromise(q, "data4");
                });
                chartRepository.upsertChartData.and.returnValue(utils.getPromise(q, []));

                downloadReportsConsumer.run();
                scope.$apply();

                expect(userPreferenceRepository.getUserModules).toHaveBeenCalled();
                expect(changeLogRepository.get).toHaveBeenCalledWith('reports:prj1;prj2');
                expect(datasetRepository.findAllForOrgUnits).toHaveBeenCalledWith(['Mod1', 'Mod2']);
                expect(reportService.getCharts).toHaveBeenCalledWith(datasetsAssociatedWithUserModules);
                expect(chartRepository.upsert).toHaveBeenCalledWith(fieldAppCharts);
                expect(reportService.getReportDataForOrgUnit).toHaveBeenCalledWith(fieldAppCharts[0], 'Mod1');
                expect(reportService.getReportDataForOrgUnit).toHaveBeenCalledWith(fieldAppCharts[0], 'Mod2');
                expect(reportService.getReportDataForOrgUnit).toHaveBeenCalledWith(fieldAppCharts[1], 'Mod1');
                expect(reportService.getReportDataForOrgUnit).toHaveBeenCalledWith(fieldAppCharts[1], 'Mod2');
                expect(chartRepository.upsertChartData).toHaveBeenCalledWith("[FieldApp - GeneralIPDWard] Admission by Age Group", "Mod1", "data1");
                expect(chartRepository.upsertChartData).toHaveBeenCalledWith("[FieldApp - OutPatientDepartmentGeneral] Total Consultations", "Mod1", "data3");
                expect(chartRepository.upsertChartData).toHaveBeenCalledWith("[FieldApp - GeneralIPDWard] Admission by Age Group", "Mod2", "data2");
                expect(chartRepository.upsertChartData).toHaveBeenCalledWith("[FieldApp - OutPatientDepartmentGeneral] Total Consultations", "Mod2", "data4");
                expect(changeLogRepository.upsert).toHaveBeenCalledWith('reports:prj1;prj2', '2014-10-01T12:00:00.000Z');
            });

            it('should exit if user module is empty', function() {
                downloadReportsConsumer.run();
                scope.$apply();

                expect(userPreferenceRepository.getUserModules).toHaveBeenCalled();
                expect(datasetRepository.findAllForOrgUnits).not.toHaveBeenCalled();
                expect(reportService.getCharts).not.toHaveBeenCalled();
                expect(chartRepository.upsert).not.toHaveBeenCalled();
                expect(reportService.getReportDataForOrgUnit).not.toHaveBeenCalled();
                expect(chartRepository.upsertChartData).not.toHaveBeenCalled();
            });

            it('should exit if reports had already been downloaded for the day', function() {
                changeLogRepository.get.and.returnValue(utils.getPromise(q, '2014-10-01T05:00:00.000Z'));

                downloadReportsConsumer.run();
                scope.$apply();

                expect(userPreferenceRepository.getUserModules).toHaveBeenCalled();
                expect(datasetRepository.findAllForOrgUnits).not.toHaveBeenCalled();
                expect(reportService.getCharts).not.toHaveBeenCalled();
                expect(chartRepository.upsert).not.toHaveBeenCalled();
                expect(reportService.getReportDataForOrgUnit).not.toHaveBeenCalled();
                expect(chartRepository.upsertChartData).not.toHaveBeenCalled();
            });

        });
    });
