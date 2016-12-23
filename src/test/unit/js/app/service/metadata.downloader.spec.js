define(['angularMocks', 'utils', 'metadataDownloader', 'changeLogRepository', 'metadataRepository', 'orgUnitGroupRepository', 'dataSetRepository', 'programRepository', 'systemSettingRepository', 'orgUnitRepository'], function (mocks, utils, MetadataDownloader, ChangeLogRepository, MetadataRepository, OrgUnitGroupRepository, DataSetRepository, ProgramRepository, SystemSettingRepository, OrgUnitRepository) {
    describe('metaDataDownloader', function () {
        var http, q, httpBackend, rootScope, metadataDownloader, changeLogRepository, metadataRepository, orgUnitGroupRepository, dataSetRepository, programRepository, systemSettingRepository, orgUnitRepository;

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

            orgUnitGroupRepository = new OrgUnitGroupRepository();
            spyOn(orgUnitGroupRepository,'upsertDhisDownloadedData').and.returnValue(utils.getPromise(q, {}));

            dataSetRepository = new DataSetRepository();
            spyOn(dataSetRepository,'upsertDhisDownloadedData').and.returnValue(utils.getPromise(q, {}));

            programRepository = new ProgramRepository();
            spyOn(programRepository,'upsertDhisDownloadedData').and.returnValue(utils.getPromise(q, {}));

            systemSettingRepository = new SystemSettingRepository();
            spyOn(systemSettingRepository,'upsert').and.returnValue(utils.getPromise(q, {}));

            orgUnitRepository = new OrgUnitGroupRepository();
            spyOn(orgUnitRepository,'upsertDhisDownloadedData').and.returnValue(utils.getPromise(q, {}));

            metadataDownloader = new MetadataDownloader(http, q, changeLogRepository, metadataRepository, orgUnitGroupRepository, dataSetRepository, programRepository, systemSettingRepository, orgUnitRepository);
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        it('should download metadata from DHIS', function () {
            changeLogRepository.get.and.returnValue(utils.getPromise(q, null));
            metadataDownloader.run();

            httpBackend.expectGET('http://localhost:8080/api/metadata?assumeTrue=false&categories=true&categoryCombos=true&categoryOptionCombos=true&' +
                'categoryOptions=true&dataElementGroups=true&dataElements=true&optionSets=true&organisationUnitGroupSets=true&organisationUnitGroups=true&sections=true&' +
                'translations=true&users=true').respond(200, {});
            httpBackend.expectGET(/.*dataSets.*/).respond(200, {});
            httpBackend.expectGET(/.*programs.*/).respond(200, {});
            httpBackend.expectGET(/.*systemSettings.*/).respond(200, {});
            httpBackend.expectGET(/.*organisationUnits.*/).respond(200, {});

            httpBackend.flush();
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
                    organisationUnits: 'someData'
                }
            };

            httpBackend.expectGET(/.*metadata.*/).respond(200, metadataPayload);
            httpBackend.expectGET(/.*dataSets.*/).respond(200, {});
            httpBackend.expectGET(/.*programs.*/).respond(200, {});
            httpBackend.expectGET(/.*systemSettings.*/).respond(200, {});
            httpBackend.expectGET(/.*organisationUnits.*/).respond(200, {});

            httpBackend.flush();
            expect(metadataRepository.upsertMetadata).toHaveBeenCalledWith(metadataPayload);
            expect(orgUnitGroupRepository.upsertDhisDownloadedData).toHaveBeenCalledWith(metadataPayload.organisationUnits);
        });

        it('should update changeLog with the lastUpdated after metadata has been downloaded and upserted successfully', function () {
            changeLogRepository.get.and.returnValue(utils.getPromise(q, null));
            metadataDownloader.run();

            httpBackend.expectGET(/.*metadata.*/).respond(200, {});
            httpBackend.expectGET(/.*dataSets.*/).respond(200, {});
            httpBackend.expectGET(/.*programs.*/).respond(200, {});
            httpBackend.expectGET(/.*systemSettings.*/).respond(200, {});
            httpBackend.expectGET(/.*organisationUnits.*/).respond(200, {});

            httpBackend.flush();
            expect(changeLogRepository.upsert).toHaveBeenCalled();
        });

        it('should clear temp changeLogs once all data is downloaded', function () {
            changeLogRepository.get.and.returnValue(utils.getPromise(q, null));
            metadataDownloader.run();

            httpBackend.expectGET(/.*metadata.*/).respond(200, {});
            httpBackend.expectGET(/.*dataSets.*/).respond(200, {});
            httpBackend.expectGET(/.*programs.*/).respond(200, {});
            httpBackend.expectGET(/.*systemSettings.*/).respond(200, {});
            httpBackend.expectGET(/.*organisationUnits.*/).respond(200, {});

            httpBackend.flush();
            expect(changeLogRepository.clear).toHaveBeenCalled();
        });

        it('should not clear temp changeLogs if data is not downloaded', function () {
            changeLogRepository.get.and.returnValue(utils.getPromise(q, null));
            metadataDownloader.run();

            httpBackend.expectGET(/.*metadata.*/).respond(200, {});
            httpBackend.expectGET(/.*dataSets.*/).respond(200, {});
            httpBackend.expectGET(/.*programs.*/).respond(200, {});
            httpBackend.expectGET(/.*systemSettings.*/).respond(200, {});
            httpBackend.expectGET(/.*organisationUnits.*/).respond(500, {});

            httpBackend.flush();
            expect(changeLogRepository.clear).not.toHaveBeenCalled();
        });
    });
});
