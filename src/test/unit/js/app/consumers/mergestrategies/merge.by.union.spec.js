define(["mergeByUnion"], function(mergeByUnion) {
    describe("merge by union", function() {
        it("should return merged data if local copy is stale", function() {
            var remoteCopy = [{
                "id": "data1",
                "name": "data1",
                "lastUpdated": "2014-05-30T12:43:54.972Z",
                "organisationUnits": [{
                    "id": "org1",
                    "name": "org1"
                }, {
                    "id": "org2",
                    "name": "org2"
                }]
            }];

            var localCopy = [{
                "id": "data1",
                "name": "data1",
                "lastUpdated": "2014-05-29T12:43:54.972Z",
                "organisationUnits": [{
                    "id": "org1",
                    "name": "org1"
                }, {
                    "id": "org3",
                    "name": "org3"
                }]
            }];

            var expectedMergedCopy = [{
                "id": "data1",
                "name": "data1",
                "lastUpdated": "2014-05-30T12:43:54.972Z",
                "organisationUnits": [{
                    "id": "org1",
                    "name": "org1"
                }, {
                    "id": "org2",
                    "name": "org2"
                }, {
                    "id": "org3",
                    "name": "org3"
                }]
            }];

            var actualMergedCopy = mergeByUnion("organisationUnits", remoteCopy, localCopy);

            expect(actualMergedCopy).toEqual(expectedMergedCopy);
        });

        it("should not merge the data and return undefined if local copy is not stale", function() {
            var remoteCopy = [{
                "id": "data1",
                "name": "data1",
                "lastUpdated": "2014-05-28T12:43:54.972Z",
                "organisationUnits": [{
                    "id": "org1",
                    "name": "org1"
                }, {
                    "id": "org2",
                    "name": "org2"
                }]
            }];

            var localCopy = [{
                "id": "data1",
                "name": "data1",
                "lastUpdated": "2014-05-29T12:43:54.972Z",
                "organisationUnits": [{
                    "id": "org1",
                    "name": "org1"
                }, {
                    "id": "org2",
                    "name": "org2"
                }]
            }];

            var actualMergedCopy = mergeByUnion("organisationUnits", remoteCopy, localCopy);

            expect(actualMergedCopy.length).toEqual(0);
        });

        it("should return remote data if there is no local data", function() {
            var remoteCopy = [{
                "id": "data1",
                "name": "data1",
                "lastUpdated": "2014-05-28T12:43:54.972Z",
                "organisationUnits": [{
                    "id": "org1",
                    "name": "org1"
                }, {
                    "id": "org2",
                    "name": "org2"
                }]
            }];

            var localCopy;

            var actualMergedCopy = mergeByUnion("organisationUnits", remoteCopy, localCopy);

            expect(actualMergedCopy).toEqual(remoteCopy);
        });

    });
});
