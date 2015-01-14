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

        var publishToHustle = function(data, type) {
            return hustle.publish({
                "data": data,
                "type": type
            }, "dataValues");
        };

        var publishUploadMessage = function(period, orgUnitId, dataSetId) {
            var hustleDataValuesData = {
                "dataValues": [{
                    "period": period,
                    "orgUnit": orgUnitId
                }]
            };

            var hustleDeleteApprovalData = {
                "ds": [dataSetId],
                "pe": period,
                "ou": orgUnitId
            };

            return q.all([publishToHustle(hustleDataValuesData, "uploadDataValues"),
                publishToHustle(hustleDeleteApprovalData, "deleteApproval")
            ]);
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

            setupData().then(_.curry(setUpVerify)(getRemoteCopy, {}, done, "deleteApprovalDone")).then(_.curry(publishUploadMessage)(period, orgUnitId, datasetId));
        });

        it("should not upload approval data to DHIS, if data is locally approved (not synced to dhis) till level 2 and then re-submitted", function(done) {
            var orgUnitId = "e3e286c6ca8";
            var period = "2015W02";
            var datasetId = "a170b8cd5e5";

            var idbDataValues = dataValueBuilder.build({
                "period": period,
                "lastUpdated": moment().add(2, 'days').toISOString(),
                "values": ["19", "19"]
            });

            var newIdbDataValues = dataValueBuilder.build({
                "period": period,
                "lastUpdated": "2015-01-10T00:00:00",
                "values": ["9", "19"]
            });

            var idbCompletionData = {
                "dataSets": [datasetId],
                "date": "2015-01-08T11:42:41.108Z",
                "orgUnit": orgUnitId,
                "period": period,
                "storedBy": "prj_approver_l1"
            };

            var idbApprovedData = {
                "dataSets": [datasetId],
                "createdDate": "2015-01-08T11:42:41.108Z",
                "orgUnit": orgUnitId,
                "period": period,
                "isAccepted": false,
                "isApproved": true,
                "createdByUsername": "prj_approver_l2"
            };

            var setupData = function() {
                return q.all([idbUtils.upsert("userPreferences", userPrefs),
                    idbUtils.upsert('dataValues', idbDataValues),
                    idbUtils.upsert('completedDataSets', idbCompletionData),
                    idbUtils.upsert('approvedDataSets', idbApprovedData),
                    idbUtils.upsert('dataValues', newIdbDataValues)
                ]);
            };

            var getActualData = function() {
                var level1Params = {
                    "dataSet": "a170b8cd5e5",
                    "startDate": "2014-12-29",
                    "endDate": "2015-01-04",
                    "orgUnit": orgUnitId,
                    "children": true
                };

                var level2Params = {
                    "ds": "a170b8cd5e5",
                    "startDate": "2014-12-29",
                    "endDate": "2015-01-04",
                    "ou": orgUnitId,
                    "pe": "Weekly",
                    "children": true
                };

                return q.all([http.GET("/api/completeDataSetRegistrations.json", level1Params),
                    http.GET("/api/dataApprovals/status.json", level2Params)
                ]).then(function(data) {
                    return [data[0].data,
                        data[1].data.dataApprovalStateResponses[0].state
                    ];
                });
            };

            setupData().then(_.curry(setUpVerify)(getActualData, [{}, 'UNAPPROVED_READY'], done, "deleteApprovalDone")).then(_.curry(publishUploadMessage)(period, orgUnitId, datasetId));
        });

        it("should upload approval data when field app comes online", function(done) {
            var orgUnitId = "e3e286c6ca8";
            var period = "2014W48";
            var datasetId = "a170b8cd5e5";

            var idbDataValues = dataValueBuilder.build({
                "period": period,
                "lastUpdated": moment().add(2, 'days').toISOString(),
                "values": ["19", "19"]
            });

            var idbCompletionData = {
                "dataSets": [datasetId],
                "date": "2015-01-08T11:42:41.108Z",
                "orgUnit": orgUnitId,
                "period": period,
                "status": "NEW",
                "storedBy": "prj_approver_l1"
            };

            var idbApprovedData = {
                "dataSets": [datasetId],
                "createdDate": "2015-01-08T11:42:41.108Z",
                "orgUnit": orgUnitId,
                "period": period,
                "status": "NEW",
                "isAccepted": false,
                "isApproved": true,
                "createdByUsername": "prj_approver_l2"
            };

            var setupData = function() {
                return q.all([idbUtils.upsert("userPreferences", userPrefs),
                    idbUtils.upsert('dataValues', idbDataValues),
                    idbUtils.upsert('completedDataSets', idbCompletionData),
                    idbUtils.upsert('approvedDataSets', idbApprovedData)
                ]);
            };

            var getRemoteCopy = function() {
                var level1Params = {
                    "dataSet": "a170b8cd5e5",
                    "startDate": "2014-11-24",
                    "endDate": "2014-11-30",
                    "orgUnit": orgUnitId,
                    "children": true
                };

                var level2Params = {
                    "ds": "a170b8cd5e5",
                    "startDate": "2014-11-24",
                    "endDate": "2014-11-30",
                    "ou": orgUnitId,
                    "pe": "Weekly",
                    "children": true
                };

                return q.all([http.GET("/api/completeDataSetRegistrations.json", level1Params),
                    http.GET("/api/dataApprovals/status.json", level2Params)
                ]).then(function(data) {
                    return [data[0].data.completeDataSetRegistrations.length,
                        data[1].data.dataApprovalStateResponses[0].state
                    ];
                });
            };

            var publishMessage = function() {
                var hustleDataValuesData = {
                    "dataValues": [{
                        "period": period,
                        "orgUnit": orgUnitId
                    }]
                };

                var hustleDeleteApprovalData = {
                    "ds": [datasetId],
                    "pe": period,
                    "ou": orgUnitId
                };

                var approvalAndCompletionData = {
                    "period": period,
                    "orgUnit": orgUnitId
                };

                return q.all([publishToHustle(hustleDataValuesData, "uploadDataValues"), publishToHustle(hustleDeleteApprovalData, "deleteApproval")]).then(function() {
                    return q.all([publishToHustle(approvalAndCompletionData, "uploadCompletionData"), publishToHustle(approvalAndCompletionData, "uploadApprovalData")]);
                });
            };

            setupData().then(_.curry(setUpVerify)(getRemoteCopy, [1, 'APPROVED_HERE'], done, "uploadApprovalDataDone")).then(publishMessage);
        });

        it("should show local data as approved after next sync cycle if it is approved (L2) on dhis", function(done) {
            var orgUnitId = "e3e286c6ca8";
            var period = "2014W49";
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

            var dhisApprovalData = [{
                "ds": datasetId,
                "pe": period,
                "ou": orgUnitId,
                "ab": "prj_approver_l1",
                "ad": "2015-01-09T12:11:55.567Z"
            }];

            var setupData = function() {
                return q.all([idbUtils.upsert("userPreferences", userPrefs),
                        idbUtils.upsert('dataValues', idbDataValues),
                        idbUtils.upsert('completedDataSets', idbCompletionData),
                        http.POST('/api/dataValueSets', dhisDataValues)
                    ])
                    .then(_.curry(http.POST)('/api/completeDataSetRegistrations/multiple', dhisCompletionData))
                    .then(_.curry(http.POST)('/api/dataApprovals/multiple', dhisApprovalData));
            };

            var getIndexedDBCopy = function() {
                return idbUtils.get('approvedDataSets', [period, orgUnitId]).then(function(data) {
                    return data.isApproved;
                });
            };

            setupData().then(_.curry(setUpVerify)(getIndexedDBCopy, true, done, "downloadDataDone")).then(publishToHustle({}, "downloadData"));
        });

        it("should show local data as unapproved after next sync cycle if another app has resubmitted the data", function(done) {
            var orgUnitId = "e3e286c6ca8";
            var period = "2014W48";
            var atfcDatasetId = "a170b8cd5e5";
            var esDatasetId = "ad7fe0ff2af";

            var idbDataValues = dataValueBuilder.build({
                "period": period,
                "lastUpdated": "2015-01-08T00:00:00",
                "values": ["9", "9"]
            });

            var dhisDataValues = dataValueBuilder.build({
                "period": period,
                "lastUpdated": "2015-01-08T00:00:00",
                "values": ["9", "9"]
            });

            var idbCompletionData = {
                "dataSets": [atfcDatasetId, esDatasetId],
                "date": "2015-01-09T11:42:41.108Z",
                "orgUnit": orgUnitId,
                "period": period,
                "storedBy": "prj_approver_l1"
            };

            var dhisCompletionData = [{
                "ds": atfcDatasetId,
                "pe": period,
                "ou": orgUnitId,
                "sb": "prj_approver_l1",
                "cd": "2015-01-09T12:11:55.567Z",
                "multiOu": true
            }, {
                "ds": esDatasetId,
                "pe": period,
                "ou": orgUnitId,
                "sb": "prj_approver_l1",
                "cd": "2015-01-09T12:11:55.567Z",
                "multiOu": true
            }];

            var dhisApprovalData = [{
                "ds": atfcDatasetId,
                "pe": period,
                "ou": orgUnitId,
                "ab": "prj_approver_l1",
                "ad": "2015-01-09T12:11:55.567Z"
            }, {
                "ds": esDatasetId,
                "pe": period,
                "ou": orgUnitId,
                "ab": "prj_approver_l1",
                "ad": "2015-01-09T12:11:55.567Z"
            }];

            var idbApprovedData = {
                "dataSets": [atfcDatasetId, esDatasetId],
                "createdDate": "2015-01-08T11:42:41.108Z",
                "orgUnit": orgUnitId,
                "period": period,
                "isAccepted": false,
                "isApproved": true,
                "createdByUsername": "prj_approver_l2"
            };

            var dhisUnapprovalData = {
                "ds": datasetId,
                "pe": period,
                "ou": orgUnitId
            };

            var setupData = function() {
                return q.all([idbUtils.upsert("userPreferences", userPrefs),
                        idbUtils.upsert('dataValues', idbDataValues),
                        idbUtils.upsert('completedDataSets', idbCompletionData),
                        idbUtils.upsert('approvedDataSets', idbApprovedData),
                        http.POST('/api/dataValueSets', dhisDataValues)
                    ])
                    .then(_.curry(http.POST)('/api/completeDataSetRegistrations/multiple', dhisCompletionData))
                    .then(_.curry(http.POST)('/api/dataApprovals/multiple', dhisApprovalData))
                    .then(_.curry(http.DELETE)('/api/dataApprovals', dhisUnapprovalData));
            };

            var getIndexedDBCopy = function() {
                return idbUtils.get('approvedDataSets', [period, orgUnitId]);
            };

            setupData().then(_.curry(setUpVerify)(getIndexedDBCopy, undefined, done, "downloadDataDone"))
                .then(_.curry(publishToHustle)({}, "downloadData"));
        });
    });
});
