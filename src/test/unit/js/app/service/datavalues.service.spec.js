define(["dataValuesService", "angularMocks", "properties", "utils", "dataService", "dataRepository", "dataSetRepository", "userPreferenceRepository"],
    function(DataValuesService, mocks, properties, utils, DataService, DataRepository, DataSetRepository, UserPreferenceRepository) {
        describe("data values service", function() {

            var dataService, dataRepository, dataSetRepository, userPreferenceRepository, q, scope, allDataSets, userPref;

            beforeEach(mocks.inject(function($q, $rootScope) {
                q = $q;
                scope = $rootScope.$new();

                dataService = new DataService();
                dataRepository = new DataRepository();
                dataSetRepository = new DataSetRepository();
                userPreferenceRepository = new UserPreferenceRepository();

                dataValuesService = new DataValuesService(dataService, dataRepository, dataSetRepository, userPreferenceRepository, q);

                userPref = [{
                    "orgUnits": [{
                        "id": "org_0"
                    }]
                }];

                allDataSets = [{
                    "id": "DS_OPD"
                }];
            }));

            it("should download data values if org units and datasets are present and there is no data to upload", function() {
                spyOn(userPreferenceRepository, "getAll").and.returnValue(utils.getPromise(q, userPref));
                spyOn(dataSetRepository, "getAll").and.returnValue(utils.getPromise(q, allDataSets));
                spyOn(dataRepository, "save");
                spyOn(dataService, "downloadAllData").and.returnValue(utils.getPromise(q, []));
                spyOn(dataService, "save");

                dataValuesService.sync();
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
                spyOn(userPreferenceRepository, "getAll").and.returnValue(utils.getPromise(q, userPref));
                spyOn(dataSetRepository, "getAll").and.returnValue(utils.getPromise(q, allDataSets));
                spyOn(dataRepository, "save");
                spyOn(dataService, "downloadAllData").and.returnValue(utils.getPromise(q, downloadedDataValues));
                spyOn(dataService, "save");

                dataValuesService.sync(dataValuesToUpload);
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
                spyOn(userPreferenceRepository, "getAll").and.returnValue(utils.getPromise(q, userPref));
                spyOn(dataSetRepository, "getAll").and.returnValue(utils.getPromise(q, allDataSets));
                spyOn(dataRepository, "save");
                spyOn(dataService, "downloadAllData").and.returnValue(utils.getPromise(q, downloadedDataValues));
                spyOn(dataService, "save");

                dataValuesService.sync(dataValuesToUpload);
                scope.$apply();

                expect(userPreferenceRepository.getAll).toHaveBeenCalled();
                expect(dataSetRepository.getAll).toHaveBeenCalled();
                expect(dataService.downloadAllData).toHaveBeenCalled();
                expect(dataService.save).not.toHaveBeenCalled();
            });

            it("should not sync data values if org units is not present", function() {
                spyOn(userPreferenceRepository, "getAll").and.returnValue(utils.getPromise(q, []));
                spyOn(dataSetRepository, "getAll").and.returnValue(utils.getPromise(q, allDataSets));
                spyOn(dataRepository, "save");
                spyOn(dataService, "downloadAllData").and.returnValue(utils.getPromise(q, []));

                dataValuesService.sync();
                scope.$apply();

                expect(userPreferenceRepository.getAll).toHaveBeenCalled();
                expect(dataSetRepository.getAll).toHaveBeenCalled();
                expect(dataService.downloadAllData).not.toHaveBeenCalled();
            });

            it("should not sync data values if dataSets is not present", function() {
                spyOn(userPreferenceRepository, "getAll").and.returnValue(utils.getPromise(q, userPref));
                spyOn(dataSetRepository, "getAll").and.returnValue(utils.getPromise(q, []));
                spyOn(dataRepository, "save");
                spyOn(dataService, "downloadAllData").and.returnValue(utils.getPromise(q, []));

                dataValuesService.sync();
                scope.$apply();

                expect(userPreferenceRepository.getAll).toHaveBeenCalled();
                expect(dataSetRepository.getAll).toHaveBeenCalled();
                expect(dataService.downloadAllData).not.toHaveBeenCalled();
            });
        });
    });