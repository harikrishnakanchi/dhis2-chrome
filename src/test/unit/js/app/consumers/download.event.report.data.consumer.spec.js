define(['downloadEventReportDataConsumer', 'angularMocks', 'utils', 'moment', 'systemInfoService', 'userPreferenceRepository', 'orgUnitRepository',
        'customAttributes', 'programRepository', 'eventReportRepository', 'changeLogRepository', 'reportService'],
    function (DownloadEventReportDataConsumer, mocks, utils, moment, SystemInfoService, UserPreferenceRepository, OrgUnitRepository,
              CustomAttributes, ProgramRepository, EventReportRepository, ChangeLogRepository, ReportService) {
        describe('DownloadEventReportDataConsumer', function () {
            var scope, q, downloadEventReportDataConsumer, systemInfoService, userPreferenceRepository, orgUnitRepository, programRepository,
                mockProjectId, mockModule, mockProgram, mockOrigin, mockReportData, eventReportRepository, changeLogRepository, reportService, currentTime;

            beforeEach(mocks.inject(function ($q, $rootScope) {
                scope = $rootScope;
                q = $q;

                mockProjectId = 'someMockProjectId';
                mockModule = {
                    id: 'someModuleId'
                };
                mockOrigin = {id: 'someOriginId'};
                mockProgram = {
                    id: 'someProgramId',
                    serviceCode: 'someProgramServiceCode'
                };
                mockReportData = {id: 'someReportId'};

                systemInfoService = new SystemInfoService();
                spyOn(systemInfoService, 'getServerDate').and.returnValue(utils.getPromise(q, ''));

                eventReportRepository = new EventReportRepository();
                spyOn(eventReportRepository, 'getAll').and.returnValue(utils.getPromise(q, ['eventReportDefinition1', 'eventReportDefinition2']));
                spyOn(eventReportRepository, 'upsertEventReportData').and.returnValue(utils.getPromise(q, {}));

                userPreferenceRepository = new UserPreferenceRepository();
                spyOn(userPreferenceRepository, 'getCurrentUsersProjectIds').and.returnValue(utils.getPromise(q, [mockProjectId]));

                orgUnitRepository = new OrgUnitRepository();
                spyOn(orgUnitRepository, 'getAllModulesInOrgUnits').and.returnValue(utils.getPromise(q, [mockModule]));
                spyOn(orgUnitRepository, 'findAllByParent').and.returnValue(utils.getPromise(q, [mockOrigin]));

                programRepository = new ProgramRepository();
                spyOn(programRepository, 'getProgramForOrgUnit').and.returnValue(utils.getPromise(q, mockProgram));

                changeLogRepository = new ChangeLogRepository();
                spyOn(changeLogRepository, 'get').and.returnValue(utils.getPromise(q, '2017-05-28T02:03:00.000Z'));
                spyOn(changeLogRepository, 'upsert').and.returnValue(utils.getPromise(q, {}));

                reportService = new ReportService();
                spyOn(reportService, 'getEventReportDataForOrgUnit').and.returnValue(utils.getPromise(q, mockReportData));

                spyOn(CustomAttributes, 'getBooleanAttributeValue').and.returnValue(true);

                currentTime = moment('2017-05-29T02:03:00.000Z');
                Timecop.install();
                Timecop.freeze(currentTime.toISOString());

                downloadEventReportDataConsumer = new DownloadEventReportDataConsumer(q, systemInfoService, userPreferenceRepository,
                    orgUnitRepository, programRepository, eventReportRepository, changeLogRepository, reportService);
            }));

            it('should fetch current time from system info', function () {
                downloadEventReportDataConsumer.run();
                scope.$apply();

                expect(systemInfoService.getServerDate).toHaveBeenCalled();
            });

            it('should get all event reports from indexedDB', function () {
                downloadEventReportDataConsumer.run();
                scope.$apply();

                expect(eventReportRepository.getAll).toHaveBeenCalled();
            });

            it('should get the current users projects', function () {
                downloadEventReportDataConsumer.run();
                scope.$apply();

                expect(userPreferenceRepository.getCurrentUsersProjectIds).toHaveBeenCalled();
            });

            it('should get all modules for current user projects', function () {
                downloadEventReportDataConsumer.run();
                scope.$apply();

                expect(orgUnitRepository.getAllModulesInOrgUnits).toHaveBeenCalledWith([mockProjectId]);
            });

            it('should get the programs associated to lineList modules', function () {
                var mockOrigin = {id: 'someOriginId'};
                orgUnitRepository.findAllByParent.and.returnValue(utils.getPromise(q, [mockOrigin]));

                downloadEventReportDataConsumer.run();
                scope.$apply();

                expect(programRepository.getProgramForOrgUnit).toHaveBeenCalledWith('someOriginId');
            });

            it('should retrieve the lastUpdated time for eventReports from changeLog', function () {
                var monthlyChangeLogKey = 'monthlyEventReportData:' + mockProjectId + ':' + mockModule.id;
                var weeklyChangeLogKey = 'weeklyEventReportData:' + mockProjectId + ':' + mockModule.id;
                downloadEventReportDataConsumer.run();
                scope.$apply();

                expect(changeLogRepository.get).toHaveBeenCalledWith(monthlyChangeLogKey);
                expect(changeLogRepository.get).toHaveBeenCalledWith(weeklyChangeLogKey);
            });

            it('should download the event reports for the relevant modules', function () {
                var eventReportA = {
                    id: 'someEventReport',
                    serviceCode: 'someProgramServiceCode',
                    monthlyReport: true
                };

                var eventReportB = {
                    id: 'someEventReport',
                    serviceCode: 'someOtherProgramServiceCode',
                    monthlyReport: true
                };
                eventReportRepository.getAll.and.returnValue(utils.getPromise(q, [eventReportA, eventReportB]));

                downloadEventReportDataConsumer.run();
                scope.$apply();

                expect(reportService.getEventReportDataForOrgUnit).toHaveBeenCalledWith(eventReportA, mockModule);
                expect(reportService.getEventReportDataForOrgUnit).not.toHaveBeenCalledWith(eventReportB);
            });

            it('should download the event reports only for line list modules', function () {
                var eventReportA = {
                    id: 'someEventReport',
                    serviceCode: 'someProgramServiceCode',
                    monthlyReport: true
                };

                eventReportRepository.getAll.and.returnValue(utils.getPromise(q, [eventReportA]));
                CustomAttributes.getBooleanAttributeValue.and.returnValue(false);

                downloadEventReportDataConsumer.run();
                scope.$apply();

                expect(reportService.getEventReportDataForOrgUnit).not.toHaveBeenCalled();
            });

            it('should not download the weekly event reports for a modules if it was downloaded the same day', function () {
                var eventReportA = {
                    id: 'someEventReport',
                    serviceCode: 'someProgramServiceCode',
                    weeklyReport: true
                };
                var lastDownloadedTime = moment('2017-05-29T02:03:00.000Z');
                changeLogRepository.get.and.returnValue(utils.getPromise(q, lastDownloadedTime));

                eventReportRepository.getAll.and.returnValue(utils.getPromise(q, [eventReportA]));

                downloadEventReportDataConsumer.run();
                scope.$apply();

                expect(reportService.getEventReportDataForOrgUnit).not.toHaveBeenCalled();
            });

            it('should not download the monthly event reports for a modules if it was downloaded the same day', function () {
                var eventReportA = {
                    id: 'someEventReport',
                    serviceCode: 'someProgramServiceCode',
                    monthlyReport: true
                };
                var lastDownloadedTime = moment('2017-05-29T02:03:00.000Z');
                changeLogRepository.get.and.returnValue(utils.getPromise(q, lastDownloadedTime));

                eventReportRepository.getAll.and.returnValue(utils.getPromise(q, [eventReportA]));

                downloadEventReportDataConsumer.run();
                scope.$apply();

                expect(reportService.getEventReportDataForOrgUnit).not.toHaveBeenCalled();
            });

            describe('DownloadEventReport for modules', function () {
                var lastDownloadedTime, eventReportA, eventReportB;
                beforeEach(function () {
                    lastDownloadedTime = moment('2017-05-28T02:03:00.000Z');
                    changeLogRepository.get.and.returnValue(utils.getPromise(q, lastDownloadedTime));
                    eventReportA = {
                        id: 'someEventReport',
                        serviceCode: 'someProgramServiceCode',
                        monthlyReport: true
                    };
                    eventReportB = {
                        id: 'someOtherEventReport',
                        serviceCode: 'someOtherServiceCode',
                        monthlyReport: true
                    };
                });

                it('should download the monthly event reports for a module if it has not downloaded in the same day', function () {
                    eventReportRepository.getAll.and.returnValue(utils.getPromise(q, [eventReportA, eventReportB]));

                    downloadEventReportDataConsumer.run();
                    scope.$apply();

                    expect(reportService.getEventReportDataForOrgUnit).toHaveBeenCalledWith(eventReportA, mockModule);
                });

                it('should upsert downloaded event report data to indexedDB', function () {
                    var eventReportData = {id: 'someEventReportId'};
                    eventReportRepository.getAll.and.returnValue(utils.getPromise(q, [eventReportA, eventReportB]));
                    reportService.getEventReportDataForOrgUnit.and.returnValue(utils.getPromise(q, eventReportData));

                    downloadEventReportDataConsumer.run();
                    scope.$apply();

                    expect(eventReportRepository.upsertEventReportData).toHaveBeenCalledWith(eventReportA.id, mockModule.id, eventReportData);
                });

                it('should update changeLog once all event reports for module are downloaded successfully', function () {
                    var monthlyChangeLogKey = 'monthlyEventReportData:' + mockProjectId + ':' + mockModule.id;
                    var downloadStartTime = 'someTime';
                    systemInfoService.getServerDate.and.returnValue(utils.getPromise(q, downloadStartTime));

                    downloadEventReportDataConsumer.run();
                    scope.$apply();

                    expect(changeLogRepository.upsert).toHaveBeenCalledWith(monthlyChangeLogKey, downloadStartTime);
                });

            });

            it('should continue downloading event report data even if one call fails', function () {
                var moduleA = {id: 'moduleAId'};
                var moduleB = {id: 'moduleBId'};
                var moduleC = {id: 'moduleCId'};
                var eventReport = {
                    id: 'someEventReport',
                    serviceCode: 'someProgramServiceCode',
                    monthlyReport: true
                };

                eventReportRepository.getAll.and.returnValue(utils.getPromise(q, [eventReport]));
                orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, [moduleA, moduleB, moduleC]));
                reportService.getEventReportDataForOrgUnit.and.callFake(function(eventReport, module) {
                    if (module.id === moduleA.id)
                        return utils.getPromise(q, "data1");
                    if (module.id === moduleB.id)
                        return utils.getRejectedPromise(q, {});
                    if (module.id === moduleC.id)
                        return utils.getPromise(q, "data3");
                });

                downloadEventReportDataConsumer.run();
                scope.$apply();

                expect(eventReportRepository.upsertEventReportData).toHaveBeenCalledWith(eventReport.id, moduleA.id, "data1");
                expect(eventReportRepository.upsertEventReportData).not.toHaveBeenCalledWith(eventReport.id, moduleB.id, {});
                expect(eventReportRepository.upsertEventReportData).toHaveBeenCalledWith(eventReport.id, moduleC.id, "data3");
            });

            it('should not continue downloading event report data even if one call fails with network failure', function () {
                var moduleA = {id: 'moduleAId'};
                var moduleB = {id: 'moduleBId'};
                var moduleC = {id: 'moduleCId'};
                var eventReport = {
                    id: 'someEventReport',
                    serviceCode: 'someProgramServiceCode',
                    monthlyReport: true
                };

                eventReportRepository.getAll.and.returnValue(utils.getPromise(q, [eventReport]));
                orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, [moduleA, moduleB, moduleC]));
                reportService.getEventReportDataForOrgUnit.and.callFake(function(eventReport, module) {
                    if (module.id === moduleA.id)
                        return utils.getPromise(q, "data1");
                    if (module.id === moduleB.id)
                        return utils.getRejectedPromise(q, {errorCode: 'NETWORK_UNAVAILABLE'});
                    if (module.id === moduleC.id)
                        return utils.getPromise(q, "data3");
                });

                downloadEventReportDataConsumer.run();
                scope.$apply();

                expect(eventReportRepository.upsertEventReportData).toHaveBeenCalledWith(eventReport.id, moduleA.id, "data1");
                expect(eventReportRepository.upsertEventReportData).not.toHaveBeenCalledWith(eventReport.id, moduleB.id, {});
                expect(eventReportRepository.upsertEventReportData).not.toHaveBeenCalledWith(eventReport.id, moduleC.id, "data3");
                expect(changeLogRepository.upsert).toHaveBeenCalledWith('weeklyEventReportData:someMockProjectId:moduleAId', '');
                expect(changeLogRepository.upsert).not.toHaveBeenCalledWith('weeklyEventReportData:someMockProjectId:moduleBId', '');
                expect(changeLogRepository.upsert).not.toHaveBeenCalledWith('weeklyEventReportData:someMockProjectId:moduleCId', '');
            });
        });
    });