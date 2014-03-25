define(["metadataSyncService", "properties", "utils", "angularMocks"], function(MetadataSyncService, properties, utils) {
    describe("Metadata sync service", function() {
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

        var setupMetadataHttpRequest = function(lastUpdatedTime, createdTime, categories) {
            httpBackend.expectGET(properties.metadata.url + "?lastUpdated=" + lastUpdatedTime, {
                "Authorization": properties.metadata.auth_header,
                "Accept": "application/json, text/plain, */*"
            }).respond(200, {
                categories: categories,
                created: createdTime
            });
        };

        it("should upsert data to object stores", function() {
            setupLocalFileHttpRequest(today);
            setupMetadataHttpRequest(today, today, [category1]);
            spyOn(mockStore, 'find').and.returnValue(utils.getPromise(q, {
                lastUpdatedTime: today
            }));
            var metadataSyncService = new MetadataSyncService(db, http);

            metadataSyncService.sync();
            httpBackend.flush();

            expect(db.objectStore).toHaveBeenCalledWith("categories");
            expect(mockStore.upsert).toHaveBeenCalledWith([category1]);
            expect(mockStore.upsert.calls.count()).toEqual(2);
        });

        it("should update lastUpdatedTime to 1 day after createdDate", function() {
            setupLocalFileHttpRequest(today);
            setupMetadataHttpRequest(today, today, [category1]);
            spyOn(mockStore, 'find').and.returnValue(utils.getPromise(q, {
                lastUpdatedTime: today
            }));
            var metadataSyncService = new MetadataSyncService(db, http);

            metadataSyncService.sync();
            httpBackend.flush();

            expect(mockStore.upsert).toHaveBeenCalledWith({
                "type": "metaData",
                "lastUpdatedTime": today
            });
        });

        it("should fetch all metadata from file the first time and then use http to fetch metadata", function() {
            var findCall = 0;
            setupLocalFileHttpRequest(today);
            setupMetadataHttpRequest(today, tomorrow, [category1]);
            spyOn(mockStore, 'find').and.returnValue(utils.getPromise(q, undefined));
            var metadataSyncService = new MetadataSyncService(db, http);

            metadataSyncService.sync();
            httpBackend.flush();

            expect(mockStore.upsert.calls.count()).toEqual(4);
        });

        it("should not upsert metaData if last updated time is greater than createdDate", function() {
            setupLocalFileHttpRequest(today);
            setupMetadataHttpRequest(tomorrow, today);
            spyOn(mockStore, 'find').and.returnValue(utils.getPromise(q, {
                lastUpdatedTime: tomorrow
            }));
            var metadataSyncService = new MetadataSyncService(db, http);

            metadataSyncService.sync();
            httpBackend.flush();

            expect(mockStore.upsert.calls.count()).toEqual(1);
        });

        it("should fetch all metadata from file when app is reinstalled and then use http to fetch metadata", function() {
            var findCall = 0;
            setupLocalFileHttpRequest(today);
            setupMetadataHttpRequest(today, today, [category1]);
            spyOn(mockStore, 'find').and.returnValue(utils.getPromise(q, {
                lastUpdatedTime: yesterday
            }));
            var metadataSyncService = new MetadataSyncService(db, http);

            metadataSyncService.sync();
            httpBackend.flush();

            expect(mockStore.upsert.calls.count()).toEqual(4);
        });
    });
});