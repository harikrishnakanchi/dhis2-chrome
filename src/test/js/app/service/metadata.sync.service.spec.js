define(["metadataSyncService", "properties", "angularMocks"], function(MetadataSyncService, properties) {
    describe("Metadata sync service", function() {
        var httpBackend, http, db, mockStore, category1;

        beforeEach(inject(function($injector) {
            category1 = {
                id: "blah"
            };
            db = {
                objectStore: function() {}
            };
            mockStore = {
                upsert: function() {}
            };
            spyOn(db, 'objectStore').and.returnValue(mockStore);
            spyOn(mockStore, 'upsert');

            httpBackend = $injector.get('$httpBackend');
            httpBackend.expectGET(properties.metadata.url, {
                "Authorization": properties.metadata.auth_header,
                "Accept": "application/json, text/plain, */*"
            }).respond(200, {
                categories: [category1]
            });
            http = $injector.get('$http');
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        it("should upsert data to object stores", function() {
            var metadataSyncService = new MetadataSyncService(db, http);

            metadataSyncService.sync();
            httpBackend.flush();

            expect(db.objectStore).toHaveBeenCalledWith("categories");
            expect(mockStore.upsert).toHaveBeenCalledWith(category1);
        });
    });
});