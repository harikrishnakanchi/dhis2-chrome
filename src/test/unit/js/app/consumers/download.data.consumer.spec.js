define(["downloadDataConsumer", "angularMocks", "properties", "utils", "dataService", "dataRepository", "datasetRepository", "userPreferenceRepository", "moment", "timecop", "mergeBy", "changeLogRepository"],
    function(DownloadDataConsumer, mocks, properties, utils, DataService, DataRepository, DatasetRepository, UserPreferenceRepository, moment, timecop, MergeBy, ChangeLogRepository) {
        describe("download data consumer", function() {

            var dataService, dataRepository, approvalDataRepository, datasetRepository, userPreferenceRepository, q, scope, downloadDataConsumer, message, approvalService, mergeBy, changeLogRepository;

            beforeEach(mocks.inject(function($q, $rootScope, $log) {
                q = $q;
                scope = $rootScope.$new();
                thisMoment = moment("2014-01-01T");

                Timecop.install();
                Timecop.freeze(thisMoment.toDate());

                userPreferenceRepository = new UserPreferenceRepository();
                spyOn(userPreferenceRepository, "getCurrentProjects").and.returnValue(utils.getPromise(q, ["proj_1"]));

                datasetRepository = {
                    "getAll": jasmine.createSpy("getAll").and.returnValue(utils.getPromise(q, [{
                        'id': 'DS_OPD',
                        "isLineListService": false
                    }]))
                };

                changeLogRepository = new ChangeLogRepository();
                spyOn(changeLogRepository, "get").and.returnValue(utils.getPromise(q, "2013-12-30T09:13:41.092Z"));
                spyOn(changeLogRepository, "upsert").and.returnValue(utils.getPromise(q, {}));

                dataRepository = new DataRepository();
                spyOn(dataRepository, "getDataValues").and.returnValue(utils.getPromise(q, {}));
                spyOn(dataRepository, "getDataValuesForOrgUnitsPeriods").and.returnValue(utils.getPromise(q, {}));
                spyOn(dataRepository, "isDataPresent").and.returnValue(utils.getPromise(q, true));
                spyOn(dataRepository, "saveDhisData");

                approvalDataRepository = {
                    "getLevelOneApprovalData": jasmine.createSpy("getLevelOneApprovalData").and.returnValue(utils.getPromise(q, {})),
                    "getLevelTwoApprovalData": jasmine.createSpy("getLevelTwoApprovalData").and.returnValue(utils.getPromise(q, {})),
                    "getLevelOneApprovalDataForPeriodsOrgUnits": jasmine.createSpy("getLevelOneApprovalDataForPeriodsOrgUnits").and.returnValue(utils.getPromise(q, [])),
                    "getLevelTwoApprovalDataForPeriodsOrgUnits": jasmine.createSpy("getLevelTwoApprovalDataForPeriodsOrgUnits").and.returnValue(utils.getPromise(q, [])),
                    "invalidateApproval": jasmine.createSpy("invalidateApproval")
                };

                dataService = {
                    "downloadData": jasmine.createSpy("downloadData").and.returnValue(utils.getPromise(q, [])),
                    "save": jasmine.createSpy("save")
                };

                mergeBy = new MergeBy($log);

                downloadDataConsumer = new DownloadDataConsumer(dataService, dataRepository, datasetRepository, userPreferenceRepository, q, approvalDataRepository, mergeBy, changeLogRepository);
            }));

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            it("should download data values from dhis based on last updated date, user preferences and non-line-list datasets", function() {
                var userProjects = [{
                    "id": "prj1"
                }];
                userPreferenceRepository.getCurrentProjects.and.returnValue(utils.getPromise(q, userProjects));

                datasetRepository.getAll.and.returnValue(utils.getPromise(q, [{
                    "id": "ds1",
                    "isLineListService": true
                }, {
                    "id": "ds2",
                    "isLineListService": false
                }]));

                var lastUpdated = "2013-12-15T09:13:41.092Z";
                changeLogRepository.get.and.returnValue(utils.getPromise(q, lastUpdated));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };

                downloadDataConsumer.run(message);
                scope.$apply();

                expect(userPreferenceRepository.getCurrentProjects).toHaveBeenCalled();
                expect(dataService.downloadData).toHaveBeenCalledWith(userProjects, ["ds2"], jasmine.any(String), lastUpdated);
            });

            it("should recursively download data values from dhis once per week", function() {

                var userProjects = [{
                    "id": "prj1"
                }];
                userPreferenceRepository.getCurrentProjects.and.returnValue(utils.getPromise(q, userProjects));

                datasetRepository.getAll.and.returnValue(utils.getPromise(q, [{
                    "id": "ds1",
                    "isLineListService": true
                }, {
                    "id": "ds2",
                    "isLineListService": false
                }]));

                properties.projectDataSync.numWeeksToSync = 3;
                changeLogRepository.get.and.returnValue(utils.getPromise(q, "2013-12-15T09:13:41.092Z"));

                var dhisDataValues = [{
                    "dataElement": "DE1",
                    "period": "2014W01",
                    "orgUnit": "MSF_0",
                    "categoryOptionCombo": "C1",
                    "lastUpdated": "2014-05-27T09:00:00.120Z",
                    "value": "5"
                }, {
                    "dataElement": "DE2",
                    "period": "2013W52",
                    "orgUnit": "MSF_0",
                    "categoryOptionCombo": "C1",
                    "lastUpdated": "2014-05-27T09:00:00.120Z",
                    "value": "10"
                }, {
                    "dataElement": "DE2",
                    "period": "2013W51",
                    "orgUnit": "MSF_0",
                    "categoryOptionCombo": "C1",
                    "lastUpdated": "2014-05-27T09:00:00.120Z",
                    "value": "15"
                }];

                dataService.downloadData.and.returnValue(utils.getPromise(q, dhisDataValues));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };

                downloadDataConsumer.run(message);
                scope.$apply();

                expect(dataService.downloadData.calls.count()).toEqual(3);
                expect(dataRepository.saveDhisData.calls.count()).toEqual(3);
                expect(dataService.downloadData).toHaveBeenCalledWith(userProjects, ["ds2"], '2014W01', jasmine.any(String));
                expect(dataService.downloadData).toHaveBeenCalledWith(userProjects, ["ds2"], '2013W52', jasmine.any(String));
                expect(dataService.downloadData).toHaveBeenCalledWith(userProjects, ["ds2"], '2013W51', jasmine.any(String));
            });

            it("should not download data values if current user projects is not present", function() {
                userPreferenceRepository.getCurrentProjects.and.returnValue(utils.getPromise(q, []));
                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };
                downloadDataConsumer.run(message);
                scope.$apply();

                expect(dataService.downloadData).not.toHaveBeenCalled();
            });

            it("should not save to indexeddb if no data is available in dhis", function() {
                var dbDataValues = [{
                    "dataElement": "DE1",
                    "period": "2014W11",
                    "orgUnit": "MSF_0",
                    "categoryOptionCombo": "C1",
                    "lastUpdated": "2014-05-27T09:00:00.120Z",
                    "value": "5"
                }];

                dataRepository.getDataValuesForOrgUnitsPeriods.and.returnValue(utils.getPromise(q, dbDataValues));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };
                dataService.downloadData.and.returnValue(utils.getPromise(q, []));

                downloadDataConsumer.run(message);
                scope.$apply();

                expect(dataRepository.saveDhisData).not.toHaveBeenCalled();
            });

            it("should save downloaded data to indexeddb if no data already exists in db", function() {
                var dhisDataValues = [{
                    "dataElement": "DE1",
                    "period": "2014W11",
                    "orgUnit": "MSF_0",
                    "categoryOptionCombo": "C1",
                    "lastUpdated": "2014-05-27T09:00:00.120Z",
                    "value": "5"
                }, {
                    "dataElement": "DE2",
                    "period": "2014W11",
                    "orgUnit": "MSF_0",
                    "categoryOptionCombo": "C1",
                    "lastUpdated": "2014-05-27T09:00:00.120Z",
                    "value": "10"
                }];

                dataService.downloadData.and.returnValue(utils.getPromise(q, dhisDataValues));

                dataRepository.getDataValuesForOrgUnitsPeriods.and.returnValue(utils.getPromise(q, []));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };

                downloadDataConsumer.run(message);
                scope.$apply();

                var expected = [{
                    "dataElement": "DE1",
                    "period": "2014W11",
                    "orgUnit": "MSF_0",
                    "categoryOptionCombo": "C1",
                    "lastUpdated": "2014-05-27T09:00:00.120Z",
                    "value": "5"
                }, {
                    "dataElement": "DE2",
                    "period": "2014W11",
                    "orgUnit": "MSF_0",
                    "categoryOptionCombo": "C1",
                    "lastUpdated": "2014-05-27T09:00:00.120Z",
                    "value": "10"
                }];

                expect(dataRepository.saveDhisData).toHaveBeenCalledWith(expected);
            });

            it("should merge dhisData with existing db data, clear approvals where necessary, do the laundry and save to indexeddb", function() {
                var dhisDataValues = [{
                    "dataElement": "DE1",
                    "period": "2014W12",
                    "orgUnit": "MSF_0",
                    "categoryOptionCombo": "C1",
                    "lastUpdated": "2014-05-27T09:00:00.120Z",
                    "value": "1"
                }, {
                    "dataElement": "DE2",
                    "period": "2014W12",
                    "orgUnit": "MSF_0",
                    "categoryOptionCombo": "C1",
                    "lastUpdated": "2014-05-20T09:00:00.120Z",
                    "value": "2"
                }];

                var dbDataValues = [{
                    "dataElement": "DE1",
                    "period": "2014W12",
                    "orgUnit": "MSF_0",
                    "categoryOptionCombo": "C1",
                    "lastUpdated": "2014-05-24T09:00:00.120Z",
                    "value": "3"
                }, {
                    "dataElement": "DE2",
                    "period": "2014W12",
                    "orgUnit": "MSF_0",
                    "categoryOptionCombo": "C1",
                    "lastUpdated": "2014-05-23T09:00:00.120Z",
                    "clientLastUpdated": "2014-05-23T09:00:00.120Z",
                    "value": "4"
                }];

                dataService.downloadData.and.returnValue(utils.getPromise(q, dhisDataValues));

                dataRepository.getDataValuesForOrgUnitsPeriods.and.returnValue(utils.getPromise(q, dbDataValues));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };

                downloadDataConsumer.run(message);
                scope.$apply();

                var expectedDataConsumer = [{
                    "dataElement": "DE1",
                    "period": "2014W12",
                    "orgUnit": "MSF_0",
                    "categoryOptionCombo": "C1",
                    "lastUpdated": "2014-05-27T09:00:00.120Z",
                    "value": "1"
                }, {
                    "dataElement": "DE2",
                    "period": "2014W12",
                    "orgUnit": "MSF_0",
                    "categoryOptionCombo": "C1",
                    "lastUpdated": "2014-05-23T09:00:00.120Z",
                    "clientLastUpdated": "2014-05-23T09:00:00.120Z",
                    "value": "4"
                }];

                expect(approvalDataRepository.invalidateApproval).toHaveBeenCalledWith('2014W12', 'MSF_0');
                expect(dataRepository.saveDhisData).toHaveBeenCalledWith(expectedDataConsumer);
            });

            it("should not clear approvals if downloaded data is the same as db data", function() {
                var dhisDataValues = [{
                    "dataElement": "DE1",
                    "period": "2014W12",
                    "orgUnit": "MSF_0",
                    "categoryOptionCombo": "C1",
                    "lastUpdated": "2014-05-27T10:00:00.120Z",
                    "createdDate": "2014-05-27T10:00:00.120Z",
                    "value": "1"
                }, {
                    "dataElement": "DE2",
                    "period": "2014W12",
                    "orgUnit": "MSF_0",
                    "categoryOptionCombo": "C1",
                    "lastUpdated": "2014-05-20T10:00:00.120Z",
                    "createdDate": "2014-05-27T10:00:00.120Z",
                    "value": "2"
                }];

                var dbDataValues = [{
                    "dataElement": "DE2",
                    "period": "2014W12",
                    "orgUnit": "MSF_0",
                    "categoryOptionCombo": "C1",
                    "clientLastUpdated": "2014-05-20T09:00:00.120Z",
                    "value": "2"
                }, {
                    "dataElement": "DE1",
                    "period": "2014W12",
                    "orgUnit": "MSF_0",
                    "categoryOptionCombo": "C1",
                    "clientLastUpdated": "2014-05-27T09:00:00.120Z",
                    "value": "1"
                }];

                dataService.downloadData.and.returnValue(utils.getPromise(q, dhisDataValues));

                dataRepository.getDataValuesForOrgUnitsPeriods.and.returnValue(utils.getPromise(q, dbDataValues));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };

                downloadDataConsumer.run(message);
                scope.$apply();

                expect(approvalDataRepository.invalidateApproval).not.toHaveBeenCalled();
                expect(dataRepository.saveDhisData).toHaveBeenCalledWith(dhisDataValues);
            });
        });
    });
