define(["downloadMetadataConsumer", "metadataService", "systemInfoService", "metadataRepository", "changeLogRepository", "moment", "utils", "angularMocks", "metadataConf"],
    function(DownloadMetadataConsumer, MetadataService, SystemInfoService, MetadataRepository, ChangeLogRepository, moment, utils, mocks, metadataConf) {
    describe("download metadata consumer", function() {

        var downloadMetadataConsumer, metadataService, systemInfoService, metadataRepository, changeLogRepository, q, scope, thisMoment, metaDataTypes;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();
            thisMoment = moment("2014-01-01");
            metaDataTypes = metadataConf.types;

            Timecop.install();
            Timecop.freeze(thisMoment.toDate());
            metadataService = new MetadataService();
            spyOn(metadataService, "getMetadata").and.returnValue(utils.getPromise(q, undefined));
            spyOn(metadataService, "getMetadataOfType").and.returnValue(utils.getPromise(q, undefined));

            metadataRepository = new MetadataRepository();
            spyOn(metadataRepository, "upsertMetadata");
            spyOn(metadataRepository, "upsertMetadataForEntity");

            changeLogRepository = new ChangeLogRepository();
            spyOn(changeLogRepository, "get").and.returnValue(utils.getPromise(q, undefined));
            spyOn(changeLogRepository, "upsert");

            systemInfoService = new SystemInfoService();
            spyOn(systemInfoService, 'getServerDate').and.returnValue(utils.getPromise(q, 'someTime'));

            downloadMetadataConsumer = new DownloadMetadataConsumer(metadataService, systemInfoService, metadataRepository, changeLogRepository);
        }));

        afterEach(function() {
            metadataConf.types = metaDataTypes;
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        it('should download data for all the metadata entities', function () {
            var type = "categories", someTime = "someTime", someData = "someData";
            metadataConf.types = {
                "categories": "id,name"
            };
            systemInfoService.getServerDate.and.returnValue(utils.getPromise(q, someTime));
            metadataService.getMetadataOfType.and.returnValue(utils.getPromise(q, someData));
            changeLogRepository.get.and.returnValue(utils.getPromise(q, someTime));

            downloadMetadataConsumer.run();
            scope.$apply();

            expect(changeLogRepository.get).toHaveBeenCalledWith(type);
            expect(metadataService.getMetadataOfType).toHaveBeenCalledWith(type, someTime);
            expect(metadataRepository.upsertMetadataForEntity).toHaveBeenCalledWith(someData, type);
            expect(changeLogRepository.upsert).toHaveBeenCalledWith(type, someTime);
        });
    });
});
