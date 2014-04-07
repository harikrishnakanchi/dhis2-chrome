define(["metadataService", "properties", "utils", "angularMocks"], function(MetadataService, properties, utils) {
    describe("Metadata service", function() {
        var httpBackend, http, db, q, mockStore, category1;
        var today = "2014-03-24T09:02:49.870Z";
        var yesterday = "2014-03-23T09:02:49.870Z";
        var tomorrow = "2014-03-25T09:02:49.870Z";

        beforeEach(inject(function($injector, $q) {
            q = $q;
            category1 = {
                id: "blah"
            };
            db = {
                objectStore: function() {}
            };
            mockStore = {
                upsert: function() {},
                find: function() {}
            };
            spyOn(db, 'objectStore').and.returnValue(mockStore);
            spyOn(mockStore, 'upsert').and.returnValue(utils.getPromise(q, {
                lastUpdatedTime: today
            }));

            httpBackend = $injector.get('$httpBackend');
            http = $injector.get('$http');
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        var setupLocalFileHttpRequest = function(lastUpdatedTime) {
            httpBackend.expectGET("/data/metadata.json", {
                "Accept": "application/json, text/plain, */*"
            }).respond(200, {
                categories: [category1],
                created: lastUpdatedTime
            });
        };

        it("should fetch all metadata from file the first time", function() {
            var findCall = 0;
            setupLocalFileHttpRequest(today);
            spyOn(mockStore, 'find').and.returnValue(utils.getPromise(q, undefined));
            var metadataService = new MetadataService(db, http);
            metadataService.loadMetadata();

            httpBackend.flush();

            expect(mockStore.upsert).toHaveBeenCalledWith([category1]);
            expect(mockStore.upsert).toHaveBeenCalledWith({
                type: 'metaData',
                lastUpdatedTime: today
            });
            expect(mockStore.upsert.calls.count()).toEqual(2);
        });

        it("should not upsert metaData if import has already happened one time", function() {
            setupLocalFileHttpRequest(today);
            spyOn(mockStore, 'find').and.returnValue(utils.getPromise(q, {
                lastUpdatedTime: tomorrow
            }));
            var metadataService = new MetadataService(db, http);

            metadataService.loadMetadata();
            httpBackend.flush();

            expect(mockStore.upsert.calls.count()).toEqual(0);
        });
    });
});