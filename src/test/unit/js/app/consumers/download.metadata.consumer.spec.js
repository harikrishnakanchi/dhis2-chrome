define(["downloadMetadataConsumer", "metadataService"], function(DownloadMetadataConsumer, MetadataService) {
    describe("download metadata consumer", function() {
        var downloadMetadataConsumer;

        beforeEach(function() {
            metadataService = new MetadataService();
            spyOn(metadataService, "sync");

            downloadMetadataConsumer = new DownloadMetadataConsumer(metadataService);
        });

        it("should sync metadata", function() {
            var message = {
                "data": {
                    "type": "downloadMetadata"
                }
            };
            downloadMetadataConsumer.run(message);
            expect(metadataService.sync).toHaveBeenCalled();
        });
    });
});
