define(["idbUtils", "httpTestUtils", "dataValueBuilder", "lodash"], function(idbUtils, http, dataValueBuilder, _) {
    describe("sync data values", function() {
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

        var publishUploadMessage = function(period, orgUnitId, requestId) {
            var hustleData = {
                "dataValues": [{
                    "period": period,
                    "orgUnit": orgUnitId
                }]
            };

            return hustle.publish({
                "data": hustleData,
                "type": "uploadDataValues",
                "requestId": requestId
            }, "dataValues");
        };

        var setUpVerify = function(getActualDataCallback, expectedData, requestId, done) {
            var verify = function(actual, expected) {
                var expectedDataValues = expected.dataValues;
                var actualDataValues = actual.dataValues;

                var findCorrespondingActualDV = function(expectedDV) {
                    return _.find(actualDataValues, {
                        'dataElement': expectedDV.dataElement,
                        'categoryOptionCombo': expectedDV.categoryOptionCombo
                    });
                };

                _.forEach(expectedDataValues, function(expectedDV) {
                    var actualDV = findCorrespondingActualDV(expectedDV);
                    expect(actualDV).not.toBeUndefined();
                    expect(actualDV.value).toEqual(expectedDV.value);
                });
            };

            var onSuccess = function(actualData) {
                verify(actualData, expectedData);
                done();
            };

            var onError = function() {
                expect(undefined).toBeDefined();
                done();
            };

            chrome.runtime.onMessage.addListener('uploadDataValuesDone', function(e) {
                console.error("event " + e.detail);
                if (e.detail === requestId) {
                    console.error("asserting " + e.detail);
                    getActualDataCallback.apply().then(onSuccess, onError);
                }
            });

            return q.when([]);
        };

        it("should upload datavalues when there is no conflicts", function(done) {
            var orgUnitId = "e3e286c6ca8";
            var period = "2014W50";
            var datasetId = "a170b8cd5e5";
            var idbData = dataValueBuilder.build({
                "period": period,
                "lastUpdated": "2015-01-08T00:00:00",
                "values": ["10", "10"]
            });

            var setupData = function() {
                return q.all([idbUtils.upsert("userPreferences", userPrefs), idbUtils.upsert('dataValues', idbData)]);
            };

            var getRemoteCopy = function() {
                var params = {
                    "orgUnit": orgUnitId,
                    "children": true,
                    "dataSet": datasetId,
                    "period": period
                };
                return http.GET("/api/dataValueSets.json", params).then(function(data) {
                    return data.data;
                });
            };

            setupData().then(_.curry(setUpVerify)(getRemoteCopy, idbData, 3, done)).then(_.curry(publishUploadMessage)(period, orgUnitId, 3));
        });

        it("should overwrite local changes from dhis data", function(done) {
            var orgUnitId = "e3e286c6ca8";
            var period = "2014W51";
            var datasetId = "a170b8cd5e5";

            var idbData = dataValueBuilder.build({
                "period": period,
                "lastUpdated": "2015-01-01T04:00:00",
                "values": ["9", "9"]
            });

            var dhisData = dataValueBuilder.build({
                "period": period,
                "lastUpdated": "2015-01-02T06:00:00",
                "values": ["19", "19"]
            });

            var setupData = function() {
                return q.all([idbUtils.upsert("userPreferences", userPrefs), http.POST('/api/dataValueSets', dhisData), idbUtils.upsert('dataValues', idbData)]);
            };

            var getLocalCopy = function() {
                return idbUtils.get("dataValues", [period, orgUnitId]);
            };

            setupData().then(_.curry(setUpVerify)(getLocalCopy, dhisData, 1, done)).then(_.curry(publishUploadMessage)(period, orgUnitId, 1));
        });

        it("should ignore remote changes", function(done) {
            var orgUnitId = "e3e286c6ca8";
            var period = "2014W52";
            var datasetId = "a170b8cd5e5";

            var idbData = dataValueBuilder.build({
                "period": period,
                "lastUpdated": "2015-01-02T04:00:00",
                "values": ["88", "88"]
            });

            var dhisData = dataValueBuilder.build({
                "period": period,
                "lastUpdated": "2015-01-01T06:00:00",
                "values": ["19", "19"]
            });

            var setupData = function() {
                return q.all([idbUtils.upsert("userPreferences", userPrefs), http.POST('/api/dataValueSets', dhisData), idbUtils.upsert('dataValues', idbData)]);
            };

            var getRemoteCopy = function() {
                var params = {
                    "orgUnit": orgUnitId,
                    "children": true,
                    "dataSet": datasetId,
                    "period": period
                };
                return http.GET("/api/dataValueSets.json", params).then(function(data) {
                    return data.data;
                });
            };

            setupData().then(_.curry(setUpVerify)(getRemoteCopy, idbData, 2, done)).then(_.curry(publishUploadMessage)(period, orgUnitId, 2));
        });



    });
});