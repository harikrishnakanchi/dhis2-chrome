define(['angularMocks', 'utils', 'metadataDownloader', 'changeLogRepository', 'metadataRepository', 'orgUnitGroupRepository', 'dataSetRepository', 'programRepository', 'systemSettingRepository', 'orgUnitRepository'], function (mocks, utils, MetadataDownloader, ChangeLogRepository, MetadataRepository, OrgUnitGroupRepository, DataSetRepository, ProgramRepository, SystemSettingRepository, OrgUnitRepository) {
    describe('metaDataDownloader', function () {
        var http, q, httpBackend, rootScope, metadataDownloader, changeLogRepository, metadataRepository, orgUnitGroupRepository, dataSetRepository, programRepository, systemSettingRepository, orgUnitRepository;

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
            httpBackend.expectGET(/.*organisationUnitGroupSets.*/).respond(200, options);
            httpBackend.expectGET(/.*sections.*/).respond(200, options);
            httpBackend.expectGET(/.*translations.*/).respond(200, options);
            httpBackend.expectGET(/.*users.*/).respond(200, options);
            httpBackend.expectGET(/.*organisationUnitGroups.*/).respond(200, options);
            httpBackend.expectGET(/.*dataSets.*/).respond(200, options);
            httpBackend.expectGET(/.*programs.*/).respond(200, options);
            httpBackend.expectGET(/.*organisationUnits.*/).respond(200, options);
            httpBackend.expectGET(/.*systemSettings.*/).respond(200, options);
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

            expectMetadataDownload();
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
                    someEntity: 'someData'
                }
            };

            expectMetadataDownload(metadataPayload);
            httpBackend.flush();
            expect(metadataRepository.upsertMetadataForEntity).toHaveBeenCalledTimes(13);
        });

        it('should update changeLog with the lastUpdated after metadata has been downloaded and upserted successfully', function () {
            changeLogRepository.get.and.returnValue(utils.getPromise(q, null));
            metadataDownloader.run();

            expectMetadataDownload();
            httpBackend.flush();
            expect(changeLogRepository.upsert).toHaveBeenCalled();
        });

        it('should clear temp changeLogs once all data is downloaded', function () {
            changeLogRepository.get.and.returnValue(utils.getPromise(q, null));
            metadataDownloader.run();

            expectMetadataDownload();
            httpBackend.flush();
            expect(changeLogRepository.clear).toHaveBeenCalled();
        });

        it('should not clear temp changeLogs if data is not downloaded', function () {
            changeLogRepository.get.and.returnValue(utils.getRejectedPromise(q, null));
            metadataDownloader.run();

            expect(changeLogRepository.clear).not.toHaveBeenCalled();
        });
    });
});
