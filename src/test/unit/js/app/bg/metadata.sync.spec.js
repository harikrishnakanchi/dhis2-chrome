define(["metadataSyncService", "Q", "utils", "properties", "idb", "httpWrapper"], function(metadataSyncService, q, utils, properties, idb, httpWrapper) {
    describe("Metadata sync service", function() {
        var category1, data, systemSettings, translations;
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
            systemSettings = {
                "proj_0": "{\"excludedDataElements\": {\"module1\": [\"DE1\", \"DE2\"]}}"
            };
            translations = {
                "translations": [{
                    "id": "blah",
                    "locale": "es"
                }]
            };

            spyOn(idb, "openDb").and.returnValue(utils.getPromise(q, {}));
        });

        afterEach(function() {

        });

        it("should sync metadata and update changelog", function(done) {
            var ctr = 0;
            spyOn(httpWrapper, "get").and.callFake(function() {
                var retVals = {
                    1: utils.getPromise(q, data),
                    2: utils.getPromise(q, systemSettings),
                    3: utils.getPromise(q, translations)
                };
                ctr++;
                return retVals[ctr];
            });
            spyOn(idb, "get").and.returnValue(utils.getPromise(q, {
                "lastUpdatedTime": today
            }));
            spyOn(idb, "usingTransaction").and.callFake(function(stores, fn) {
                return fn();
            });
            spyOn(idb, "put").and.returnValue(utils.getPromise(q, {}));

            metadataSyncService.sync().then(function() {
                expect(httpWrapper.get.calls.argsFor(0)[0]).toEqual(properties.dhis.url + "/api/metaData" + '?lastUpdated=' + today);
                expect(httpWrapper.get.calls.argsFor(1)[0]).toEqual(properties.dhis.url + "/api/systemSettings");
                expect(httpWrapper.get.calls.argsFor(2)[0]).toEqual(properties.dhis.url + "/api/translations");
                expect(idb.put.calls.allArgs()).toEqual([
                    ['categories', category1, undefined],
                    ['changeLog', {
                        type: 'metaData',
                        lastUpdatedTime: tomorrow
                    }],
                    ['systemSettings', {
                            "key": 'proj_0',
                            "value": {
                                excludedDataElements: {
                                    module1: ['DE1', 'DE2']
                                }
                            }
                        },
                        undefined
                    ],
                    ['translations', {
                            id: 'blah',
                            locale: 'es'
                        },
                        undefined
                    ]
                ]);
                done();
            });
        });

        it("should pull all metadata if syncing for the first time", function(done) {
            var ctr = 0;
            spyOn(httpWrapper, "get").and.callFake(function() {
                var retVals = {
                    1: utils.getPromise(q, data),
                    2: utils.getPromise(q, systemSettings),
                    3: utils.getPromise(q, translations)
                };
                ctr++;
                return retVals[ctr];
            });
            spyOn(idb, "get").and.returnValue(utils.getPromise(q, undefined));
            spyOn(idb, "usingTransaction").and.callFake(function(stores, fn) {
                return fn();
            });
            spyOn(idb, "put").and.returnValue(utils.getPromise(q, {}));

            metadataSyncService.sync().then(function() {
                expect(httpWrapper.get.calls.argsFor(0)[0]).toEqual(properties.dhis.url + "/api/metaData");
                expect(httpWrapper.get.calls.argsFor(1)[0]).toEqual(properties.dhis.url + "/api/systemSettings");
                expect(idb.put.calls.allArgs()).toEqual([
                    ['categories', category1, undefined],
                    ['changeLog', {
                        type: 'metaData',
                        lastUpdatedTime: tomorrow
                    }],
                    ['systemSettings', {
                            key: 'proj_0',
                            value: {
                                excludedDataElements: {
                                    module1: ['DE1', 'DE2']
                                }
                            }
                        },
                        undefined
                    ],
                    ['translations', {
                            id: 'blah',
                            locale: 'es'
                        },
                        undefined
                    ]
                ]);
                done();
            });
        });
    });
});