define(["mergeByLastUpdated"], function(mergeByLastUpdated) {
    describe("merge by union", function() {

        it("should return dhis data if local data is stale", function() {
            var dataFromDhis = {
                'id': 'test1',
                'name': 'test2',
                'lastUpdated': '2015-01-02T10:00:00.000+0000',
            };

            var dataFromDB = {
                'id': 'test1',
                'name': 'test3',
                'lastUpdated': '2015-01-01T10:00:00.000+0000',
            };

            var actualData = mergeByLastUpdated(dataFromDhis, dataFromDB);
            expect(actualData).toEqual(dataFromDhis);
        });

        it("should return undefined if dhis data is stale", function() {
            var dataFromDhis = {
                'id': 'test1',
                'name': 'test2',
                'lastUpdated': '2015-01-01T10:00:00.000+0000',
            };

            var dataFromDB = {
                'id': 'test1',
                'name': 'test3',
                'lastUpdated': '2015-01-02T10:00:00.000+0000',
            };

            var actualData = mergeByLastUpdated(dataFromDhis, dataFromDB);
            expect(actualData).toEqual(undefined);
        });
    });
});
