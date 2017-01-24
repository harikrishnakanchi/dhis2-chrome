define(["downloadMetadataConsumer", "metadataService", "systemInfoService", "metadataRepository", "changeLogRepository", "moment", "utils", "angularMocks"],
    function(DownloadMetadataConsumer, MetadataService, SystemInfoService, MetadataRepository, ChangeLogRepository, moment, utils, mocks) {
    describe("download metadata consumer", function() {

        var downloadMetadataConsumer, metadataService, systemInfoService, metadataRepository, changeLogRepository, q, scope, thisMoment;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();
            thisMoment = moment("2014-01-01");

            Timecop.install();
            Timecop.freeze(thisMoment.toDate());
        }));

        afterEach(function() {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        it("should sync metadata", function() {
            var lastSyncedDate = moment("2010-01-01").toISOString();
            var dhisMetadata = {
                "entity": [{
                    "id": "1"
                }]
            };

            metadataService = new MetadataService();
            spyOn(metadataService, "getMetadata").and.returnValue(utils.getPromise(q, dhisMetadata));

            metadataRepository = new MetadataRepository();
            spyOn(metadataRepository, "upsertMetadata");

            changeLogRepository = new ChangeLogRepository();
            spyOn(changeLogRepository, "get").and.returnValue(utils.getPromise(q, lastSyncedDate));
            spyOn(changeLogRepository, "upsert");

            systemInfoService = new SystemInfoService();
            spyOn(systemInfoService, 'getServerDate').and.returnValue(utils.getPromise(q, 'someTime'));

            downloadMetadataConsumer = new DownloadMetadataConsumer(metadataService, systemInfoService, metadataRepository, changeLogRepository);

            var message = {
                "data": {
                    "type": "downloadMetadata"
                }
            };
            downloadMetadataConsumer.run(message);
            scope.$apply();

            expect(changeLogRepository.get).toHaveBeenCalledWith("metaData", undefined);
            expect(metadataService.getMetadata).toHaveBeenCalledWith(lastSyncedDate);
            expect(metadataRepository.upsertMetadata).toHaveBeenCalledWith(dhisMetadata);
            expect(changeLogRepository.upsert).toHaveBeenCalledWith("metaData", 'someTime');
        });
    });
});
