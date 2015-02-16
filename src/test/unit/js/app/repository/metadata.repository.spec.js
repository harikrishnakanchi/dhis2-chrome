define(["metadataRepository", "angularMocks", "utils"], function(MetadataRepository, mocks, utils) {
    describe("metadataRepository", function() {
        var mockStore, scope, metadataRepository;
        beforeEach(mocks.inject(function($q, $rootScope) {
            scope = $rootScope.$new();
            var mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;
            metadataRepository = new MetadataRepository(mockDB.db, $q);
        }));

        it("should upsert metadata and ignore entities that are not in the allowed list", function() {
            var downloadedMetadata = {
                "categories": [{
                    "id": "1"
                }],
                "anotherEntity": [{
                    "id": "10"
                }]
            };

            metadataRepository.upsertMetadata(downloadedMetadata);
            scope.$apply();

            expect(mockStore.upsert.calls.count()).toEqual(1);
            expect(mockStore.upsert.calls.argsFor(0)).toEqual([downloadedMetadata.categories]);
        });
    });
});
