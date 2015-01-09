define(["idbUtils", "httpTestUtils", "dataValueBuilder", "moment", "lodash"], function(idbUtils, http, dataValueBuilder, moment, _) {
    describe("approval scenarios", function() {
        var hustle, q, userPrefs;

        beforeEach(function() {
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
            hustle = dhis.injector.get("$hustle");
            q = dhis.injector.get("$q");
            userPrefs = {
                "username": "prj_user",
                "orgUnits": [{
                    "name": "TestProj",
                    "id": "a8707b4af7a"
                }]
            };
        });

        afterEach(function() {
            return idbUtils.clear("dataValues");
        });

        var publishUploadMessage = function(period, orgUnitId) {
            var hustleData = {
                "dataValues": [{
                    "period": period,
                    "orgUnit": orgUnitId
                }]
            };

            return hustle.publish({
                "data": hustleData,
                "type": "uploadDataValues"
            }, "dataValues");
        };

        var setUpVerify = function(getActualDataCallback, expectedData, done) {
            var verify = function(actual, expected) {
                expect(actual).toEqual(expected);
            };

            var onSuccess = function(actualData) {
                verify(actualData, expectedData);
                done();
            };

            var onError = function() {
                expect(undefined).toBeDefined();
                done();
            };

            chrome.runtime.onMessage.addListener('uploadDataValuesDone', function() {
                getActualDataCallback.apply().then(onSuccess, onError);
            });

            return q.when([]);
        };

        it("should delete level one approval on re-submission", function(done) {
            var orgUnitId = "e3e286c6ca8";
            var period = "2015W01";
            var datasetId = "a170b8cd5e5";

            var idbDataValues = dataValueBuilder.build({
                "period": period,
                "lastUpdated": moment().add(2, 'days').toISOString(),
                "values": ["19", "19"]
            });

            var dhisDataValues = dataValueBuilder.build({
                "period": period,
                "lastUpdated": "2015-01-08T00:00:00",
                "values": ["9", "9"]
            });

            var idbCompletionData = {
                "dataSets": [datasetId],
                "date": "2015-01-09T11:42:41.108Z",
                "orgUnit": orgUnitId,
                "period": period,
                "storedBy": "prj_approver_l1"
            };

            var dhisCompletionData = [{
                "ds": datasetId,
                "pe": period,
                "ou": orgUnitId,
                "sb": "prj_approver_l1",
                "cd": "2015-01-09T12:11:55.567Z",
                "multiOu": true
            }];

            var setupData = function() {
                return q.all([idbUtils.upsert("userPreferences", userPrefs),
                    idbUtils.upsert('dataValues', idbDataValues),
                    idbUtils.upsert('completedDataSets', idbCompletionData),
                    http.POST('/api/dataValueSets', dhisDataValues)
                ]).then(_.curry(http.POST)('/api/completeDataSetRegistrations/multiple', dhisCompletionData));
            };

            var getRemoteCopy = function() {
                var params = {
                    "dataSet": "a170b8cd5e5",
                    "startDate": "2014-12-29",
                    "endDate": "2015-01-04",
                    "orgUnit": orgUnitId,
                    "children": true
                };
                return http.GET("/api/completeDataSetRegistrations.json", params).then(function(data) {
                    return data.data;
                });
            };

            setupData().then(_.curry(setUpVerify)(getRemoteCopy, undefined, done)).then(_.curry(publishUploadMessage)(period, orgUnitId));
        });
    });
});
