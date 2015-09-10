define(["angularMocks", "utils", "moment", "packagedDataImporter", "metadataService", "systemSettingService", "changeLogRepository", "metadataRepository", "orgUnitRepository", "orgUnitGroupRepository", "datasetRepository", "programRepository", "systemSettingRepository"],
    function(mocks, utils, moment, PackagedDataImporter, MetadataService, SystemSettingService, ChangeLogRepository, MetadataRepository, OrgUnitRepository, OrgUnitGroupRepository, DatasetRepository, ProgramRepository, SystemSettingRepository) {
        describe("packagedDataImporter", function() {
            var q, scope, packagedDataImporter, metadataService, systemSettingService, changeLogRepository, metadataRepository, orgUnitRepository, orgUnitGroupRepository, datasetRepository, programRepository, systemSettingRepository;

            beforeEach(mocks.inject(function($q, $rootScope) {
                q = $q;
                scope = $rootScope.$new();

                changeLogRepository = {
                    "get": jasmine.createSpy("get").and.returnValue(utils.getPromise(q, undefined)),
                    "upsert": jasmine.createSpy("upsert")
                };

                metadataService = new MetadataService();
                systemSettingService = new SystemSettingService();

                spyOn(metadataService, "loadMetadataFromFile").and.returnValue(utils.getPromise(q, {}));
                spyOn(systemSettingService, "loadFromFile").and.returnValue(utils.getPromise(q, {}));

                metadataRepository = new MetadataRepository();
                orgUnitRepository = new OrgUnitRepository();
                orgUnitGroupRepository = new OrgUnitGroupRepository();
                programRepository = new ProgramRepository();
                datasetRepository = new ProgramRepository();
                systemSettingRepository = new SystemSettingRepository();

                spyOn(metadataRepository, "upsertMetadata");
                spyOn(orgUnitRepository, "upsertDhisDownloadedData");
                spyOn(orgUnitGroupRepository, "upsertDhisDownloadedData");
                spyOn(datasetRepository, "upsertDhisDownloadedData");
                spyOn(programRepository, "upsertDhisDownloadedData");
                spyOn(systemSettingRepository, "upsert");

                packagedDataImporter = new PackagedDataImporter(q, metadataService, systemSettingService, changeLogRepository, metadataRepository, orgUnitRepository, orgUnitGroupRepository, datasetRepository, programRepository, systemSettingRepository);
            }));

            it("should not run import if run once before", function() {
                changeLogRepository.get.and.returnValue(utils.getPromise(q, moment().toISOString()));
                packagedDataImporter.run();
                scope.$apply();

                expect(metadataService.loadMetadataFromFile).not.toHaveBeenCalled();
                expect(systemSettingService.loadFromFile).not.toHaveBeenCalled();
                expect(metadataRepository.upsertMetadata).not.toHaveBeenCalled();
                expect(orgUnitRepository.upsertDhisDownloadedData).not.toHaveBeenCalled();
                expect(orgUnitGroupRepository.upsertDhisDownloadedData).not.toHaveBeenCalled();
                expect(datasetRepository.upsertDhisDownloadedData).not.toHaveBeenCalled();
                expect(programRepository.upsertDhisDownloadedData).not.toHaveBeenCalled();
                expect(systemSettingRepository.upsert).not.toHaveBeenCalled();
                expect(changeLogRepository.upsert).not.toHaveBeenCalled();
            });

            it("should import metadata for fresh installations", function() {
                var orgUnits = [{
                    'id': 'ou1'
                }];
                var orgUnitGroups = [{
                    'id': 'oug1'
                }];
                var dataSets = [{
                    'id': 'ds1'
                }];
                var programs = [{
                    'id': 'prog1'
                }];
                var sections = [{
                    "id": "sec1"
                }];
                var metadataCreateDate = moment().toISOString();
                var dhisMetadata = {
                    'created': metadataCreateDate,
                    'organisationUnits': orgUnits,
                    'organisationUnitGroups': orgUnitGroups,
                    "dataSets": dataSets,
                    'programs': programs,
                    'sections': sections
                };

                metadataService.loadMetadataFromFile.and.returnValue(utils.getPromise(q, dhisMetadata));

                packagedDataImporter.run();
                scope.$apply();

                expect(metadataService.loadMetadataFromFile).toHaveBeenCalled();
                expect(metadataRepository.upsertMetadata).toHaveBeenCalledWith(dhisMetadata);
                expect(orgUnitRepository.upsertDhisDownloadedData).toHaveBeenCalledWith(orgUnits);
                expect(orgUnitGroupRepository.upsertDhisDownloadedData).toHaveBeenCalledWith(orgUnitGroups);
                expect(datasetRepository.upsertDhisDownloadedData).toHaveBeenCalledWith(dataSets, sections);
                expect(programRepository.upsertDhisDownloadedData).toHaveBeenCalledWith(programs);
                expect(changeLogRepository.upsert).toHaveBeenCalledWith("metaData", metadataCreateDate);
                expect(changeLogRepository.upsert).toHaveBeenCalledWith("orgUnits", metadataCreateDate);
                expect(changeLogRepository.upsert).toHaveBeenCalledWith("orgUnitGroups", metadataCreateDate);
                expect(changeLogRepository.upsert).toHaveBeenCalledWith("datasets", metadataCreateDate);
                expect(changeLogRepository.upsert).toHaveBeenCalledWith("programs", metadataCreateDate);
            });

            it("should not do anything if metadata is not valid", function() {
                metadataService.loadMetadataFromFile.and.returnValue(utils.getPromise(q, "<html><body>Error!</body></html>"));

                packagedDataImporter.run();
                scope.$apply();

                expect(metadataRepository.upsertMetadata).not.toHaveBeenCalled();
                expect(orgUnitRepository.upsertDhisDownloadedData).not.toHaveBeenCalled();
                expect(orgUnitGroupRepository.upsertDhisDownloadedData).not.toHaveBeenCalled();
                expect(datasetRepository.upsertDhisDownloadedData).not.toHaveBeenCalled();
                expect(programRepository.upsertDhisDownloadedData).not.toHaveBeenCalled();
                expect(changeLogRepository.upsert).not.toHaveBeenCalled();
            });

            it("should import praxis settings for fresh installations", function() {
                var systemSettings = {
                    "someSetting": "blah"
                };

                systemSettingService.loadFromFile.and.returnValue(utils.getPromise(q, systemSettings));

                packagedDataImporter.run();
                scope.$apply();

                expect(systemSettingRepository.upsert).toHaveBeenCalledWith(systemSettings);
            });

        });
    });
