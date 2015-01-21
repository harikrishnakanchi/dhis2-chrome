define(["approvalHelper", "angularMocks", "approvalDataRepository", "orgUnitRepository", "dataSetRepository", "dataRepository", "utils", "moment", "timecop", "lodash"],
    function(ApprovalHelper, mocks, ApprovalDataRepository, OrgUnitRepository, DataSetRepository, DataRepository, utils, moment, timecop, _) {
        describe("approval helper", function() {
            var hustle, approvalDataRepository, orgUnitRepository, dataSetRepository, dataRepository, q, approvalHelper, scope;

            beforeEach(module('hustle'));
            beforeEach(mocks.inject(function($hustle, $q, $rootScope) {
                hustle = $hustle;
                q = $q;
                scope = $rootScope.$new();

                approvalDataRepository = new ApprovalDataRepository();
                spyOn(approvalDataRepository, "saveLevelOneApproval").and.returnValue(utils.getPromise(q, {}));
                spyOn(approvalDataRepository, "saveLevelTwoApproval").and.returnValue(utils.getPromise(q, {}));

                orgUnitRepository = new OrgUnitRepository();
                dataSetRepository = new DataSetRepository();
                dataRepository = new DataRepository();

                spyOn(hustle, "publish");

                Timecop.install();
                Timecop.freeze(new Date("2014-05-30T12:43:54.972Z"));
                approvalHelper = new ApprovalHelper(hustle, q, scope, orgUnitRepository, dataSetRepository, approvalDataRepository, dataRepository);
            }));

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            it('should mark data as complete', function() {
                var data = {
                    "dataSets": ['Vacc'],
                    "period": '2014W14',
                    "orgUnit": 'mod2',
                    "storedBy": 'dataentryuser'
                };

                var l1ApprovalData = _.merge(data, {
                    "date": moment().toISOString(),
                    "status": "NEW"
                });

                var hustlePublishData = {
                    "data": l1ApprovalData,
                    "type": "uploadCompletionData"
                };

                approvalHelper.markDataAsComplete(data);

                scope.$apply();

                expect(approvalDataRepository.saveLevelOneApproval).toHaveBeenCalledWith(l1ApprovalData);
                expect(hustle.publish).toHaveBeenCalledWith(hustlePublishData, "dataValues");
            });

            it('should mark data as approved', function() {
                var data = {
                    "dataSets": ['Vacc'],
                    "period": '2014W14',
                    "orgUnit": 'mod2',
                    "storedBy": 'dataentryuser'
                };

                var l2ApprovalData = {
                    dataSets: ['Vacc'],
                    period: '2014W14',
                    orgUnit: 'mod2',
                    createdByUsername: 'dataentryuser',
                    createdDate: '2014-05-30T12:43:54.972Z',
                    isAccepted: false,
                    isApproved: true,
                    status: 'NEW'
                };

                var hustlePublishData = {
                    "data": l2ApprovalData,
                    "type": "uploadApprovalData"
                };

                approvalHelper.markDataAsApproved(data);

                scope.$apply();

                expect(approvalDataRepository.saveLevelTwoApproval).toHaveBeenCalledWith(l2ApprovalData);
                expect(hustle.publish).toHaveBeenCalledWith(hustlePublishData, "dataValues");
            });

            it("should get approval status from the starting date", function() {
                var modules = [{
                    "id": "123",
                    "name": "mod1",
                    "openingDate": "2014-05-30",
                    "parent": {
                        "name": "parent"
                    }
                }];

                var dataValues = [];

                var completedDatasets = [];

                var approvalData = [];

                var expectedStatus = [{
                    "moduleId": "123",
                    "moduleName": "parent - mod1",
                    "status": [{
                        "period": "2014W22",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }]
                }];

                var orgUnitId = "123";

                spyOn(orgUnitRepository, "getAllModulesInProjects").and.returnValue(utils.getPromise(q, modules));
                spyOn(dataRepository, "getDataValuesForPeriodsOrgUnits").and.returnValue(utils.getPromise(q, dataValues));
                spyOn(approvalDataRepository, "getLevelOneApprovalDataForPeriodsOrgUnits").and.returnValue(utils.getPromise(q, completedDatasets));
                spyOn(approvalDataRepository, "getLevelTwoApprovalDataForPeriodsOrgUnits").and.returnValue(utils.getPromise(q, approvalData));

                approvalHelper.getApprovalStatus(orgUnitId).then(function(actualStatus) {
                    expect(actualStatus).toEqual(expectedStatus);
                });

                scope.$apply();
            });

            it('should get approval status for last 12 weeks', function() {
                var modules = [{
                    "id": "123",
                    "name": "mod1",
                    "openingDate": "2013-01-01",
                    "parent": {
                        "name": "parent"
                    }
                }, {
                    "id": "234",
                    "name": "mod2",
                    "openingDate": "2013-01-01",
                    "parent": {
                        "name": "parent"
                    }
                }];

                var dataValues = [{
                    "period": "2014W17",
                    "orgUnit": "123",
                    "dataValues": [{
                        "categoryOptionCombo": "co123",
                        "dataElement": "de123",
                        "orgUnit": "123",
                        "period": "2014W17",
                        "value": 9
                    }]
                }, {
                    "period": "2014W18",
                    "orgUnit": "123",
                    "dataValues": [{
                        "categoryOptionCombo": "co123",
                        "dataElement": "de123",
                        "orgUnit": "123",
                        "period": "2014W18",
                        "value": 9
                    }]
                }, {
                    "period": "2014W19",
                    "orgUnit": "123",
                    "dataValues": [{
                        "categoryOptionCombo": "co123",
                        "dataElement": "de123",
                        "orgUnit": "123",
                        "period": "2014W19",
                        "value": 9
                    }]
                }, {
                    "period": "2014W20",
                    "orgUnit": "123",
                    "dataValues": [{
                        "categoryOptionCombo": "co123",
                        "dataElement": "de123",
                        "orgUnit": "123",
                        "period": "2014W20",
                        "value": 9
                    }]
                }];

                var completedDatasets = [{
                    "orgUnit": "123",
                    "period": "2014W18",
                    "dataSets": ["ds213", "ds345"]
                }, {
                    "orgUnit": "123",
                    "period": "2014W19",
                    "dataSets": ["ds213", "ds345"]
                }, {
                    "orgUnit": "123",
                    "period": "2014W20",
                    "dataSets": ["ds213", "ds345"]
                }, {
                    "orgUnit": "123",
                    "period": "2014W20",
                    "dataSets": ["ds213", "ds345"],
                    "status": "DELETED"
                }];

                var approvalData = [{
                    "orgUnit": "123",
                    "period": "2014W19",
                    "isAccepted": false,
                    "isApproved": true,
                    "dataSets": ["ds123", "ds345"]
                }, {
                    "orgUnit": "123",
                    "period": "2014W20",
                    "isAccepted": true,
                    "isApproved": true,
                    "dataSets": ["ds123", "ds345"]
                }, {
                    "orgUnit": "123",
                    "period": "2014W21",
                    "isAccepted": true,
                    "isApproved": true,
                    "dataSets": ["ds123", "ds345"],
                    "status": "DELETED"
                }];

                var expectedStatus = [{
                    "moduleId": "123",
                    "moduleName": "parent - mod1",
                    "status": [{
                        "period": "2014W11",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W12",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W13",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W14",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W15",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W16",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W17",
                        "submitted": true,
                        "nextApprovalLevel": 1
                    }, {
                        "period": "2014W18",
                        "submitted": true,
                        "nextApprovalLevel": 2
                    }, {
                        "period": "2014W19",
                        "submitted": true,
                        "nextApprovalLevel": 3
                    }, {
                        "period": "2014W20",
                        "submitted": true,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W21",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W22",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }]
                }, {
                    "moduleId": "234",
                    "moduleName": "parent - mod2",
                    "status": [{
                        "period": "2014W11",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W12",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W13",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W14",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W15",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W16",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W17",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W18",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W19",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W20",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W21",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }, {
                        "period": "2014W22",
                        "submitted": false,
                        "nextApprovalLevel": undefined
                    }]
                }];

                var orgUnitId = "123";

                spyOn(orgUnitRepository, "getAllModulesInProjects").and.returnValue(utils.getPromise(q, modules));
                spyOn(dataRepository, "getDataValuesForPeriodsOrgUnits").and.returnValue(utils.getPromise(q, dataValues));
                spyOn(approvalDataRepository, "getLevelOneApprovalDataForPeriodsOrgUnits").and.returnValue(utils.getPromise(q, completedDatasets));
                spyOn(approvalDataRepository, "getLevelTwoApprovalDataForPeriodsOrgUnits").and.returnValue(utils.getPromise(q, approvalData));

                approvalHelper.getApprovalStatus(orgUnitId).then(function(actualStatus) {
                    expect(actualStatus).toEqual(expectedStatus);
                });

                scope.$apply();
            });

            it('should auto approve existing data for project', function() {
                var modules = [{
                    "id": "123",
                    "name": "mod1"
                }, {
                    "id": "234",
                    "name": "mod2"
                }];

                var project = {
                    "id": "456"
                };

                var dataValues = [{
                    "period": "2014W17",
                    "orgUnit": "123",
                    "dataValues": [{
                        "categoryOptionCombo": "co123",
                        "dataElement": "de123",
                        "orgUnit": "123",
                        "period": "2014W17",
                        "value": 9
                    }]
                }];

                var allDatasets = [{
                    "id": "ds1",
                    "name": "Dataset1",
                    "organisationUnits": [{
                        "id": "123",
                        "name": "mod1"
                    }]
                }];

                var l1ApprovalData = {
                    "dataSets": ['ds1'],
                    "period": '2014W17',
                    "orgUnit": '123',
                    "storedBy": 'service.account',
                    "date": '2014-05-30T12:43:54.972Z',
                    "status": 'NEW'
                };

                var l2ApprovalData = {
                    dataSets: ['ds1'],
                    period: '2014W17',
                    orgUnit: '123',
                    createdByUsername: 'service.account',
                    createdDate: '2014-05-30T12:43:54.972Z',
                    isAccepted: false,
                    isApproved: true,
                    status: 'NEW'
                };

                spyOn(orgUnitRepository, "getAllModulesInProjects").and.returnValue(utils.getPromise(q, modules));
                spyOn(dataRepository, "getDataValuesForPeriodsOrgUnits").and.returnValue(utils.getPromise(q, dataValues));
                spyOn(dataSetRepository, "getAll").and.returnValue(utils.getPromise(q, allDatasets));
                spyOn(approvalHelper, "markDataAsComplete");

                approvalHelper.autoApproveExistingData(project);
                scope.$apply();

                expect(approvalDataRepository.saveLevelOneApproval).toHaveBeenCalledWith(l1ApprovalData);
                expect(hustle.publish.calls.argsFor(0)).toEqual([{
                    "data": l1ApprovalData,
                    "type": "uploadCompletionData"
                }, "dataValues"]);

                expect(approvalDataRepository.saveLevelTwoApproval).toHaveBeenCalledWith(l2ApprovalData);
                expect(hustle.publish.calls.argsFor(1)).toEqual([{
                    "data": l2ApprovalData,
                    "type": "uploadApprovalData"
                }, "dataValues"]);
            });
        });
    });
