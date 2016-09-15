define(['utils', 'timecop', 'angularMocks', 'lodash', 'dateUtils', 'downloadHistoricalDataConsumer', 'dataService', 'userPreferenceRepository', 'orgUnitRepository', 'datasetRepository', 'changeLogRepository', 'dataRepository'],
    function (utils, timecop, mocks, _, dateUtils, DownloadHistoricalDataConsumer, DataService, UserPreferenceRepository, OrgUnitRepository, DatasetRepository, ChangeLogRepository, DataRepository) {
        describe('DownloadHistoricalDataConsumer', function () {
            var scope, q, downloadHistoricalDataConsumer, dataService, userPreferenceRepository, orgUnitRepository,
                datasetRepository, dataRepository, changeLogRepository, mockProjectIds, mockModulesForProjectA, mockModulesForProjectB,
                mockOrigins, mockDataSets, mockPeriodRange, periodChunkSize, payload;

            beforeEach(mocks.inject(function ($q, $rootScope) {
                q = $q;
                scope = $rootScope.$new();

                mockProjectIds = ['projectA', 'projectB'];
                mockModulesForProjectA = [{id: 'moduleA'}];
                mockModulesForProjectB = [{id: 'moduleB'}, {id: 'moduleC'}];
                mockOrigins = [{id: 'originA'}, {id: 'originB'}];
                mockDataSets = [{id: 'dataSetA'}, {id: 'dataSetB'}];
                payload = ['somePayload'];

                mockPeriodRange = [
                    '2016W21', '2016W22', '2016W23', '2016W24', '2016W25', '2016W26', '2016W27', '2016W28', '2016W29', '2016W30',
                    '2016W31', '2016W32', '2016W33'
                ];
                periodChunkSize = 10;

                spyOn(dateUtils, 'getPeriodRangeBetween').and.returnValue(mockPeriodRange);

                userPreferenceRepository = UserPreferenceRepository();
                spyOn(userPreferenceRepository, 'getCurrentUsersProjectIds').and.returnValue(utils.getPromise(q, mockProjectIds));

                dataService = new DataService();
                spyOn(dataService, 'downloadData').and.returnValue(utils.getPromise(q, payload));

                orgUnitRepository = new OrgUnitRepository();
                spyOn(orgUnitRepository, 'getAllModulesInOrgUnits').and.callFake(function (projectId) {
                    if (projectId == mockProjectIds[0]) return utils.getPromise(q, mockModulesForProjectA);
                    if (projectId == mockProjectIds[1]) return utils.getPromise(q, mockModulesForProjectB);
                });
                spyOn(orgUnitRepository, 'findAllByParent').and.returnValue(utils.getPromise(q, mockOrigins));

                datasetRepository = new DatasetRepository();
                spyOn(datasetRepository, 'findAllForOrgUnits').and.returnValue(utils.getPromise(q, mockDataSets));

                changeLogRepository = new ChangeLogRepository();
                spyOn(changeLogRepository, 'upsert');
                spyOn(changeLogRepository, 'get').and.callFake(function (key) {
                    var changeLogs = {
                        'yearlyDataValues:projectA:moduleA': utils.getPromise(q, undefined),
                        'yearlyDataValues:projectB:moduleB': utils.getPromise(q, 'someLastUpdatedTime'),
                        'yearlyDataValues:projectB:moduleC': utils.getPromise(q, undefined)
                    };
                    return changeLogs[key];
                });

                dataRepository = new DataRepository();
                spyOn(dataRepository, 'saveDhisData').and.returnValue(utils.getPromise(q, {}));

                downloadHistoricalDataConsumer = new DownloadHistoricalDataConsumer(q, dataService, userPreferenceRepository, orgUnitRepository, datasetRepository, changeLogRepository, dataRepository);

                downloadHistoricalDataConsumer.run();
                scope.$apply();
            }));

            it('should get the current users project ids', function () {
                expect(userPreferenceRepository.getCurrentUsersProjectIds).toHaveBeenCalled();
            });

            it('should get the modules for current user projects', function () {
                expect(orgUnitRepository.getAllModulesInOrgUnits.calls.count()).toEqual(mockProjectIds.length);
                expect(orgUnitRepository.getAllModulesInOrgUnits.calls.argsFor(0)[0]).toEqual(mockProjectIds[0]);
                expect(orgUnitRepository.getAllModulesInOrgUnits.calls.argsFor(1)[0]).toEqual(mockProjectIds[1]);
            });

            it('should get all the origins under a module', function () {
                expect(orgUnitRepository.findAllByParent.calls.count()).toEqual(mockModulesForProjectA.concat(mockModulesForProjectB).length);
                expect(orgUnitRepository.findAllByParent.calls.argsFor(0)[0]).toEqual([mockModulesForProjectA[0].id]);
                expect(orgUnitRepository.findAllByParent.calls.argsFor(1)[0]).toEqual([mockModulesForProjectB[0].id]);
                expect(orgUnitRepository.findAllByParent.calls.argsFor(2)[0]).toEqual([mockModulesForProjectB[1].id]);
            });

            it('should get all the datasets for the given orgunits', function () {
                var originIds = _.map(mockOrigins, 'id');
                var mockModulesForProjectAIds = _.map(mockModulesForProjectA, 'id');
                var orgUnitIds = mockModulesForProjectAIds.concat(originIds);
                expect(datasetRepository.findAllForOrgUnits).toHaveBeenCalledWith(orgUnitIds);
            });

            describe('download data values', function () {
                var dataSetIds;

                beforeEach(function () {
                    dataSetIds = _.map(mockDataSets, 'id');
                });

                it('should download data values', function () {
                    expect(dataService.downloadData).toHaveBeenCalledWith(mockModulesForProjectA[0].id, dataSetIds, jasmine.any(Array));
                });

                it('should not download data values if it were already downloaded', function () {
                    expect(dataService.downloadData).not.toHaveBeenCalledWith(mockModulesForProjectB[0].id, dataSetIds, jasmine.any(Array));
                    expect(dataService.downloadData).toHaveBeenCalledWith(mockModulesForProjectB[1].id, dataSetIds, jasmine.any(Array));
                });

                it('should download the data in chunks of periods for each module', function () {
                    var periodChunks = _.chunk(mockPeriodRange, periodChunkSize);
                    expect(dataService.downloadData).toHaveBeenCalledWith(mockModulesForProjectA[0].id, dataSetIds, periodChunks[0]);
                    expect(dataService.downloadData).toHaveBeenCalledWith(mockModulesForProjectA[0].id, dataSetIds, periodChunks[1]);
                });

                it('should upsert the datavalues into IndexedDB after downloading data values', function () {
                    expect(dataRepository.saveDhisData).toHaveBeenCalledWith(payload);
                });

                it('should update the change log after upserting to IndexedDB', function () {
                    expect(changeLogRepository.upsert).toHaveBeenCalledWith('yearlyDataValues:projectA:moduleA', jasmine.any(String));
                    expect(changeLogRepository.upsert).not.toHaveBeenCalledWith('yearlyDataValues:projectB:moduleB', jasmine.any(String));
                });
            });
        });
    });