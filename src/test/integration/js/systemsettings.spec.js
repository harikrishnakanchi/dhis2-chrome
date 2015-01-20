define(["idbUtils", "httpTestUtils", "dataValueBuilder", "moment", "lodash"], function(idbUtils, http, dataValueBuilder, moment, _) {
    describe("system setting scenarios", function() {
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

        var publishToHustle = function(data, type) {
            return hustle.publish({
                "data": data,
                "type": type
            }, "dataValues");
        };

        var setUpVerify = function(getActualDataCallback, expectedData, done, message) {
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

            chrome.runtime.onMessage.addListener(message, function() {
                getActualDataCallback.apply().then(onSuccess, onError);
            });

            return q.when([]);
        };

        it("should update system setting for a particular project , if it was last updated by the same application", function(done) {

            var projectID = "213046e2707";

            var existingSettings = {
                "excludedDataElements": {
                    "af007b0ce77": [],
                    "e3e286c6ca8": ["ab9634a7827"]
                }
            };

            var existingSystemSettingsInIndexedDB = {
                "key": projectID,
                "value": existingSettings
            };

            var settingsUpdated = {
                "excludedDataElements": {
                    "af007b0ce77": [],
                    "e3e286c6ca8": []
                }
            };

            var updatedSystemSettings = {
                "projectId": projectID,
                "settings": settingsUpdated
            };


            updatedSystemSettings.indexedDbOldSystemSettings = _.cloneDeep(existingSettings);

            var existingSystemSettingsInDhis = _.cloneDeep(existingSettings);

            var setupData = function() {
                return q.all([idbUtils.upsert("userPreferences", userPrefs),
                    idbUtils.upsert('systemSettings', existingSystemSettingsInIndexedDB),
                    http.POST("/api/systemSettings/" + projectID, JSON.stringify(existingSystemSettingsInDhis), {
                        'Content-Type': 'text/plain'
                    })
                ]);
            };

            var getRemoteValue = function() {
                return http.GET("/api/systemSettings/" + projectID, "").then(function(data) {
                    return data.data;
                });
            };

            setupData()
                .then(_.bind(setUpVerify, undefined, getRemoteValue, settingsUpdated, done, "excludeDataElementsDone"))
                .then(_.bind(publishToHustle, undefined, updatedSystemSettings, "excludeDataElements"));
        });

    });
});
