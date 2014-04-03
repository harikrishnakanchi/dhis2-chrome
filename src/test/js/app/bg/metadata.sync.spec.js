define(["metadataSync", "Q", "utils", "properties"], function(metadataSync, q, utils, properties) {
    describe("Metadata sync service", function() {
        var db, mockStore, category1, data;
        var today = "2014-03-24T09:02:49.870Z";
        var yesterday = "2014-03-23T09:02:49.870Z";
        var tomorrow = "2014-03-25T09:02:49.870Z";

        beforeEach(function() {
            category1 = {
                id: "blah"
            };
            Q = q;
            data = {
                categories: [category1],
                created: tomorrow
            };

            idb = {
                "openDb": function() {},
                "get": function() {},
                "put": function() {},
                "usingTransaction": function() {},
            };

            httpWrapper = {
                "get": function() {}
            };

            spyOn(idb, "openDb").and.returnValue(utils.getPromise(q, {}));
        });

        afterEach(function() {

        });

        it("should fetch all metadata from file the first time", function(done) {
            spyOn(httpWrapper, "get").and.returnValue(utils.getPromise(q, data));
            spyOn(idb, "get").and.returnValue(utils.getPromise(q, {
                "lastUpdatedTime": today
            }));
            spyOn(idb, "usingTransaction").and.callFake(function(stores, fn) {
                return fn();
            });
            spyOn(idb, "put").and.returnValue(utils.getPromise(q, {}));

            metadataSync.sync().then(function() {
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
    });
});