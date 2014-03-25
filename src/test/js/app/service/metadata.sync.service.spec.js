define(["metadataSyncService", "properties", "utils", "angularMocks"], function(MetadataSyncService, properties, utils) {
    describe("Metadata sync service", function() {
        var httpBackend, http, db, q, mockStore, category1;
        var today = "2014-03-24T09:02:49.870Z";
        var yesterday = "2014-03-24T09:02:49.870Z";
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

        var setupLocalFileHttpRequest = function() {
            httpBackend.expectGET("/data/metadata.json").respond(200, {
                "created": today
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
            setupLocalFileHttpRequest();
            setupMetadataHttpRequest(today, today, [category1]);
            spyOn(mockStore, 'find').and.returnValue(utils.getPromise(q, {
                lastUpdatedTime: today
            }));
            var metadataSyncService = new MetadataSyncService(db, http);

            metadataSyncService.sync();
            httpBackend.flush();

            expect(db.objectStore).toHaveBeenCalledWith("categories");
            expect(mockStore.upsert).toHaveBeenCalledWith([category1]);
        });

        it("should update lastUpdatedTime to 1 day after createdDate", function() {
            setupLocalFileHttpRequest();
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

        it("should fetch all metadata from file the first time", function() {
            var findCall = 0;
            httpBackend.expectGET("/data/metadata.json", {
                "Accept": "application/json, text/plain, */*"
            }).respond(200, {
                categories: [category1],
                created: yesterday
            });
            setupMetadataHttpRequest(yesterday, today, [category1]);
            spyOn(mockStore, 'find').and.callFake(function() {
                if (findCall === 0) {
                    findCall = 1;
                    return utils.getPromise(q, undefined);
                }
                return utils.getPromise(q, {
                    lastUpdatedTime: yesterday
                });
            });
            var metadataSyncService = new MetadataSyncService(db, http);

            metadataSyncService.sync();
            httpBackend.flush();
        });

        it("should not upsert metaData if last updated time is greater than createdDate", function() {
            setupLocalFileHttpRequest();
            setupMetadataHttpRequest(tomorrow, today);
            spyOn(mockStore, 'find').and.returnValue(utils.getPromise(q, {
                lastUpdatedTime: tomorrow
            }));
            var metadataSyncService = new MetadataSyncService(db, http);

            metadataSyncService.sync();
            httpBackend.flush();

            expect(mockStore.upsert.calls.count()).toEqual(1);
        });

    });
});