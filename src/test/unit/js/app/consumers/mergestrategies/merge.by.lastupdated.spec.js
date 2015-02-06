define(["mergeByLastUpdated"], function(mergeByLastUpdated) {
    describe("merge by last updated", function() {

        it("should return dhis data if local data does not exist", function() {
            var dataFromDhis = {
                'id': 'test1',
                'name': 'test2',
                'lastUpdated': '2015-01-02T10:00:00.000+0000',
            };

            var dataFromDB;

            var actualData = mergeByLastUpdated(dataFromDhis, dataFromDB);
            expect(actualData).toEqual(dataFromDhis);
        });

        it("should return dhis data if dhis data has been updated after local data was downloaded", function() {
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

        it("should return undefined if local data has been updated after dhis", function() {
            var dataFromDhis = {
                'id': 'test1',
                'name': 'test2',
                'lastUpdated': '2015-01-01T10:00:00.000+0000',
            };

            var dataFromDB = {
                'id': 'test1',
                'name': 'test3',
                'lastUpdated': '2015-01-02T10:00:00.000+0000',
                'clientLastUpdated': '2015-01-02T11:00:00.000+0000',
            };

            var actualData = mergeByLastUpdated(dataFromDhis, dataFromDB);
            expect(actualData).toEqual(undefined);
        });

        it("should return undefined even if dhis has been updated after download as long as local data timestamp is greater", function() {
            var dataFromDhis = {
                'id': 'test1',
                'name': 'test2',
                'lastUpdated': '2015-01-02T10:00:00.000+0000',
            };

            var dataFromDB = {
                'id': 'test1',
                'name': 'test3',
                'lastUpdated': '2015-01-01T10:00:00.000+0000',
                'clientLastUpdated': '2015-01-02T11:00:00.000+0000',
            };

            var actualData = mergeByLastUpdated(dataFromDhis, dataFromDB);
            expect(actualData).toEqual(undefined);
        });

        it("should return dhis data if dhis data has changed after download and after local data was updated", function() {
            var dataFromDhis = {
                'id': 'test1',
                'name': 'test2',
                'lastUpdated': '2015-01-02T12:00:00.000+0000',
            };

            var dataFromDB = {
                'id': 'test1',
                'name': 'test3',
                'lastUpdated': '2015-01-01T10:00:00.000+0000',
                'clientLastUpdated': '2015-01-02T11:00:00.000+0000',
            };

            var actualData = mergeByLastUpdated(dataFromDhis, dataFromDB);
            expect(actualData).toEqual(dataFromDhis);
        });


    });
});
