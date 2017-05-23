define(['angularMocks', 'utils', 'metadataDownloader', 'changeLogRepository', 'metadataRepository', 'orgUnitGroupRepository',
    'dataSetRepository', 'programRepository', 'systemSettingRepository', 'orgUnitRepository', 'customAttributeRepository', 'userRepository', 'systemInfoService', 'orgUnitService'],
    function (mocks, utils, MetadataDownloader, ChangeLogRepository, MetadataRepository, OrgUnitGroupRepository,
              DataSetRepository, ProgramRepository, SystemSettingRepository, OrgUnitRepository, CustomAttributeRepository, UserRepository, SystemInfoService, OrgUnitService) {
    describe('metaDataDownloader', function () {
        var http, q, httpBackend, rootScope, metadataDownloader, changeLogRepository, metadataRepository, orgUnitGroupRepository,
            dataSetRepository, programRepository, systemSettingRepository, orgUnitRepository, userRepository, systemInfoService, orgUnitService;

        var expectMetadataDownload = function (options) {
            options = options || {};
            httpBackend.expectGET(/.*categories.*/).respond(200, options);
            httpBackend.expectGET(/.*categoryCombos.*/).respond(200, options);
            httpBackend.expectGET(/.*categoryOptionCombos.*/).respond(200, options);
            httpBackend.expectGET(/.*categoryOptions.*/).respond(200, options);
            httpBackend.expectGET(/.*dataElementGroups.*/).respond(200, options);
            httpBackend.expectGET(/.*dataElements.*/).respond(200, options);
            httpBackend.expectGET(/.*indicators.*/).respond(200, options);
            httpBackend.expectGET(/.*programIndicators.*/).respond(200, options);
            httpBackend.expectGET(/.*optionSets.*/).respond(200, options);
            httpBackend.expectGET(/.*options.*/).respond(200, options);
            httpBackend.expectGET(/.*organisationUnitGroupSets.*/).respond(200, options);
            httpBackend.expectGET(/.*sections.*/).respond(200, options);
            httpBackend.expectGET(/.*users.*/).respond(200, options);
            httpBackend.expectGET(/.*userRoles.*/).respond(200, options);
            httpBackend.expectGET(/.*organisationUnitGroups.*/).respond(200, options);
            httpBackend.expectGET(/.*dataSets.*/).respond(200, options);
            httpBackend.expectGET(/.*programs.*/).respond(200, options);
            httpBackend.expectGET(/.*programStageSections.*/).respond(200, options);
            httpBackend.expectGET(/.*systemSettings.*/).respond(200, options);
            httpBackend.expectGET(/.*attributes.*/).respond(200, options);
        };

        beforeEach(mocks.inject(function ($injector) {
            http = $injector.get('$http');
            q = $injector.get('$q');
            rootScope = $injector.get('$rootScope');

            httpBackend = $injector.get('$httpBackend');

            changeLogRepository = new ChangeLogRepository();
            spyOn(changeLogRepository,'upsert').and.returnValue(utils.getPromise(q, {}));
            spyOn(changeLogRepository,'get').and.returnValue(utils.getPromise(q, {}));
            spyOn(changeLogRepository,'clear').and.returnValue(utils.getPromise(q, {}));

            metadataRepository = new MetadataRepository();
            spyOn(metadataRepository,'upsertMetadata').and.returnValue(utils.getPromise(q, {some: 'data'}));
            spyOn(metadataRepository, 'upsertMetadataForEntity').and.returnValue(utils.getPromise(q, {}));

            orgUnitGroupRepository = new OrgUnitGroupRepository();
            spyOn(orgUnitGroupRepository,'upsertDhisDownloadedData').and.returnValue(utils.getPromise(q, {}));

            dataSetRepository = new DataSetRepository();
            spyOn(dataSetRepository,'upsertDhisDownloadedData').and.returnValue(utils.getPromise(q, {}));

            programRepository = new ProgramRepository();
            spyOn(programRepository,'upsertDhisDownloadedData').and.returnValue(utils.getPromise(q, {}));

            systemSettingRepository = new SystemSettingRepository();
            spyOn(systemSettingRepository,'upsert').and.returnValue(utils.getPromise(q, {}));
            spyOn(systemSettingRepository,'getProductKeyLevel').and.returnValue('globalProductKey');
            spyOn(systemSettingRepository,'getAllowedOrgUnits').and.returnValue(utils.getPromise(q, []));

            orgUnitRepository = new OrgUnitGroupRepository();
            spyOn(orgUnitRepository,'upsertDhisDownloadedData').and.returnValue(utils.getPromise(q, {}));

            orgUnitService = new OrgUnitService();
            spyOn(orgUnitService, 'getOrgUnitTree').and.returnValue(utils.getPromise(q, []));
            spyOn(orgUnitService, 'getAll').and.returnValue(utils.getPromise(q, []));

            userRepository = new UserRepository();
            spyOn(userRepository, 'upsertUserRoles').and.returnValue(utils.getPromise(q, {}));

            systemInfoService = new SystemInfoService();
            spyOn(systemInfoService, 'getServerDate').and.returnValue(utils.getPromise(q, 'someDate'));
            spyOn(systemInfoService, 'getVersion').and.returnValue(utils.getPromise(q, 'someVersion'));

            metadataDownloader = new MetadataDownloader(http, q, changeLogRepository, metadataRepository, orgUnitGroupRepository, dataSetRepository, programRepository, systemSettingRepository, orgUnitRepository, userRepository, systemInfoService, orgUnitService);
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        it('should download metadata from DHIS', function () {
            changeLogRepository.get.and.returnValue(utils.getPromise(q, null));
            metadataDownloader.run();

            expectMetadataDownload();
            httpBackend.flush();
        });

        it('should get system time from DHIS', function () {
            metadataDownloader.run();
            rootScope.$apply();
            expect(systemInfoService.getServerDate).toHaveBeenCalled();
        });

        it('should handle when product key is invalid', function () {
            systemInfoService.getServerDate.and.returnValue(utils.getRejectedPromise(q, {status: 401}));
            metadataDownloader.run().catch(function (data) {
                expect(data).toEqual('productKeyExpired');
            });

            rootScope.$apply();
        });

        it('should get DHIS version', function () {
            metadataDownloader.run();
            rootScope.$apply();
            expect(systemInfoService.getVersion).toHaveBeenCalled();
        });

        it('should not download metadata if changeLog exists',function () {
            changeLogRepository.get.and.returnValue(utils.getPromise(q, true));
            metadataDownloader.run();
        });

        it('should upsert metadata after downloading',function () {
            changeLogRepository.get.and.returnValue(utils.getPromise(q, null));
            metadataDownloader.run();

            var metadataPayload = {
                data: {
                    someEntity: 'someData'
                }
            };

            expectMetadataDownload(metadataPayload);
            httpBackend.flush();
            expect(metadataRepository.upsertMetadataForEntity).toHaveBeenCalledTimes(15);
        });

        it('should update changeLog with the lastUpdated after metadata has been downloaded and upserted successfully', function () {
            changeLogRepository.get.and.returnValue(utils.getPromise(q, null));
            metadataDownloader.run();

            expectMetadataDownload();
            httpBackend.flush();
            expect(changeLogRepository.upsert).toHaveBeenCalled();
        });

        it('should update metadata changelog after download completes', function () {
            metadataDownloader.run();
            rootScope.$apply();
            expect(changeLogRepository.upsert).toHaveBeenCalledWith('metaData', 'someDate');
        });

        describe('download orgUnits', function () {
            describe('for global level product key', function () {
                beforeEach(function () {
                    systemSettingRepository.getProductKeyLevel.and.returnValue('global');
                });

                it('should download all orgunits', function () {
                    changeLogRepository.get.and.callFake(function (name) {
                        return utils.getPromise(q, name === 'organisationUnits' ? undefined : "someTime");
                    });
                    metadataDownloader.run();
                    rootScope.$apply();

                    expect(orgUnitService.getAll).toHaveBeenCalled();
                });

                it('should download all orgUnits with lastUpdated if changeLog for orgUnits exists', function () {
                    var lastUpdated = 'someLastUpdated';
                    changeLogRepository.get.and.returnValue(utils.getPromise(q, lastUpdated));
                    metadataDownloader.run();
                    rootScope.$apply();

                    expect(orgUnitService.getAll).not.toHaveBeenCalled();
                });
            });

            describe('for product keys other than global level', function () {
                var mockAllowedOrgUnits;
                beforeEach(function () {
                    mockAllowedOrgUnits = [{id: 'IDA'}, {id: 'IDB'}];
                    systemSettingRepository.getProductKeyLevel.and.returnValue('project');
                    systemSettingRepository.getAllowedOrgUnits.and.returnValue(mockAllowedOrgUnits);
                });

                it('should get allowed orgUnits', function () {
                    metadataDownloader.run();
                    rootScope.$apply();

                    expect(systemSettingRepository.getAllowedOrgUnits).toHaveBeenCalled();
                });

                it('should download orgUnit tree for allowed orgUnits', function () {
                    changeLogRepository.get.and.callFake(function (name) {
                        return utils.getPromise(q, _.contains(name, 'organisationUnits') ? undefined : "someTime");
                    });
                    metadataDownloader.run();
                    rootScope.$apply();

                    expect(orgUnitService.getOrgUnitTree).toHaveBeenCalledTimes(mockAllowedOrgUnits.length);
                });

                it('should not download orgUnits that already has been downloaded', function () {
                    var lastUpdated = 'someLastUpdated';
                    changeLogRepository.get.and.returnValue(utils.getPromise(q, lastUpdated));
                    metadataDownloader.run();
                    rootScope.$apply();

                    expect(orgUnitService.getOrgUnitTree).not.toHaveBeenCalled();
                });

                it('should upsert downloaded data', function () {
                    changeLogRepository.get.and.callFake(function (name) {
                        return utils.getPromise(q, _.contains(name, 'organisationUnits') ? undefined : "someTime");
                    });
                    metadataDownloader.run();
                    rootScope.$apply();

                    expect(orgUnitRepository.upsertDhisDownloadedData).toHaveBeenCalled();
                });
            });
        });
    });
});
