define(["angularMocks", "utils", "moment", "packagedDataImporter", "metadataService", "systemSettingService", "dataSetService", "programService", "orgUnitService", "changeLogRepository", "metadataRepository", "orgUnitRepository", "orgUnitGroupRepository", "dataSetRepository", "programRepository", "systemSettingRepository", "metadataConf"],
    function(mocks, utils, moment, PackagedDataImporter, MetadataService, SystemSettingService, DatasetService, ProgramService, OrgUnitService, ChangeLogRepository, MetadataRepository, OrgUnitRepository, OrgUnitGroupRepository, DatasetRepository, ProgramRepository, SystemSettingRepository, metadataConf) {
        describe("packagedDataImporter", function() {
            var q, scope, packagedDataImporter, metadataService, systemSettingService, datasetService, programService, orgUnitService, changeLogRepository, metadataRepository, orgUnitRepository, orgUnitGroupRepository, datasetRepository, programRepository, systemSettingRepository, metadataCreateDate;

            beforeEach(mocks.inject(function($q, $rootScope) {
                q = $q;
                scope = $rootScope.$new();

                changeLogRepository = {
                    "get": jasmine.createSpy("get").and.returnValue(utils.getPromise(q, undefined)),
                    "upsert": jasmine.createSpy("upsert")
                };

                metadataService = new MetadataService();
                datasetService = new DatasetService();
                programService = new ProgramService();
                orgUnitService = new OrgUnitService();
                systemSettingService = new SystemSettingService();

                metadataCreateDate = moment().toISOString();
                spyOn(metadataService, "loadMetadataFromFile").and.returnValue(utils.getPromise(q, {
                    'created': metadataCreateDate
                }));
                spyOn(datasetService, "loadFromFile").and.returnValue(utils.getPromise(q, {}));
                spyOn(programService, "loadFromFile").and.returnValue(utils.getPromise(q, {}));
                spyOn(systemSettingService, "loadFromFile").and.returnValue(utils.getPromise(q, {}));
                spyOn(orgUnitService, "loadFromFile").and.returnValue(utils.getPromise(q, {}));

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

                packagedDataImporter = new PackagedDataImporter(q, metadataService, systemSettingService, datasetService, programService, orgUnitService, changeLogRepository, metadataRepository, orgUnitRepository, orgUnitGroupRepository, datasetRepository, programRepository, systemSettingRepository);
            }));

            it("should not run import if run once before", function() {
                changeLogRepository.get.and.returnValue(utils.getPromise(q, moment().toISOString()));
                packagedDataImporter.run();
                scope.$apply();

                expect(metadataService.loadMetadataFromFile).not.toHaveBeenCalled();
                expect(systemSettingService.loadFromFile).not.toHaveBeenCalled();
                expect(datasetService.loadFromFile).not.toHaveBeenCalled();
                expect(programService.loadFromFile).not.toHaveBeenCalled();
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

                var metadataCreateDate = moment().toISOString();
                var dhisMetadata = {
                    'created': metadataCreateDate,
                    'users': [],
                    'organisationUnits': orgUnits,
                    'organisationUnitGroups': orgUnitGroups
                };

                metadataService.loadMetadataFromFile.and.returnValue(utils.getPromise(q, dhisMetadata));

                packagedDataImporter.run();
                scope.$apply();

                expect(metadataService.loadMetadataFromFile).toHaveBeenCalled();
                expect(metadataRepository.upsertMetadata).toHaveBeenCalledWith(dhisMetadata);
                expect(orgUnitGroupRepository.upsertDhisDownloadedData).toHaveBeenCalledWith(orgUnitGroups);
            });

            it("should update changelog after metadata import", function() {
                packagedDataImporter.run();
                scope.$apply();

                var methodCalls = _.map(changeLogRepository.upsert.calls.allArgs(), function (callArgs) {
                    return [callArgs[0], callArgs[1]];
                });

                expect(methodCalls).toContain(["metaData", metadataCreateDate]);
                expect(methodCalls).toContain(["organisationUnits", metadataCreateDate]);
                expect(methodCalls).toContain(["organisationUnitGroups", metadataCreateDate]);
                expect(methodCalls).toContain(["dataSets", metadataCreateDate]);
                expect(methodCalls).toContain(["programs", metadataCreateDate]);
                _.each(metadataConf.entities, function (entity) {
                    expect(methodCalls).toContain([entity, metadataCreateDate]);
                });
            });

            it("should not do anything if metadata is not valid", function() {
                metadataService.loadMetadataFromFile.and.returnValue(utils.getPromise(q, "<html><body>Error!</body></html>"));

                packagedDataImporter.run();
                scope.$apply();

                expect(metadataRepository.upsertMetadata).not.toHaveBeenCalled();
                expect(orgUnitGroupRepository.upsertDhisDownloadedData).not.toHaveBeenCalled();
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

            it("should import datasets for fresh installations", function() {
                var dataSets = {
                    "dataSets": [{
                        "id": "ds1"
                    }]
                };

                datasetService.loadFromFile.and.returnValue(utils.getPromise(q, dataSets));

                packagedDataImporter.run();
                scope.$apply();

                expect(datasetRepository.upsertDhisDownloadedData).toHaveBeenCalledWith(dataSets);
            });

            it("should import programs for fresh installations", function() {
                var programs = {
                    "programs": [{
                        "id": "prg1"
                    }]
                };

                programService.loadFromFile.and.returnValue(utils.getPromise(q, programs));

                packagedDataImporter.run();
                scope.$apply();

                expect(programRepository.upsertDhisDownloadedData).toHaveBeenCalledWith(programs);
            });

            it("should import organisationUnits for fresh installations", function() {
                var orgUnits = [{
                        "id": "someOrgUnit"
                    }];

                orgUnitService.loadFromFile.and.returnValue(utils.getPromise(q, orgUnits));

                packagedDataImporter.run();
                scope.$apply();

                expect(orgUnitRepository.upsertDhisDownloadedData).toHaveBeenCalledWith(orgUnits);
            });

        });
    });
