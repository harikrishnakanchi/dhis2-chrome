define(['downloadChartDataConsumer', 'angularMocks', 'utils', 'timecop', 'moment', 'reportService', 'chartRepository', 'userPreferenceRepository', 'datasetRepository', 'changeLogRepository', 'orgUnitRepository'],
    function(DownloadChartDataConsumer, mocks, utils, timecop, moment, ReportService, ChartRepository, UserPreferenceRepository, DatasetRepository, ChangeLogRepository, OrgUnitRepository) {

        describe('Download Chart Data Consumer', function() {
            var downloadChartDataConsumer,
                reportService, chartRepository, userPreferenceRepository, datasetRepository, changeLogRepository, orgUnitRepository,
                scope, q, currentTime;

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
                spyOn(reportService, 'getReportDataForOrgUnit').and.returnValue(utils.getPromise(q, {}));

                chartRepository = new ChartRepository();
                spyOn(chartRepository, 'getAll').and.returnValue(utils.getPromise(q, {}));
                spyOn(chartRepository, 'upsertChartData').and.returnValue(utils.getPromise(q, {}));

                changeLogRepository = new ChangeLogRepository();
                spyOn(changeLogRepository, 'get').and.returnValue(utils.getPromise(q, '2014-09-30T11:00:00.000Z'));
                spyOn(changeLogRepository, 'upsert').and.returnValue(utils.getPromise(q, {}));

                orgUnitRepository = new OrgUnitRepository();
                spyOn(orgUnitRepository, 'findAllByParent').and.returnValue(utils.getPromise(q, {}));

                currentTime = moment('2014-10-01T12:00:00.000Z');
                Timecop.install();
                Timecop.freeze(currentTime.toISOString());

                downloadChartDataConsumer = new DownloadChartDataConsumer(reportService, chartRepository, userPreferenceRepository, datasetRepository, changeLogRepository, orgUnitRepository, $q);
            }));

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            it('should download chart data for charts with relevant datasets for modules and origins', function() {
                var usersProjects = ["prj1", "prj2"];

                var usersModules = [{
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

                var usersOriginIds = ["origin1", "origin2"];

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

                var chartsFromDb = [{
                    "id": "chart1",
                    "name": "[FieldApp - GeneralIPDWard] Admission by Age Group"
                }, {
                    "id": "chart2",
                    "name": "[FieldApp - OutPatientDepartmentGeneral] Total Consultations"
                }];

                userPreferenceRepository.getCurrentProjects.and.returnValue(utils.getPromise(q, usersProjects));
                userPreferenceRepository.getUserModules.and.returnValue(utils.getPromise(q, usersModules));
                userPreferenceRepository.getOriginOrgUnitIds.and.returnValue(utils.getPromise(q, usersOriginIds));
                datasetRepository.findAllForOrgUnits.and.returnValue(utils.getPromise(q, datasetsAssociatedWithUserModules));
                orgUnitRepository.findAllByParent.and.returnValue(utils.getPromise(q, [{'id': 'someOriginId'}]));
                chartRepository.getAll.and.returnValue(utils.getPromise(q, chartsFromDb));
                reportService.getReportDataForOrgUnit.and.callFake(function(chart, moduleId) {
                    if (chart === chartsFromDb[0] && moduleId === "Mod1")
                        return utils.getPromise(q, "data1");
                    if (chart === chartsFromDb[0] && moduleId === "Mod2")
                        return utils.getPromise(q, "data2");
                    if (chart === chartsFromDb[1] && moduleId === "Mod1")
                        return utils.getPromise(q, "data3");
                    if (chart === chartsFromDb[1] && moduleId === "Mod2")
                        return utils.getPromise(q, "data4");
                });

                downloadChartDataConsumer.run();
                scope.$apply();

                expect(userPreferenceRepository.getUserModules).toHaveBeenCalled();
                expect(changeLogRepository.get).toHaveBeenCalledWith('chartData:prj1;prj2');
                expect(datasetRepository.findAllForOrgUnits).toHaveBeenCalledWith(['Mod1', 'someOriginId']);
                expect(datasetRepository.findAllForOrgUnits).toHaveBeenCalledWith(['Mod2', 'someOriginId']);
                expect(chartRepository.getAll).toHaveBeenCalled();
                expect(reportService.getReportDataForOrgUnit).toHaveBeenCalledWith(chartsFromDb[0], 'Mod1');
                expect(reportService.getReportDataForOrgUnit).toHaveBeenCalledWith(chartsFromDb[0], 'Mod2');
                expect(reportService.getReportDataForOrgUnit).toHaveBeenCalledWith(chartsFromDb[1], 'Mod1');
                expect(reportService.getReportDataForOrgUnit).toHaveBeenCalledWith(chartsFromDb[1], 'Mod2');
                expect(chartRepository.upsertChartData).toHaveBeenCalledWith("[FieldApp - GeneralIPDWard] Admission by Age Group", "Mod1", "data1");
                expect(chartRepository.upsertChartData).toHaveBeenCalledWith("[FieldApp - OutPatientDepartmentGeneral] Total Consultations", "Mod1", "data3");
                expect(chartRepository.upsertChartData).toHaveBeenCalledWith("[FieldApp - GeneralIPDWard] Admission by Age Group", "Mod2", "data2");
                expect(chartRepository.upsertChartData).toHaveBeenCalledWith("[FieldApp - OutPatientDepartmentGeneral] Total Consultations", "Mod2", "data4");
                expect(changeLogRepository.upsert).toHaveBeenCalledWith('chartData:prj1;prj2', currentTime.toISOString());
            });

            it('should continue download of charts even if one call fails', function() {
                var usersProjects = ["prj1", "prj2"];

                var usersModules = [{
                    "name": "Mod1",
                    "id": "Mod1"
                }, {
                    "name": "Mod2",
                    "id": "Mod2"
                }, {
                    "name": "Mod3",
                    "id": "Mod3"
                }];

                var datasetsAssociatedWithUsersModules = [{
                    "id": "ds1",
                    "name": "Out Patient Department - General",
                    "code": "OutPatientDepartmentGeneral"
                }];

                var chartsFromDb = [{
                    "id": "chart2",
                    "name": "[FieldApp - OutPatientDepartmentGeneral] Total Consultations"
                }];

                userPreferenceRepository.getCurrentProjects.and.returnValue(utils.getPromise(q, usersProjects));
                userPreferenceRepository.getUserModules.and.returnValue(utils.getPromise(q, usersModules));
                userPreferenceRepository.getOriginOrgUnitIds.and.returnValue(utils.getPromise(q, []));
                datasetRepository.findAllForOrgUnits.and.returnValue(utils.getPromise(q, datasetsAssociatedWithUsersModules));
                chartRepository.getAll.and.returnValue(utils.getPromise(q, chartsFromDb));
                reportService.getReportDataForOrgUnit.and.callFake(function(chart, moduleId) {
                    if (chart === chartsFromDb[0] && moduleId === "Mod1")
                        return utils.getPromise(q, "data1");
                    if (chart === chartsFromDb[0] && moduleId === "Mod2")
                        return utils.getRejectedPromise(q, {});
                    if (chart === chartsFromDb[0] && moduleId === "Mod3")
                        return utils.getPromise(q, "data3");
                });

                downloadChartDataConsumer.run();
                scope.$apply();

                expect(chartRepository.upsertChartData).toHaveBeenCalledWith("[FieldApp - OutPatientDepartmentGeneral] Total Consultations", "Mod1", "data1");
                expect(chartRepository.upsertChartData).not.toHaveBeenCalledWith("[FieldApp - OutPatientDepartmentGeneral] Total Consultations", "Mod2", "data2");
                expect(chartRepository.upsertChartData).toHaveBeenCalledWith("[FieldApp - OutPatientDepartmentGeneral] Total Consultations", "Mod3", "data3");
            });

            it('should not download chart data if user has no modules', function() {
                downloadChartDataConsumer.run();
                scope.$apply();

                expect(userPreferenceRepository.getUserModules).toHaveBeenCalled();
                expect(datasetRepository.findAllForOrgUnits).not.toHaveBeenCalled();
                expect(chartRepository.getAll).not.toHaveBeenCalled();
                expect(reportService.getReportDataForOrgUnit).not.toHaveBeenCalled();
                expect(chartRepository.upsertChartData).not.toHaveBeenCalled();
            });

            it('should not download chart data if it has already been downloaded that same day', function() {
                var usersModules = [{
                    "name": "Mod1",
                    "id": "Mod1"
                }, {
                    "name": "Mod2",
                    "id": "Mod2"
                }, {
                    "name": "Mod3",
                    "id": "Mod3"
                }];

                userPreferenceRepository.getUserModules.and.returnValue(utils.getPromise(q, usersModules));
                changeLogRepository.get.and.returnValue(utils.getPromise(q, currentTime.subtract(1, 'hour').toISOString()));

                downloadChartDataConsumer.run();
                scope.$apply();

                expect(userPreferenceRepository.getUserModules).toHaveBeenCalled();
                expect(datasetRepository.findAllForOrgUnits).not.toHaveBeenCalled();
                expect(chartRepository.getAll).not.toHaveBeenCalled();
                expect(reportService.getReportDataForOrgUnit).not.toHaveBeenCalled();
                expect(chartRepository.upsertChartData).not.toHaveBeenCalled();
            });

        });
    });
