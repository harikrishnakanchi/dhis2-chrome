define(["mergeByLastUpdated"], function(mergeByLastUpdated) {
    describe("merge by last updated", function() {

        it("should merge dhis and local lists correctly even when they are not in the same order", function() {

            var test1Data = {
                'id': 'test1',
                'name': 'test1',
                'lastUpdated': '2015-01-02T12:00:00.000+0000',
            };

            var updatedTest2Data = {
                'id': 'test2',
                'name': 'New test2',
                'lastUpdated': '2015-01-02T13:00:00.000+0000',
            };

            var staleTest2Data = {
                'id': 'test2',
                'name': 'test2',
                'lastUpdated': '2015-01-02T12:00:00.000+0000',
            };

            var dataFromDhis = [test1Data, updatedTest2Data];
            var dataFromDB = [staleTest2Data, test1Data];

            var actualData = mergeByLastUpdated(dataFromDhis, dataFromDB);
            expect(actualData).toEqual([test1Data, updatedTest2Data]);
        });

        it("should return dhis data if local data does not exist", function() {
            var dataFromDhis = [{
                'id': 'test1',
                'name': 'test2',
                'lastUpdated': '2015-01-02T10:00:00.000+0000',
            }];

            var dataFromDB;

            var actualData = mergeByLastUpdated(dataFromDhis, dataFromDB);
            expect(actualData).toEqual(dataFromDhis);
        });

        it("should return dhis data if dhis data has been updated after local data was downloaded", function() {
            var dataFromDhis = [{
                'id': 'test1',
                'name': 'test2',
                'lastUpdated': '2015-01-02T10:00:00.000+0000',
            }];

            var dataFromDB = [{
                'id': 'test1',
                'name': 'test3',
                'lastUpdated': '2015-01-01T10:00:00.000+0000',
            }];

            var actualData = mergeByLastUpdated(dataFromDhis, dataFromDB);
            expect(actualData).toEqual(dataFromDhis);
        });

        it("should return local data if local data has been updated after dhis", function() {
            var dataFromDhis = [{
                'id': 'test1',
                'name': 'test2',
                'lastUpdated': '2015-01-01T10:00:00.000+0000',
            }];

            var dataFromDB = [{
                'id': 'test1',
                'name': 'test3',
                'lastUpdated': '2015-01-02T10:00:00.000+0000',
                'clientLastUpdated': '2015-01-02T11:00:00.000+0000',
            }];

            var actualData = mergeByLastUpdated(dataFromDhis, dataFromDB);
            expect(actualData).toEqual(dataFromDB);
        });

        it("should return local data even if dhis has been updated after download as long as local data timestamp is greater", function() {
            var dataFromDhis = [{
                'id': 'test1',
                'name': 'test2',
                'lastUpdated': '2015-01-02T10:00:00.000+0000',
            }];

            var dataFromDB = [{
                'id': 'test1',
                'name': 'test3',
                'lastUpdated': '2015-01-01T10:00:00.000+0000',
                'clientLastUpdated': '2015-01-02T11:00:00.000+0000',
            }];

            var actualData = mergeByLastUpdated(dataFromDhis, dataFromDB);
            expect(actualData).toEqual(dataFromDB);
        });

        it("should return dhis data if dhis data has changed after download and after local data was updated", function() {
            var dataFromDhis = [{
                'id': 'test1',
                'name': 'test2',
                'lastUpdated': '2015-01-02T12:00:00.000+0000',
            }];

            var dataFromDB = [{
                'id': 'test1',
                'name': 'test3',
                'lastUpdated': '2015-01-01T10:00:00.000+0000',
                'clientLastUpdated': '2015-01-02T11:00:00.000+0000',
            }];

            var actualData = mergeByLastUpdated(dataFromDhis, dataFromDB);
            expect(actualData).toEqual(dataFromDhis);
        });

    });
});
