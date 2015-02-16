define(["downloadMetadataConsumer", "metadataService", "metadataRepository", "changeLogRepository", "moment", "utils", "angularMocks"], function(DownloadMetadataConsumer, MetadataService, MetadataRepository, ChangeLogRepository, moment, utils, mocks) {
    describe("download metadata consumer", function() {

        var downloadMetadataConsumer, metadataService, metadataRepository, changeLogRepository, q, scope, thisMoment;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();
            thisMoment = moment("2014-01-01T");

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

            downloadMetadataConsumer = new DownloadMetadataConsumer(metadataService, metadataRepository, changeLogRepository);

            var message = {
                "data": {
                    "type": "downloadMetadata"
                }
            };
            downloadMetadataConsumer.run(message);
            scope.$apply();

            expect(changeLogRepository.get).toHaveBeenCalledWith("metaData");
            expect(metadataService.getMetadata).toHaveBeenCalledWith(lastSyncedDate);
            expect(metadataRepository.upsertMetadata).toHaveBeenCalledWith(dhisMetadata);
            expect(changeLogRepository.upsert).toHaveBeenCalledWith("metaData", thisMoment.toISOString());
        });
    });
});
