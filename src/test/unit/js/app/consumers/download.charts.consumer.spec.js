define(['downloadChartConsumer', 'angularMocks', 'utils', 'chartService', 'chartRepository', 'userPreferenceRepository', 'datasetRepository'], function (DownloadChartConsumer, mocks, utils, ChartService, ChartRepository, UserPreferenceRepository, DatasetRepository) {

    describe('Download Charts Consumer', function () {
        var downloadChartConsumer, chartService, chartRepository, userPreferenceRepository, datasetRepository, scope, q;

        beforeEach(mocks.inject(function ($q, $rootScope) {

            scope = $rootScope;
            q = $q;

            datasetRepository = new DatasetRepository();
            spyOn(datasetRepository , 'findAllForOrgUnits').and.returnValue(utils.getPromise(q, {}));

            userPreferenceRepository = new UserPreferenceRepository();
            spyOn(userPreferenceRepository, 'getUserModules').and.returnValue(utils.getPromise(q, {}));

            chartService = new ChartService();
            spyOn(chartService, 'getAllFieldAppChartsForDataset').and.returnValue(utils.getPromise(q, {}));
            spyOn(chartService, 'getChartDataForOrgUnit').and.returnValue(utils.getPromise(q, {}));

            chartRepository = new ChartRepository();
            spyOn(chartRepository, 'upsert').and.returnValue(utils.getPromise(q, {}));
            spyOn(chartRepository, 'upsertChartData').and.returnValue(utils.getPromise(q, {}));

            downloadChartConsumer = new DownloadChartConsumer(chartService, chartRepository, userPreferenceRepository, datasetRepository, $q);
        }));

        it('should download all field app charts definitions for relevant datasets', function () {
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

            var userModules = [{
                "name": "Mod1",
                "id": "Mod1"
            }, {
                "name": "Mod2",
                "id": "Mod2"
            }];
            userPreferenceRepository.getUserModules.and.returnValue(utils.getPromise(q, userModules));
            datasetRepository.findAllForOrgUnits.and.returnValue(utils.getPromise(q, datasetsAssociatedWithUserModules));
            chartService.getAllFieldAppChartsForDataset.and.returnValue(utils.getPromise(q, fieldAppCharts));
            chartRepository.upsert.and.returnValue(utils.getPromise(q, fieldAppCharts));
            chartService.getChartDataForOrgUnit.and.callFake(function (chart, modId) {
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

            downloadChartConsumer.run();
            scope.$apply();

            expect(userPreferenceRepository.getUserModules).toHaveBeenCalled();
            expect(datasetRepository.findAllForOrgUnits).toHaveBeenCalledWith(['Mod1', 'Mod2']);
            expect(chartService.getAllFieldAppChartsForDataset).toHaveBeenCalledWith(datasetsAssociatedWithUserModules);
            expect(chartRepository.upsert).toHaveBeenCalledWith(fieldAppCharts);
            expect(chartService.getChartDataForOrgUnit).toHaveBeenCalledWith(fieldAppCharts[0], 'Mod1');
            expect(chartService.getChartDataForOrgUnit).toHaveBeenCalledWith(fieldAppCharts[0], 'Mod2');
            expect(chartService.getChartDataForOrgUnit).toHaveBeenCalledWith(fieldAppCharts[1], 'Mod1');
            expect(chartService.getChartDataForOrgUnit).toHaveBeenCalledWith(fieldAppCharts[1], 'Mod2');
            expect(chartRepository.upsertChartData).toHaveBeenCalledWith("[FieldApp - GeneralIPDWard] Admission by Age Group", "Mod1", "data1");
            expect(chartRepository.upsertChartData).toHaveBeenCalledWith("[FieldApp - OutPatientDepartmentGeneral] Total Consultations", "Mod1", "data3");
            expect(chartRepository.upsertChartData).toHaveBeenCalledWith("[FieldApp - GeneralIPDWard] Admission by Age Group", "Mod2", "data2");
            expect(chartRepository.upsertChartData).toHaveBeenCalledWith("[FieldApp - OutPatientDepartmentGeneral] Total Consultations", "Mod2", "data4");

        });

        it('should exit if user module is empty', function () {
            downloadChartConsumer.run();
            scope.$apply();

            expect(userPreferenceRepository.getUserModules).toHaveBeenCalled();
            expect(datasetRepository.findAllForOrgUnits).not.toHaveBeenCalled();
            expect(chartService.getAllFieldAppChartsForDataset).not.toHaveBeenCalled();
            expect(chartRepository.upsert).not.toHaveBeenCalled();
            expect(chartService.getChartDataForOrgUnit).not.toHaveBeenCalled();
            expect(chartRepository.upsertChartData).not.toHaveBeenCalled();
        });

    });
});
