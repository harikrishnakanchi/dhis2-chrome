define(["metadataSyncService", "Q", "utils", "properties", "idb", "httpWrapper"], function(metadataSyncService, q, utils, properties, idb, httpWrapper) {
    describe("Metadata sync service", function() {
        var category1, data;
        var today = "2014-03-24T09:02:49.870Z";
        var yesterday = "2014-03-23T09:02:49.870Z";
        var tomorrow = "2014-03-25T09:02:49.870Z";

        beforeEach(function() {
            category1 = {
                id: "blah"
            };
            data = {
                categories: [category1],
                created: tomorrow
            };

            spyOn(idb, "openDb").and.returnValue(utils.getPromise(q, {}));
        });

        afterEach(function() {

        });

        it("should sync metadata and update changelog", function(done) {
            spyOn(httpWrapper, "get").and.returnValue(utils.getPromise(q, data));
            spyOn(idb, "get").and.returnValue(utils.getPromise(q, {
                "lastUpdatedTime": today
            }));
            spyOn(idb, "usingTransaction").and.callFake(function(stores, fn) {
                return fn();
            });
            spyOn(idb, "put").and.returnValue(utils.getPromise(q, {}));

            metadataSyncService.sync().then(function() {
                expect(httpWrapper.get.calls.argsFor(0)[0]).toEqual(properties.metadata.url + '?lastUpdated=' + today);
                expect(idb.put.calls.allArgs()).toEqual([
                    ['categories', category1, undefined],
                    ['changeLog', {
                        type: 'metaData',
                        lastUpdatedTime: tomorrow
                    }]
                ]);
                done();
            });
        });

        it("should pull all metadata if syncing for the first time", function(done) {
            spyOn(httpWrapper, "get").and.returnValue(utils.getPromise(q, data));
            spyOn(idb, "get").and.returnValue(utils.getPromise(q, undefined));
            spyOn(idb, "usingTransaction").and.callFake(function(stores, fn) {
                return fn();
            });
            spyOn(idb, "put").and.returnValue(utils.getPromise(q, {}));

            metadataSyncService.sync().then(function() {
                expect(httpWrapper.get.calls.argsFor(0)[0]).toEqual(properties.metadata.url);
                expect(idb.put.calls.allArgs()).toEqual([
                    ['categories', category1, undefined],
                    ['changeLog', {
                        type: 'metaData',
                        lastUpdatedTime: tomorrow
                    }]
                ]);
                done();
            });
        });
    });
});