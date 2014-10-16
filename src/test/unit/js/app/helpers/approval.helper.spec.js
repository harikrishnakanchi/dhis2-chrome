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
                    "dataSets": ['Vacc'],
                    "period": '2014W14',
                    "orgUnit": 'mod2',
                    "createdByUsername": 'dataentryuser',
                    "createdDate": moment().toISOString(),
                    "isApproved": true,
                    "status": "NEW"
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

            it('should get approval status', function() {
                var modules = [{
                    "id": "123",
                    "name": "mod1"
                }, {
                    "id": "234",
                    "name": "mod2"
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
                }];

                var expectedStatus = [{
                    "moduleId": "123",
                    "moduleName": "mod1",
                    "status": [{
                        "period": "2014W9",
                        "submitted": false,
                        "approvalLevel": undefined
                    }, {
                        "period": "2014W10",
                        "submitted": false,
                        "approvalLevel": undefined
                    }, {
                        "period": "2014W11",
                        "submitted": false,
                        "approvalLevel": undefined
                    }, {
                        "period": "2014W12",
                        "submitted": false,
                        "approvalLevel": undefined
                    }, {
                        "period": "2014W13",
                        "submitted": false,
                        "approvalLevel": undefined
                    }, {
                        "period": "2014W14",
                        "submitted": false,
                        "approvalLevel": undefined
                    }, {
                        "period": "2014W15",
                        "submitted": false,
                        "approvalLevel": undefined
                    }, {
                        "period": "2014W16",
                        "submitted": false,
                        "approvalLevel": undefined
                    }, {
                        "period": "2014W17",
                        "submitted": true,
                        "approvalLevel": undefined
                    }, {
                        "period": "2014W18",
                        "submitted": true,
                        "approvalLevel": 1
                    }, {
                        "period": "2014W19",
                        "submitted": true,
                        "approvalLevel": 2
                    }, {
                        "period": "2014W20",
                        "submitted": true,
                        "approvalLevel": 3
                    }]
                }, {
                    "moduleId": "234",
                    "moduleName": "mod2",
                    "status": [{
                        "period": "2014W9",
                        "submitted": false,
                        "approvalLevel": undefined
                    }, {
                        "period": "2014W10",
                        "submitted": false,
                        "approvalLevel": undefined
                    }, {
                        "period": "2014W11",
                        "submitted": false,
                        "approvalLevel": undefined
                    }, {
                        "period": "2014W12",
                        "submitted": false,
                        "approvalLevel": undefined
                    }, {
                        "period": "2014W13",
                        "submitted": false,
                        "approvalLevel": undefined
                    }, {
                        "period": "2014W14",
                        "submitted": false,
                        "approvalLevel": undefined
                    }, {
                        "period": "2014W15",
                        "submitted": false,
                        "approvalLevel": undefined
                    }, {
                        "period": "2014W16",
                        "submitted": false,
                        "approvalLevel": undefined
                    }, {
                        "period": "2014W17",
                        "submitted": false,
                        "approvalLevel": undefined
                    }, {
                        "period": "2014W18",
                        "submitted": false,
                        "approvalLevel": undefined
                    }, {
                        "period": "2014W19",
                        "submitted": false,
                        "approvalLevel": undefined
                    }, {
                        "period": "2014W20",
                        "submitted": false,
                        "approvalLevel": undefined
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
        });
    });