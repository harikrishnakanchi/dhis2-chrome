define(["metadataSyncService", "properties", "utils", "angularMocks"], function(MetadataSyncService, properties, utils) {
    describe("Metadata sync service", function() {
        var httpBackend, http, db, q, mockStore, category1;

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
            spyOn(mockStore, 'upsert');

            httpBackend = $injector.get('$httpBackend');
            http = $injector.get('$http');
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        it("should upsert data to object stores", function() {
            httpBackend.expectGET(properties.metadata.url + "?lastUpdated=2014-03-24T09:02:49.870+0000", {
                "Authorization": properties.metadata.auth_header,
                "Accept": "application/json, text/plain, */*"
            }).respond(200, {
                categories: [category1],
                created: "2014-03-24T09:02:49.870+0000"
            });
            spyOn(mockStore, 'find').and.returnValue(utils.getPromise(q, {lastUpdatedTime: "2014-03-24T09:02:49.870+0000"}));
            var metadataSyncService = new MetadataSyncService(db, http);

            metadataSyncService.sync();
            httpBackend.flush();

            expect(db.objectStore).toHaveBeenCalledWith("categories");
            expect(mockStore.upsert).toHaveBeenCalledWith([category1]);
        });

        it("should update lastUpdatedTime to 1 day after createdDate", function() {
            var time = "2014-03-24T09:02:49.870+0000";
            httpBackend.expectGET(properties.metadata.url + "?lastUpdated="+time, {
                "Authorization": properties.metadata.auth_header,
                "Accept": "application/json, text/plain, */*"
            }).respond(200, {
                categories: [category1],
                created: time
            });
            spyOn(mockStore, 'find').and.returnValue(utils.getPromise(q, {lastUpdatedTime: time}));
            var metadataSyncService = new MetadataSyncService(db, http);

            metadataSyncService.sync();
            httpBackend.flush();

            expect(mockStore.upsert).toHaveBeenCalledWith({"type":"metaData", "lastUpdatedTime":"2014-03-24T09:02:49.870Z"});
        });        

        it("should fetch all metadata the first time", function() {
            httpBackend.expectGET(properties.metadata.url, {
                "Authorization": properties.metadata.auth_header,
                "Accept": "application/json, text/plain, */*"
            }).respond(200, {
                categories: [category1],
                created: "2014-03-24T09:02:49.870+0000"
            });
            spyOn(mockStore, 'find').and.returnValue(utils.getPromise(q, undefined));
            var metadataSyncService = new MetadataSyncService(db, http);

            metadataSyncService.sync();
            httpBackend.flush();
        });

        it("should not upsert metaData if last updated time is greater than createdDate", function() {
            var time = "2014-03-25T09:02:49.870+0000";
            httpBackend.expectGET(properties.metadata.url + "?lastUpdated="+time, {
                "Authorization": properties.metadata.auth_header,
                "Accept": "application/json, text/plain, */*"
            }).respond(200, {
                created: "2014-03-24T09:02:49.870Z"
            });
            spyOn(mockStore, 'find').and.returnValue(utils.getPromise(q, {lastUpdatedTime: time}));
            var metadataSyncService = new MetadataSyncService(db, http);

            metadataSyncService.sync();
            httpBackend.flush();

            expect(mockStore.upsert.calls.count()).toEqual(1);
        });
    });
});