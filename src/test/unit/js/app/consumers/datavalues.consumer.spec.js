define(["dataValuesConsumer", "angularMocks", "properties", "utils", "dataService", "dataRepository", "dataSetRepository", "userPreferenceRepository", "approvalService"],
    function(DataValuesConsumer, mocks, properties, utils, DataService, DataRepository, DataSetRepository, UserPreferenceRepository, ApprovalService) {
        describe("data values service", function() {

            var dataService, dataRepository, dataSetRepository, userPreferenceRepository, q, scope, allDataSets, userPref, dataValuesConsumer, message, approvalService;

            beforeEach(mocks.inject(function($q, $rootScope) {
                q = $q;
                scope = $rootScope.$new();

                dataService = new DataService();
                dataRepository = new DataRepository();
                dataSetRepository = new DataSetRepository();
                userPreferenceRepository = new UserPreferenceRepository();
                approvalService = new ApprovalService();

                dataValuesConsumer = new DataValuesConsumer(dataService, dataRepository, dataSetRepository, userPreferenceRepository, q, approvalService);

                userPref = [{
                    "orgUnits": [{
                        "id": "org_0"
                    }]
                }];

                allDataSets = [{
                    "id": "DS_OPD"
                }];

                message = {
                    "data": {
                        "type": "downloadDataValues"
                    }
                };

            }));

            it("should download data values if org units and datasets are present and there is no data to upload", function() {
                spyOn(userPreferenceRepository, "getAll").and.returnValue(utils.getPromise(q, userPref));
                spyOn(dataSetRepository, "getAll").and.returnValue(utils.getPromise(q, allDataSets));
                spyOn(dataRepository, "save");
                spyOn(dataService, "downloadAllData").and.returnValue(utils.getPromise(q, []));
                spyOn(dataService, "save");

                dataValuesConsumer.run(message);
                scope.$apply();

                expect(userPreferenceRepository.getAll).toHaveBeenCalled();
                expect(dataSetRepository.getAll).toHaveBeenCalled();
                expect(dataService.downloadAllData).toHaveBeenCalled();
                expect(dataService.save).not.toHaveBeenCalled();
            });

            it("should upload datavalues if data to upload has no conflicts and save merged data values to idb", function() {
                var dataValuesToUpload = {
                    "dataValues": [{
                        "id": 1,
                        "dataElement": "DE1",
                        "period": "2014W12",
                        "orgUnit": "MSF_0",
                        "categoryOptionCombo": "C1",
                        "lastUpdated": "2014-05-27T09:25:37.120Z"
                    }]
                };
                var downloadedDataValues = {
                    "dataValues": [{
                        "id": 1,
                        "dataElement": "DE1",
                        "period": "2014W12",
                        "orgUnit": "MSF_0",
                        "categoryOptionCombo": "C1",
                        "lastUpdated": "2014-05-27T09:00:00.120Z"
                    }, {
                        "id": 2,
                        "dataElement": "DE2",
                        "period": "2014W12",
                        "orgUnit": "MSF_0",
                        "categoryOptionCombo": "C2",
                        "lastUpdated": "2014-05-27T09:00:00.120Z"
                    }]
                };
                var mergedDataValues = {
                    "dataValues": [{
                        "id": 1,
                        "dataElement": "DE1",
                        "period": "2014W12",
                        "orgUnit": "MSF_0",
                        "categoryOptionCombo": "C1",
                        "lastUpdated": "2014-05-27T09:25:37.120Z"
                    }, {
                        "id": 2,
                        "dataElement": "DE2",
                        "period": "2014W12",
                        "orgUnit": "MSF_0",
                        "categoryOptionCombo": "C2",
                        "lastUpdated": "2014-05-27T09:00:00.120Z"
                    }]
                };
                message.data.data = dataValuesToUpload;
                message.data.type = "uploadDataValues";

                spyOn(userPreferenceRepository, "getAll").and.returnValue(utils.getPromise(q, userPref));
                spyOn(dataSetRepository, "getAll").and.returnValue(utils.getPromise(q, allDataSets));
                spyOn(dataRepository, "save");
                spyOn(dataService, "downloadAllData").and.returnValue(utils.getPromise(q, downloadedDataValues));
                spyOn(dataService, "save");

                dataValuesConsumer.run(message);
                scope.$apply();

                expect(userPreferenceRepository.getAll).toHaveBeenCalled();
                expect(dataSetRepository.getAll).toHaveBeenCalled();
                expect(dataService.downloadAllData).toHaveBeenCalled();
                expect(dataRepository.save).toHaveBeenCalledWith(mergedDataValues);
                expect(dataService.save).toHaveBeenCalledWith(dataValuesToUpload);
            });

            it("should download but not upload datavalues if data to upload has conflicts", function() {
                var dataValuesToUpload = {
                    "dataValues": [{
                        "id": 1,
                        "dataElement": "DE1",
                        "period": "2014W12",
                        "orgUnit": "MSF_0",
                        "categoryOptionCombo": "C1",
                        "lastUpdated": "2014-05-27T08:25:37.120Z"
                    }]
                };
                var downloadedDataValues = {
                    "dataValues": [{
                        "id": 1,
                        "dataElement": "DE1",
                        "period": "2014W12",
                        "orgUnit": "MSF_0",
                        "categoryOptionCombo": "C1",
                        "lastUpdated": "2014-05-27T09:00:00.120Z"
                    }]
                };
                message.data.data = dataValuesToUpload;
                message.data.type = "uploadDataValues";

                spyOn(userPreferenceRepository, "getAll").and.returnValue(utils.getPromise(q, userPref));
                spyOn(dataSetRepository, "getAll").and.returnValue(utils.getPromise(q, allDataSets));
                spyOn(dataRepository, "save");
                spyOn(dataService, "downloadAllData").and.returnValue(utils.getPromise(q, downloadedDataValues));
                spyOn(dataService, "save");

                dataValuesConsumer.run(message);
                scope.$apply();

                expect(userPreferenceRepository.getAll).toHaveBeenCalled();
                expect(dataSetRepository.getAll).toHaveBeenCalled();
                expect(dataService.downloadAllData).toHaveBeenCalled();
                expect(dataService.save).not.toHaveBeenCalled();
            });

            it("should not run data values if org units is not present", function() {
                spyOn(userPreferenceRepository, "getAll").and.returnValue(utils.getPromise(q, []));
                spyOn(dataSetRepository, "getAll").and.returnValue(utils.getPromise(q, allDataSets));
                spyOn(dataRepository, "save");
                spyOn(dataService, "downloadAllData").and.returnValue(utils.getPromise(q, []));

                dataValuesConsumer.run(message);
                scope.$apply();

                expect(userPreferenceRepository.getAll).toHaveBeenCalled();
                expect(dataSetRepository.getAll).toHaveBeenCalled();
                expect(dataService.downloadAllData).not.toHaveBeenCalled();
            });

            it("should not run data values if dataSets is not present", function() {
                spyOn(userPreferenceRepository, "getAll").and.returnValue(utils.getPromise(q, userPref));
                spyOn(dataSetRepository, "getAll").and.returnValue(utils.getPromise(q, []));
                spyOn(dataRepository, "save");
                spyOn(dataService, "downloadAllData").and.returnValue(utils.getPromise(q, []));

                dataValuesConsumer.run(message);
                scope.$apply();

                expect(userPreferenceRepository.getAll).toHaveBeenCalled();
                expect(dataSetRepository.getAll).toHaveBeenCalled();
                expect(dataService.downloadAllData).not.toHaveBeenCalled();
            });

            it("should download approval data", function() {

                var completionData = {
                    "blah": true
                };

                var userPref = [{
                    "orgUnits": [{
                        "id": "org_0"
                    }]
                }];

                var allDataSets = [{
                    "id": "DS_OPD"
                }];

                spyOn(userPreferenceRepository, "getAll").and.returnValue(utils.getPromise(q, userPref));
                spyOn(dataSetRepository, "getAll").and.returnValue(utils.getPromise(q, allDataSets));
                spyOn(approvalService, "getAllLevelOneApprovalData").and.returnValue(utils.getPromise(q, completionData));
                spyOn(approvalService, "saveLevelOneApprovalData");

                dataValuesConsumer.run({
                    "data": {
                        "type": "downloadApprovalData"
                    }
                });
                scope.$apply();

                expect(approvalService.getAllLevelOneApprovalData).toHaveBeenCalledWith(["org_0"], ["DS_OPD"]);
                expect(approvalService.saveLevelOneApprovalData).toHaveBeenCalledWith(completionData);
            });

            it("should abort approval data download if no orgunits are found in user pref", function() {

                var userPref = undefined;

                var allDataSets = [{
                    "id": "DS_OPD"
                }];

                spyOn(userPreferenceRepository, "getAll").and.returnValue(utils.getPromise(q, userPref));
                spyOn(dataSetRepository, "getAll").and.returnValue(utils.getPromise(q, allDataSets));
                spyOn(approvalService, "getAllLevelOneApprovalData");
                spyOn(approvalService, "saveLevelOneApprovalData");

                dataValuesConsumer.run({
                    "data": {
                        "type": "downloadApprovalData"
                    }
                });
                scope.$apply();

                expect(approvalService.getAllLevelOneApprovalData).not.toHaveBeenCalled();
                expect(approvalService.saveLevelOneApprovalData).not.toHaveBeenCalled();
            });
        });
    });