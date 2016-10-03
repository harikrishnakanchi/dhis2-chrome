define(['utils', 'timecop', 'angularMocks', 'lodash', 'dateUtils', 'properties', 'moment', 'downloadHistoricalDataConsumer', 'dataService',
        'userPreferenceRepository', 'orgUnitRepository', 'dataSetRepository', 'changeLogRepository', 'dataRepository', 'programEventRepository','eventService','customAttributes'],
    function (utils, timecop, mocks, _, dateUtils, properties, moment, DownloadHistoricalDataConsumer, DataService, UserPreferenceRepository,
              OrgUnitRepository, DatasetRepository, ChangeLogRepository, DataRepository, ProgramEventRepository, EventService, CustomAttributes) {
        describe('DownloadHistoricalDataConsumer', function () {
            var scope, q, downloadHistoricalDataConsumer, dataService, eventService, userPreferenceRepository, orgUnitRepository,
                datasetRepository, dataRepository, changeLogRepository, programEventRepository,
                mockOrigins, mockDataSets, mockPeriodRange, periodChunkSize, mockPayload, mockProjectA, mockProjectB, mockModuleA, mockModuleB, mockModuleC;

            beforeEach(mocks.inject(function ($q, $rootScope) {
                q = $q;
                scope = $rootScope.$new();

                mockProjectA = { id: 'projectA' };
                mockProjectB = { id: 'projectB' };
                mockModuleA = { id: 'moduleA' };
                mockModuleB = { id: 'moduleB' };
                mockModuleC = { id: 'moduleC' };
                mockOrigins = [{id: 'originA'}, {id: 'originB'}];
                mockDataSets = [{id: 'dataSetA'}, {id: 'dataSetB'}];
                mockPayload = ['somePayload'];

                properties.projectDataSync.numWeeksToSync = 12;
                Timecop.install();
                Timecop.freeze(moment('2016-09-19'));

                mockPeriodRange = ["2015W39", "2015W40", "2015W41", "2015W42", "2015W43", "2015W44", "2015W45", "2015W46", "2015W47", "2015W48",
                    "2015W49", "2015W50", "2015W51", "2015W52", "2015W53", "2016W01", "2016W02", "2016W03", "2016W04", "2016W05", "2016W06",
                    "2016W07", "2016W08", "2016W09", "2016W10", "2016W11", "2016W12", "2016W13", "2016W14", "2016W15", "2016W16",
                    "2016W17", "2016W18", "2016W19", "2016W20", "2016W21", "2016W22", "2016W23", "2016W24", "2016W25", "2016W26"
                ];
                periodChunkSize = 11;

                userPreferenceRepository = UserPreferenceRepository();
                spyOn(userPreferenceRepository, 'getCurrentUsersProjectIds').and.returnValue(utils.getPromise(q, [mockProjectA.id, mockProjectB.id]));

                dataService = new DataService();
                spyOn(dataService, 'downloadData').and.returnValue(utils.getPromise(q, {}));

                eventService = new EventService();
                spyOn(eventService, 'getEvents').and.returnValue(utils.getPromise(q, {}));

                orgUnitRepository = new OrgUnitRepository();
                spyOn(orgUnitRepository, 'getAllModulesInOrgUnits').and.callFake(function (projectId) {
                    if (projectId == mockProjectA.id) return utils.getPromise(q, [mockModuleA]);
                    if (projectId == mockProjectB.id) return utils.getPromise(q, [mockModuleB, mockModuleC]);
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

                programEventRepository = new ProgramEventRepository();
                spyOn(programEventRepository, 'upsert').and.returnValue(utils.getPromise(q, {}));

                downloadHistoricalDataConsumer = new DownloadHistoricalDataConsumer(q, dataService, eventService, userPreferenceRepository, orgUnitRepository, datasetRepository, changeLogRepository, dataRepository, programEventRepository);
            }));

            afterEach(function () {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            it('should get the current users project ids', function () {
                downloadHistoricalDataConsumer.run();
                scope.$apply();

                expect(userPreferenceRepository.getCurrentUsersProjectIds).toHaveBeenCalled();
            });

            it('should get the modules for current user projects', function () {
                downloadHistoricalDataConsumer.run();
                scope.$apply();

                expect(orgUnitRepository.getAllModulesInOrgUnits.calls.count()).toEqual(2);
                expect(orgUnitRepository.getAllModulesInOrgUnits.calls.argsFor(0)[0]).toEqual(mockProjectA.id);
                expect(orgUnitRepository.getAllModulesInOrgUnits.calls.argsFor(1)[0]).toEqual(mockProjectB.id);
            });

            it('should get all the origins under a module', function () {
                downloadHistoricalDataConsumer.run();
                scope.$apply();

                expect(orgUnitRepository.findAllByParent.calls.count()).toEqual(3);
                expect(orgUnitRepository.findAllByParent.calls.argsFor(0)[0]).toEqual(mockModuleA.id);
                expect(orgUnitRepository.findAllByParent.calls.argsFor(1)[0]).toEqual(mockModuleB.id);
                expect(orgUnitRepository.findAllByParent.calls.argsFor(2)[0]).toEqual(mockModuleC.id);
            });

            it('should get all the datasets for the given orgunits', function () {
                downloadHistoricalDataConsumer.run();
                scope.$apply();

                var orgUnitIds = [mockModuleA.id].concat(_.map(mockOrigins, 'id'));
                expect(datasetRepository.findAllForOrgUnits).toHaveBeenCalledWith(orgUnitIds);
            });

            it('should continue download of historical data even if one module fails', function() {
                changeLogRepository.get.and.returnValue(utils.getPromise(q, undefined));
                dataService.downloadData.and.callFake(function (moduleId) {
                    return moduleId == mockModuleB.id ? utils.getRejectedPromise(q, {}) : utils.getPromise(q, {});
                });

                downloadHistoricalDataConsumer.run();
                scope.$apply();

                expect(changeLogRepository.upsert).toHaveBeenCalledWith('yearlyDataValues:projectA:moduleA', jasmine.any(String));
                expect(changeLogRepository.upsert).not.toHaveBeenCalledWith('yearlyDataValues:projectB:moduleB', jasmine.any(String));
                expect(changeLogRepository.upsert).toHaveBeenCalledWith('yearlyDataValues:projectB:moduleC', jasmine.any(String));
            });

            describe('Download Data', function () {

                describe('Aggregate modules', function () {
                    var dataSetIds;

                    beforeEach(function () {
                        spyOn(CustomAttributes, 'getBooleanAttributeValue').and.returnValue(false);
                        dataService.downloadData.and.returnValue(utils.getPromise(q, mockPayload));
                        dataSetIds = _.map(mockDataSets, 'id');

                        downloadHistoricalDataConsumer.run();
                        scope.$apply();
                    });

                    it('should download data values', function () {
                        expect(dataService.downloadData).toHaveBeenCalledWith(mockModuleA.id, dataSetIds, jasmine.any(Array));
                    });

                    it('should not download data values if it were already downloaded', function () {
                        expect(dataService.downloadData).not.toHaveBeenCalledWith(mockModuleB.id, dataSetIds, jasmine.any(Array));
                        expect(dataService.downloadData).toHaveBeenCalledWith(mockModuleC.id, dataSetIds, jasmine.any(Array));
                    });

                    it('should download the data in chunks of periods for each module', function () {
                        var periodChunks = _.chunk(mockPeriodRange, periodChunkSize);
                        expect(dataService.downloadData).toHaveBeenCalledWith(mockModuleA.id, dataSetIds, periodChunks[0]);
                        expect(dataService.downloadData).toHaveBeenCalledWith(mockModuleA.id, dataSetIds, periodChunks[1]);
                    });

                    it('should upsert the datavalues into IndexedDB after downloading data values', function () {
                        expect(dataRepository.saveDhisData).toHaveBeenCalledWith(mockPayload);
                    });

                    it('should not download events', function () {
                        expect(eventService.getEvents).not.toHaveBeenCalled();
                    });
                });

                describe('LineList modules', function () {
                    beforeEach(function() {
                        spyOn(CustomAttributes, 'getBooleanAttributeValue').and.returnValue(true);
                        eventService.getEvents.and.returnValue(utils.getPromise(q, mockPayload));

                        downloadHistoricalDataConsumer.run();
                        scope.$apply();
                    });

                    it('should not download data values', function () {
                        expect(dataService.downloadData).not.toHaveBeenCalledWith(mockModuleA.id);
                    });

                    it('should download events', function () {
                        expect(eventService.getEvents).toHaveBeenCalledWith(mockModuleA.id, mockPeriodRange);
                    });

                    it('should not download events if it were already downloaded', function() {
                        expect(eventService.getEvents).not.toHaveBeenCalledWith(mockModuleC.id);
                    });

                    it('should upsert the events into IndexedDB after downloading events', function () {
                        expect(programEventRepository.upsert).toHaveBeenCalledWith(mockPayload);
                    });
                });

                it('should update the change log after upserting to IndexedDB', function () {
                    downloadHistoricalDataConsumer.run();
                    scope.$apply();

                    expect(changeLogRepository.upsert).toHaveBeenCalledWith('yearlyDataValues:projectA:moduleA', jasmine.any(String));
                    expect(changeLogRepository.upsert).not.toHaveBeenCalledWith('yearlyDataValues:projectB:moduleB', jasmine.any(String));
                });
            });
        });
    });