define(["angularMocks", "utils", "moment", "metadataImporter", "metadataService", "systemSettingService", "systemSettingRepository", "changeLogRepository", "metadataRepository", "orgUnitRepository", "orgUnitGroupRepository", "datasetRepository", "programRepository"],
    function(mocks, utils, moment, MetadataImporter, MetadataService, SystemSettingService, SystemSettingRepository, ChangeLogRepository, MetadataRepository, OrgUnitRepository, OrgUnitGroupRepository, DatasetRepository, ProgramRepository) {
        describe("metadataImporter", function() {
            var q, scope, metadataImporter, metadataService, systemSettingService, systemSettingRepository, changeLogRepository, metadataRepository, orgUnitRepository, orgUnitGroupRepository, datasetRepository, programRepository;

            beforeEach(mocks.inject(function($q, $rootScope) {
                q = $q;
                scope = $rootScope.$new();

                changeLogRepository = {
                    "get": jasmine.createSpy("get").and.returnValue(utils.getPromise(q, undefined)),
                    "upsert": jasmine.createSpy("upsert")
                };

                metadataService = new MetadataService();
                metadataRepository = new MetadataRepository();
                orgUnitRepository = new OrgUnitRepository();
                orgUnitGroupRepository = new OrgUnitGroupRepository();
                programRepository = new ProgramRepository();
                datasetRepository = new ProgramRepository();
                systemSettingService = new SystemSettingService();
                systemSettingRepository = new SystemSettingRepository();

                spyOn(metadataRepository, "upsertMetadata");
                spyOn(orgUnitRepository, "upsertDhisDownloadedData");
                spyOn(orgUnitGroupRepository, "upsertDhisDownloadedData");
                spyOn(datasetRepository, "upsertDhisDownloadedData");
                spyOn(programRepository, "upsertDhisDownloadedData");
                spyOn(systemSettingRepository, "upsert");

                metadataImporter = new MetadataImporter(q, metadataService, systemSettingService, systemSettingRepository, changeLogRepository, metadataRepository, orgUnitRepository, orgUnitGroupRepository, datasetRepository, programRepository);
            }));

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
                var metadataCreateDate = moment().toISOString();
                var dhisMetadata = {
                    'created': metadataCreateDate,
                    'organisationUnits': orgUnits,
                    'organisationUnitGroups': orgUnitGroups,
                    "dataSets": dataSets,
                    'programs': programs
                };

                var setting1 = "{\"clientLastUpdated\":\"2015-02-16T09:55:28.681Z\",\"dataElements\":[\"a3e1a48467b\",\"a8a704935cb\"]}";
                var setting2 = "{\"clientLastUpdated\":\"2015-02-16T09:34:08.656Z\",\"dataElements\":[\"a21ac2e69d4\",\"acaeb258531\",\"a1cd332c676\"]}";

                var systemSettings = {
                    "keyAccountRecovery": true,
                    "keyHideUnapprovedDataInAnalytics": true,
                    "ab5e8d18bd6": JSON.parse(setting1),
                    "a2e4d473823": JSON.parse(setting2)
                };

                spyOn(metadataService, "loadMetadataFromFile").and.returnValue(utils.getPromise(q, dhisMetadata));
                spyOn(systemSettingService, "loadFromFile").and.returnValue(utils.getPromise(q, systemSettings));

                metadataImporter.run();
                scope.$apply();

                expect(metadataService.loadMetadataFromFile).toHaveBeenCalled();
                expect(metadataRepository.upsertMetadata).toHaveBeenCalledWith(dhisMetadata);
                expect(orgUnitRepository.upsertDhisDownloadedData).toHaveBeenCalledWith(orgUnits);
                expect(orgUnitGroupRepository.upsertDhisDownloadedData).toHaveBeenCalledWith(orgUnitGroups);
                expect(datasetRepository.upsertDhisDownloadedData).toHaveBeenCalledWith(dataSets);
                expect(programRepository.upsertDhisDownloadedData).toHaveBeenCalledWith(programs);
                expect(systemSettingRepository.upsert).toHaveBeenCalledWith(systemSettings);
                expect(changeLogRepository.upsert).toHaveBeenCalledWith("metaData", metadataCreateDate);
            });

            it("should not run import if run once before", function() {
                changeLogRepository.get.and.returnValue(utils.getPromise(q, moment().toISOString()));
                spyOn(metadataService, "loadMetadataFromFile");
                metadataImporter.run();
                scope.$apply();

                expect(metadataService.loadMetadataFromFile).not.toHaveBeenCalled();
                expect(metadataRepository.upsertMetadata).not.toHaveBeenCalled();
                expect(orgUnitRepository.upsertDhisDownloadedData).not.toHaveBeenCalled();
                expect(orgUnitGroupRepository.upsertDhisDownloadedData).not.toHaveBeenCalled();
                expect(datasetRepository.upsertDhisDownloadedData).not.toHaveBeenCalled();
                expect(programRepository.upsertDhisDownloadedData).not.toHaveBeenCalled();
                expect(systemSettingRepository.upsert).not.toHaveBeenCalled();
                expect(changeLogRepository.upsert).not.toHaveBeenCalled();
            });

            it("should not do anything if metadata and system settings are not valid", function() {
                spyOn(metadataService, "loadMetadataFromFile").and.returnValue(utils.getPromise(q, "<html><body>Error!</body></html>"));
                spyOn(systemSettingService, "loadFromFile").and.returnValue(utils.getPromise(q, "<html><body>Error!</body></html>"));

                metadataImporter.run();
                scope.$apply();

                expect(metadataRepository.upsertMetadata).not.toHaveBeenCalled();
                expect(orgUnitRepository.upsertDhisDownloadedData).not.toHaveBeenCalled();
                expect(orgUnitGroupRepository.upsertDhisDownloadedData).not.toHaveBeenCalled();
                expect(datasetRepository.upsertDhisDownloadedData).not.toHaveBeenCalled();
                expect(programRepository.upsertDhisDownloadedData).not.toHaveBeenCalled();
                expect(systemSettingRepository.upsert).not.toHaveBeenCalled();
                expect(changeLogRepository.upsert).not.toHaveBeenCalled();
            });
        });
    });
