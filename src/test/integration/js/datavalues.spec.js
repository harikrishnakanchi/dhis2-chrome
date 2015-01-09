define(["idbUtils", "httpTestUtils", "testData", "lodash"], function(idbUtils, http, testData, _) {
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

        var verify = function(actual, expected) {
            var expectedDataValues = expected.dataValues;
            var actualDataValues = actual.dataValues;

            var findCorrespondingActualDV = function(expectedDV) {
                return _.find(actualDataValues, {
                    'dataElement': expectedDV.dataElement,
                    'categoryOptionCombo': expectedDV.categoryOptionCombo,
                    'attributeOptionCombo': expectedDV.attributeOptionCombo
                });
            };

            _.forEach(expectedDataValues, function(expectedDV) {
                var actualDV = findCorrespondingActualDV(expectedDV);
                expect(actualDV).not.toBeUndefined();
                expect(actualDV.value).toEqual(expectedDV.value);
            });
        };

        var setUpVerify = function(getActualDataCallback, expectedData, done) {
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

            chrome.runtime.onMessage.addListener('uploadDataValuesFailed', function() {
                console.error("hustle publish failed");
                expect(undefined).toBeDefined();
                done();
            });

            return q.when([]);
        };

        it("should upload datavalues when there is no conflicts", function(done) {
            var orgUnitId = "e3e286c6ca8";
            var period = "2014W50";
            var datasetId = "a170b8cd5e5";
            var idbData = testData.uploadDataValues1_IDBPayload;

            var setupData = function() {
                return q.all([idbUtils.upsert("userPreferences", userPrefs), idbUtils.upsert('dataValues', idbData)]);
            };

            var remoteCopy = function() {
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

            setupData().then(_.curry(setUpVerify)(remoteCopy, idbData, done)).then(_.curry(publishUploadMessage)(period, orgUnitId));
        });

        it("should reject local data values on uploadDataValues", function(done) {
            var orgUnitId = "e3e286c6ca8";
            var period = "2014W51";
            var datasetId = "a170b8cd5e5";
            var idbData = testData.uploadDataValues2_IDBPayload;
            var dhisData = testData.uploadDataValues2_DHISPayload;

            var setupData = function() {
                return q.all([idbUtils.upsert("userPreferences", userPrefs), http.POST('/api/dataValueSets', dhisData), idbUtils.upsert('dataValues', idbData)]);
            };

            var localCopy = function() {
                return idbUtils.get("dataValues", [period, orgUnitId]);
            };

            setupData().then(_.curry(setUpVerify)(localCopy, dhisData, done)).then(_.curry(publishUploadMessage)(period, orgUnitId));
        });
    });
});
