define(['downloadChartsConsumer', 'angularMocks', 'utils', 'timecop', 'reportService', 'chartRepository', 'userPreferenceRepository', 'datasetRepository', 'changeLogRepository'],
    function(DownloadChartsConsumer, mocks, utils, timecop, ReportService, ChartRepository, UserPreferenceRepository, DatasetRepository, ChangeLogRepository) {

        describe('Download Charts Consumer', function() {
            var downloadChartsConsumer, reportService, chartRepository, userPreferenceRepository, datasetRepository, changeLogRepository, scope, q;

            beforeEach(mocks.inject(function($q, $rootScope) {

                scope = $rootScope;
                q = $q;

                datasetRepository = new DatasetRepository();
                spyOn(datasetRepository, 'findAllForOrgUnits').and.returnValue(utils.getPromise(q, {}));

                userPreferenceRepository = new UserPreferenceRepository();
                spyOn(userPreferenceRepository, 'getCurrentProjects').and.returnValue(utils.getPromise(q, []));
                spyOn(userPreferenceRepository, 'getUserModules').and.returnValue(utils.getPromise(q, {}));
                spyOn(userPreferenceRepository, 'getOriginOrgUnitIds').and.returnValue(utils.getPromise(q, {}));

                reportService = new ReportService();
                spyOn(reportService, 'getCharts').and.returnValue(utils.getPromise(q, {}));
                spyOn(reportService, 'getReportDataForOrgUnit').and.returnValue(utils.getPromise(q, {}));

                chartRepository = new ChartRepository();
                spyOn(chartRepository, 'upsert').and.returnValue(utils.getPromise(q, {}));
                spyOn(chartRepository, 'upsertChartData').and.returnValue(utils.getPromise(q, {}));
                spyOn(chartRepository, 'deleteMultipleChartsById').and.returnValue(utils.getPromise(q, {}));
                spyOn(chartRepository, 'getAll').and.returnValue(utils.getPromise(q, {}));

                changeLogRepository = new ChangeLogRepository();
                spyOn(changeLogRepository, 'get').and.returnValue(utils.getPromise(q, '2014-09-30T11:00:00.000Z'));
                spyOn(changeLogRepository, 'upsert').and.returnValue(utils.getPromise(q, {}));

                Timecop.install();
                Timecop.freeze(new Date('2014-10-01T12:00:00.000Z'));

                downloadChartsConsumer = new DownloadChartsConsumer(reportService, chartRepository, userPreferenceRepository, datasetRepository, changeLogRepository, $q);
            }));

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            it('should download all field app charts definitions for relevant datasets for modules and origins', function() {
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

                var chartsFromDb = [{
                    "id": "chart1",
                    "name": "[FieldApp - GeneralIPDWard] Admission by Old Age Group",
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
                }];

                var userProjects = ["prj1", "prj2"];

                var userModules = [{
                    "name": "Mod1",
                    "id": "Mod1",
                    "children": [{
                        "id": "origin1"
                    }]
                }, {
                    "name": "Mod2",
                    "id": "Mod2",
                    "children": [{
                        "id": "origin2"
                    }]
                }];

                var originIds = ["origin1", "origin2"];

                userPreferenceRepository.getCurrentProjects.and.returnValue(utils.getPromise(q, userProjects));
                userPreferenceRepository.getUserModules.and.returnValue(utils.getPromise(q, userModules));
                userPreferenceRepository.getOriginOrgUnitIds.and.returnValue(utils.getPromise(q, originIds));
                datasetRepository.findAllForOrgUnits.and.returnValue(utils.getPromise(q, datasetsAssociatedWithUserModules));
                reportService.getCharts.and.returnValue(utils.getPromise(q, fieldAppCharts));
                chartRepository.upsert.and.returnValue(utils.getPromise(q, fieldAppCharts));
                chartRepository.getAll.and.returnValue(utils.getPromise(q, chartsFromDb));
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

                downloadChartsConsumer.run();
                scope.$apply();

                expect(userPreferenceRepository.getUserModules).toHaveBeenCalled();
                expect(changeLogRepository.get).toHaveBeenCalledWith('charts:prj1;prj2');
                expect(datasetRepository.findAllForOrgUnits).toHaveBeenCalledWith(['Mod1', 'Mod2', "origin1", "origin2"]);
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
                expect(changeLogRepository.upsert).toHaveBeenCalledWith('charts:prj1;prj2', '2014-10-01T12:00:00.000Z');
                expect(chartRepository.getAll).toHaveBeenCalled();
                expect(chartRepository.deleteMultipleChartsById).toHaveBeenCalledWith(["chart1"], chartsFromDb);
            });

            it('should continue download of charts even if one call fails', function() {
                var datasetsAssociatedWithUserModules = [{
                    "id": "ds1",
                    "name": "Out Patient Department - General"
                }];

                var fieldAppCharts = [{
                    "id": "chart2",
                    "name": "[FieldApp - OutPatientDepartmentGeneral] Total Consultations",
                    "dataElements": [{
                        "id": "de2",
                        "name": "New Consultations - Consultations - Out Patient Department - General"
                    }]
                }];

                var userProjects = ["prj1", "prj2"];

                var userModules = [{
                    "name": "Mod1",
                    "id": "Mod1"
                }, {
                    "name": "Mod2",
                    "id": "Mod2"
                }, {
                    "name": "Mod3",
                    "id": "Mod3"
                }];

                userPreferenceRepository.getCurrentProjects.and.returnValue(utils.getPromise(q, userProjects));
                userPreferenceRepository.getUserModules.and.returnValue(utils.getPromise(q, userModules));
                userPreferenceRepository.getOriginOrgUnitIds.and.returnValue(utils.getPromise(q, []));
                datasetRepository.findAllForOrgUnits.and.returnValue(utils.getPromise(q, datasetsAssociatedWithUserModules));
                reportService.getCharts.and.returnValue(utils.getPromise(q, fieldAppCharts));
                chartRepository.upsert.and.returnValue(utils.getPromise(q, fieldAppCharts));
                reportService.getReportDataForOrgUnit.and.callFake(function(chart, modId) {
                    if (chart === fieldAppCharts[0] && modId === "Mod1")
                        return utils.getPromise(q, "data1");
                    if (chart === fieldAppCharts[0] && modId === "Mod2")
                        return utils.getRejectedPromise(q, {});
                    if (chart === fieldAppCharts[0] && modId === "Mod3")
                        return utils.getPromise(q, "data3");
                });
                chartRepository.upsertChartData.and.returnValue(utils.getPromise(q, []));

                downloadChartsConsumer.run();
                scope.$apply();

                expect(userPreferenceRepository.getUserModules).toHaveBeenCalled();
                expect(changeLogRepository.get).toHaveBeenCalledWith('charts:prj1;prj2');
                expect(datasetRepository.findAllForOrgUnits).toHaveBeenCalledWith(['Mod1', 'Mod2', 'Mod3']);
                expect(reportService.getCharts).toHaveBeenCalledWith(datasetsAssociatedWithUserModules);
                expect(chartRepository.upsert).toHaveBeenCalledWith(fieldAppCharts);
                expect(reportService.getReportDataForOrgUnit).toHaveBeenCalledWith(fieldAppCharts[0], 'Mod1');
                expect(reportService.getReportDataForOrgUnit).toHaveBeenCalledWith(fieldAppCharts[0], 'Mod2');
                expect(reportService.getReportDataForOrgUnit).toHaveBeenCalledWith(fieldAppCharts[0], 'Mod3');
                expect(chartRepository.upsertChartData).toHaveBeenCalledWith("[FieldApp - OutPatientDepartmentGeneral] Total Consultations", "Mod1", "data1");
                expect(chartRepository.upsertChartData).not.toHaveBeenCalledWith("[FieldApp - OutPatientDepartmentGeneral] Total Consultations", "Mod2", "data2");
                expect(chartRepository.upsertChartData).toHaveBeenCalledWith("[FieldApp - OutPatientDepartmentGeneral] Total Consultations", "Mod3", "data3");
            });

            it('should exit if user module is empty', function() {
                downloadChartsConsumer.run();
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

                downloadChartsConsumer.run();
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
