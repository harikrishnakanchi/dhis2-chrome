define(["metadataRepository", "angularMocks", "utils"], function(MetadataRepository, mocks, utils) {
    describe("metadataRepository", function() {
        var mockStore, scope, metadataRepository, mockDB, q;
        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();
            mockDB = utils.getMockDB($q);
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

        it('should upsert metadata to the given the entity type', function () {
            var mockObjectStore = {
                "upsert": jasmine.createSpy('upsert').and.callFake(function(data) {
                    return utils.getPromise(q, {});
                })
            };

            var db = {
                'objectStore' : jasmine.createSpy('objectStore').and.callFake(function() {
                    return mockObjectStore;
                })
            };

            metadataRepository = new MetadataRepository(db, q);
            var dataToBeUpserted = {};
            var type = 'someEntityType';

            metadataRepository.upsertMetadataForEntity(dataToBeUpserted, type);
            scope.$apply();

            expect(mockObjectStore.upsert).toHaveBeenCalled();
        });
    });
});
