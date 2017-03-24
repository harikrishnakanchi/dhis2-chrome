define(['utils', 'timecop', 'angularMocks', 'lodash', 'dateUtils', 'properties', 'moment', 'mergeBy', 'downloadHistoricalDataConsumer', 'dataService', 'systemInfoService',
        'userPreferenceRepository', 'orgUnitRepository', 'dataSetRepository', 'changeLogRepository', 'dataRepository', 'programEventRepository','eventService','customAttributes'],
    function (utils, timecop, mocks, _, dateUtils, properties, moment, MergeBy, DownloadHistoricalDataConsumer, DataService, SystemInfoService, UserPreferenceRepository,
              OrgUnitRepository, DatasetRepository, ChangeLogRepository, DataRepository, ProgramEventRepository, EventService, customAttributes) {
        describe('DownloadHistoricalDataConsumer', function () {
            var scope, q, log, mergeBy, downloadHistoricalDataConsumer, dataService, eventService, systemInfoService, userPreferenceRepository, orgUnitRepository,
                datasetRepository, dataRepository, changeLogRepository, programEventRepository,
                mockOrigins, mockDataSets, mockPeriodRange, periodChunkSize, mockPayload, mockProjectA, mockProjectB, mockModuleA, mockModuleB, mockModuleC;

            beforeEach(mocks.inject(function ($q, $rootScope, $log) {
                q = $q;
                scope = $rootScope.$new();
                log = $log;

                mergeBy = MergeBy($log);
                spyOn(mergeBy, 'lastUpdated');

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

                systemInfoService = new SystemInfoService();
                spyOn(systemInfoService, 'getServerDate').and.returnValue(utils.getPromise(q, ''));

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
                spyOn(dataRepository, 'getDataValuesForOrgUnitsAndPeriods').and.returnValue(utils.getPromise(q, {}));

                programEventRepository = new ProgramEventRepository();
                spyOn(programEventRepository, 'upsert').and.returnValue(utils.getPromise(q, {}));

                downloadHistoricalDataConsumer = new DownloadHistoricalDataConsumer(q, mergeBy, dataService, eventService, systemInfoService, userPreferenceRepository, orgUnitRepository, datasetRepository, changeLogRepository, dataRepository, programEventRepository);
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

                expect(datasetRepository.findAllForOrgUnits).toHaveBeenCalledWith([mockModuleA].concat(mockOrigins));
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

            it('should not continue download of historical data even if one module fails due to network unavailability', function() {
                changeLogRepository.get.and.returnValue(utils.getPromise(q, undefined));
                dataService.downloadData.and.callFake(function (moduleId) {
                    return moduleId == mockModuleB.id ? utils.getRejectedPromise(q, {errorCode: "NETWORK_UNAVAILABLE"}) : utils.getPromise(q, {});
                });

                downloadHistoricalDataConsumer.run();
                scope.$apply();

                expect(changeLogRepository.upsert).toHaveBeenCalledWith('yearlyDataValues:projectA:moduleA', jasmine.any(String));
                expect(changeLogRepository.upsert).not.toHaveBeenCalledWith('yearlyDataValues:projectB:moduleB', jasmine.any(String));
                expect(changeLogRepository.upsert).not.toHaveBeenCalledWith('yearlyDataValues:projectB:moduleC', jasmine.any(String));
            });

            describe('Download Data', function () {

                describe('Aggregate modules', function () {
                    var dataSetIds;

                    beforeEach(function () {
                        spyOn(customAttributes, 'getBooleanAttributeValue').and.returnValue(false);
                        dataService.downloadData.and.returnValue(utils.getPromise(q, mockPayload));
                        dataSetIds = _.map(mockDataSets, 'id');

                        downloadHistoricalDataConsumer.run();
                        scope.$apply();
                    });

                    it('should not download events', function () {
                        expect(eventService.getEvents).not.toHaveBeenCalled();
                    });

                    it('should download data values in chunks without lastUpdated if it is downloading for the first time', function () {
                        var periodChunks = _.chunk(mockPeriodRange, periodChunkSize);

                        var methodCallsForModuleC = _.map(dataService.downloadData.calls.allArgs(), function (callArgs, index) {
                            return [callArgs[0], callArgs[1], periodChunks[index]];
                        });

                        expect(methodCallsForModuleC).toContain([mockModuleA.id, dataSetIds, periodChunks[0]]);
                        expect(methodCallsForModuleC).toContain([mockModuleA.id, dataSetIds, periodChunks[1]]);
                        expect(methodCallsForModuleC).toContain([mockModuleA.id, dataSetIds, periodChunks[2]]);
                        expect(methodCallsForModuleC).toContain([mockModuleA.id, dataSetIds, periodChunks[3]]);
                    });

                    it('should download data values in a single chunk with lastUpdated if it were already downloaded', function () {
                        expect(dataService.downloadData).toHaveBeenCalledWith(mockModuleB.id, dataSetIds, mockPeriodRange, 'someLastUpdatedTime');
                    });

                    describe('save to indexedDB', function () {
                        var mockDHISData, mockPraxisData, mockMergedData;

                        beforeEach(function () {
                            mockMergedData = ['someMockMergedDataValues'];

                            dataService.downloadData.and.returnValue(utils.getPromise(q, mockDHISData));
                            dataRepository.getDataValuesForOrgUnitsAndPeriods.and.returnValue(utils.getPromise(q, mockPraxisData));
                            mergeBy.lastUpdated.and.returnValue(mockMergedData);

                            downloadHistoricalDataConsumer.run();
                            scope.$apply();
                        });

                        it('should get praxis data', function () {
                            expect(dataRepository.getDataValuesForOrgUnitsAndPeriods).toHaveBeenCalledWith([mockOrigins[0].id, mockOrigins[1].id, mockModuleB.id], mockPeriodRange);

                            var periodChunks = _.chunk(mockPeriodRange, periodChunkSize);
                            expect(dataRepository.getDataValuesForOrgUnitsAndPeriods).toHaveBeenCalledWith([mockOrigins[0].id, mockOrigins[1].id, mockModuleC.id], periodChunks[0]);
                            expect(dataRepository.getDataValuesForOrgUnitsAndPeriods).toHaveBeenCalledWith([mockOrigins[0].id, mockOrigins[1].id, mockModuleC.id], periodChunks[1]);
                            expect(dataRepository.getDataValuesForOrgUnitsAndPeriods).toHaveBeenCalledWith([mockOrigins[0].id, mockOrigins[1].id, mockModuleC.id], periodChunks[2]);
                            expect(dataRepository.getDataValuesForOrgUnitsAndPeriods).toHaveBeenCalledWith([mockOrigins[0].id, mockOrigins[1].id, mockModuleC.id], periodChunks[3]);
                        });

                        it('should merge the data values from Praxis and DHIS by lastUpdated', function () {
                            expect(mergeBy.lastUpdated).toHaveBeenCalledWith({ eq: jasmine.any(Function) }, mockDHISData, mockPraxisData);
                        });

                        it('should upsert the merged datavalues into IndexedDB', function () {
                            expect(dataRepository.saveDhisData).toHaveBeenCalledWith(mockMergedData);
                        });
                    });

                });

                describe('LineList modules', function () {
                    beforeEach(function() {
                        spyOn(customAttributes, 'getBooleanAttributeValue').and.returnValue(true);
                        eventService.getEvents.and.returnValue(utils.getPromise(q, mockPayload));

                        downloadHistoricalDataConsumer.run();
                        scope.$apply();
                    });

                    it('should not download data values', function () {
                        expect(dataService.downloadData).not.toHaveBeenCalledWith(mockModuleA.id);
                    });

                    it('should download events without lastUpdated if it is downloading for the first time', function () {
                        expect(eventService.getEvents).toHaveBeenCalledWith(mockModuleA.id, mockPeriodRange, undefined);
                    });

                    it('should download the events with lastUpdated if it were already downloaded', function() {
                        expect(eventService.getEvents).toHaveBeenCalledWith(mockModuleB.id, mockPeriodRange, 'someLastUpdatedTime');
                    });

                    it('should upsert the events into IndexedDB after downloading events', function () {
                        expect(programEventRepository.upsert).toHaveBeenCalledWith(mockPayload);
                    });
                });

                it('should update the change log after upserting to IndexedDB', function () {
                    downloadHistoricalDataConsumer.run();
                    scope.$apply();

                    expect(changeLogRepository.upsert).toHaveBeenCalledWith('yearlyDataValues:projectA:moduleA', jasmine.any(String));
                    expect(changeLogRepository.upsert).toHaveBeenCalledWith('yearlyDataValues:projectB:moduleB', jasmine.any(String));
                    expect(changeLogRepository.upsert).toHaveBeenCalledWith('yearlyDataValues:projectB:moduleC', jasmine.any(String));
                });

                it('should upsert the changeLog with the server time', function () {
                    systemInfoService.getServerDate.and.returnValue(utils.getPromise(q, 'someTime'));
                    downloadHistoricalDataConsumer.run();
                    scope.$apply();

                    expect(changeLogRepository.upsert).toHaveBeenCalledWith(jasmine.any(String), 'someTime');
                });
            });
        });
    });