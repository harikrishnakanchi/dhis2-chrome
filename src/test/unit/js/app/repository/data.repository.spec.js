define(["dataRepository", "angularMocks", "utils", "timecop"], function(DataRepository, mocks, utils, timecop) {
    describe("data repository", function() {
        var q, db, mockStore, dataRepository, dataValuesFromClient, dataValuesFromDHIS, scope;
        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            var mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;
            scope = $rootScope;
            dataRepository = new DataRepository(q, mockDB.db);

            dataValuesFromClient = [{
                "period": '2014W15',
                "orgUnit": 'company_0',
                "dataElement": "DE1",
                "categoryOptionCombo": "COC1",
                "value": "1"
            }, {
                "period": '2014W15',
                "orgUnit": 'company_0',
                "dataElement": "DE2",
                "categoryOptionCombo": "COC2",
                "value": "2"
            }];

            dataValuesFromDHIS = [{
                "period": '2014W20',
                "orgUnit": 'company_0',
                "dataElement": "DE1",
                "categoryOptionCombo": "COC1",
                "value": "1",
                "lastUpdated": "2014-05-20T00:00:00"
            }, {
                "period": '2014W20',
                "orgUnit": 'company_0',
                "dataElement": "DE2",
                "categoryOptionCombo": "COC2",
                "value": "2",
                "lastUpdated": "2014-05-20T00:00:00"
            }];

            Timecop.install();
            Timecop.freeze(new Date("2015-04-15T00:00:00.000"));
        }));

        afterEach(function() {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        it("should save data values sent from client", function() {
            dataRepository.save(dataValuesFromClient);

            expect(mockStore.upsert).toHaveBeenCalledWith([{
                "period": "2014W15",
                "orgUnit": "company_0",
                "localStatus": "WAITING_TO_SYNC",
                "dataValues": [{
                    "period": '2014W15',
                    "orgUnit": 'company_0',
                    "dataElement": "DE1",
                    "categoryOptionCombo": "COC1",
                    "value": "1",
                    "clientLastUpdated": "2015-04-15T00:00:00.000Z"
                }, {
                    "period": '2014W15',
                    "orgUnit": 'company_0',
                    "dataElement": "DE2",
                    "categoryOptionCombo": "COC2",
                    "value": "2",
                    "clientLastUpdated": "2015-04-15T00:00:00.000Z"
                }]
            }]);
        });

        it("should return true if events are present for the given orgunitids", function() {
            mockDB = utils.getMockDB(q);
            mockStore = mockDB.objectStore;
            dataRepository = new DataRepository(q, mockDB.db);

            mockStore.exists.and.returnValue(utils.getPromise(q, true));

            dataRepository.isDataPresent(['ou1', 'ou2']).then(function(actualResult) {
                expect(actualResult).toBeTruthy();
            });

            scope.$apply();
        });

        it("should return false if events are not present for the given orgunitids", function() {
            mockDB = utils.getMockDB(q);
            mockStore = mockDB.objectStore;
            dataRepository = new DataRepository(q, mockDB.db);

            mockStore.exists.and.returnValue(utils.getPromise(q, false));

            dataRepository.isDataPresent(['ou1', 'ou2']).then(function(actualResult) {
                expect(actualResult).toBeFalsy();
            });

            scope.$apply();
        });

        it("should save data values sent from client as draft", function() {
            dataRepository.saveAsDraft(dataValuesFromClient);

            expect(mockStore.upsert).toHaveBeenCalledWith([{
                "period": "2014W15",
                "orgUnit": "company_0",
                "localStatus": "SAVED",
                "dataValues": [{
                    "period": '2014W15',
                    "orgUnit": 'company_0',
                    "dataElement": "DE1",
                    "categoryOptionCombo": "COC1",
                    "value": "1",
                    "isDraft": true,
                    "clientLastUpdated": "2015-04-15T00:00:00.000Z"
                }, {
                    "period": '2014W15',
                    "orgUnit": 'company_0',
                    "dataElement": "DE2",
                    "categoryOptionCombo": "COC2",
                    "value": "2",
                    "isDraft": true,
                    "clientLastUpdated": "2015-04-15T00:00:00.000Z"
                }]
            }]);
        });

        it("should save data values sent from DHIS", function() {
            dataRepository.saveDhisData(dataValuesFromDHIS);

            expect(mockStore.upsert).toHaveBeenCalledWith([{
                "period": "2014W20",
                "orgUnit": "company_0",
                "localStatus": "DATA_FROM_DHIS",
                "dataValues": [{
                    "period": '2014W20',
                    "orgUnit": 'company_0',
                    "dataElement": "DE1",
                    "categoryOptionCombo": "COC1",
                    "value": "1",
                    "lastUpdated": "2014-05-20T00:00:00"
                }, {
                    "period": '2014W20',
                    "orgUnit": 'company_0',
                    "dataElement": "DE2",
                    "categoryOptionCombo": "COC2",
                    "value": "2",
                    "lastUpdated": "2014-05-20T00:00:00"
                }]
            }]);
        });

        it("should get the data values", function() {

            var dv1 = {
                "period": '2014W15',
                "orgUnit": 'mod1',
                "dataElement": "DE1",
                "categoryOptionCombo": "COC1",
                "value": "1"
            };

            var dv2 = {
                "period": '2014W15',
                "orgUnit": 'mod1',
                "dataElement": "DE2",
                "categoryOptionCombo": "COC2",
                "value": "2"
            };

            var dv3 = {
                "period": '2014W15',
                "orgUnit": 'origin1',
                "dataElement": "NumPatients",
                "categoryOptionCombo": "Number",
                "value": "3"
            };

            mockStore.find.and.callFake(function(periodAndOrgUnit) {
                var orgUnit = periodAndOrgUnit[1];
                var result;
                if (orgUnit === "mod1")
                    result = {
                        "period": "2014W15",
                        "orgUnit": "mod1",
                        "dataValues": [dv1, dv2]
                    };
                if (orgUnit === "origin1")
                    result = {
                        "period": "2014W15",
                        "orgUnit": "mod1",
                        "dataValues": [dv3]
                    };
                return utils.getPromise(q, result);
            });

            var actualDataValues;
            dataRepository.getDataValues('period', ['mod1', 'origin1', 'origin2']).then(function(data) {
                actualDataValues = data;
            });

            scope.$apply();

            expect(actualDataValues).toEqual([dv1, dv2, dv3]);
        });

        it("should get data values by periods and orgunits", function() {
            mockStore.each.and.returnValue(utils.getPromise(q, [{
                "orgUnit": "ou1",
                "period": "2014W02",
                "dataValues": [{
                    "period": '2014W02',
                    "orgUnit": 'ou1',
                    "dataElement": "DE2",
                    "categoryOptionCombo": "COC2",
                    "value": "2",
                    "lastUpdated": "2014-01-15T00:00:00.000"
                }]
            }, {
                "orgUnit": "ou1",
                "period": "2014W03",
                "dataValues": [{
                    "period": '2014W03',
                    "orgUnit": 'ou1',
                    "dataElement": "DE2",
                    "categoryOptionCombo": "COC2",
                    "value": "4",
                    "isDraft": true,
                    "clientLastUpdated": "2014-01-22T00:00:00.000"
                }]
            }, {
                "orgUnit": "ou3",
                "period": "2014W02",
                "dataValues": [{
                    "period": '2014W02',
                    "orgUnit": 'ou3',
                    "dataElement": "DE2",
                    "categoryOptionCombo": "COC2",
                    "value": "1",
                    "lastUpdated": "2014-01-15T00:00:00.000"
                }]
            }]));

            var actualDataValues;
            dataRepository.getDataValuesForOrgUnitsPeriods(["ou1", "ou2"], ["2014W02", "2014W03"]).then(function(dataValues) {
                actualDataValues = dataValues;
            });

            scope.$apply();

            expect(actualDataValues).toEqual([{
                "period": '2014W02',
                "orgUnit": 'ou1',
                "dataElement": "DE2",
                "categoryOptionCombo": "COC2",
                "value": "2",
                "lastUpdated": "2014-01-15T00:00:00.000"
            }, {
                "period": '2014W03',
                "orgUnit": 'ou1',
                "dataElement": "DE2",
                "categoryOptionCombo": "COC2",
                "value": "4",
                "isDraft": true,
                "clientLastUpdated": "2014-01-22T00:00:00.000"
            }]);
        });

        it("should change status of dataValues", function () {
            var dataValues = {
                "orgUnit": "abcd",
                "period": "2016W01",
                "dataValues": [{
                    "period": '2014W02',
                    "orgUnit": 'ou1',
                    "dataElement": "DE2",
                    "categoryOptionCombo": "COC2",
                    "value": "2",
                    "lastUpdated": "2014-01-15T00:00:00.000"
                }],
                "localStatus": "WAITING_TO_SYNC"
            };

            mockStore.find.and.callFake(function(periodsAndOrgUnits) {
                return utils.getPromise(q, dataValues);
            });

            var periodsAndOrgUnits = [{
                "period": "2016W01",
                "orgUnit": "abcd"
            }];

            dataRepository.setLocalStatus(periodsAndOrgUnits, 'FAILED_TO_SYNC');

            scope.$apply();

            expect(mockStore.upsert).toHaveBeenCalledWith({
                "orgUnit": "abcd",
                "period": "2016W01",
                "dataValues": [{
                    "period": '2014W02',
                    "orgUnit": 'ou1',
                    "dataElement": "DE2",
                    "categoryOptionCombo": "COC2",
                    "value": "2",
                    "lastUpdated": "2014-01-15T00:00:00.000"
                }],
                "localStatus": "FAILED_TO_SYNC"
            });

        });

        it("should get dataValues for orgUnits within two periods", function(){

            var dataValues = [{
                "orgUnit": "ou1",
                "period": "2016W01",
                "dataValues": [{
                    "period": '2016W01',
                    "orgUnit": 'ou1',
                    "dataElement": "DE2",
                    "categoryOptionCombo": "COC2",
                    "value": "2",
                    "lastUpdated": "2014-01-15T00:00:00.000"
                }],
                "localStatus": "WAITING_TO_SYNC"
            }, {
                "orgUnit": "ou2",
                "period": "2016W02",
                "dataValues": [{
                    "period": '2016W02',
                    "orgUnit": 'ou2',
                    "dataElement": "DE2",
                    "categoryOptionCombo": "COC2",
                    "value": "4",
                    "isDraft": true,
                    "clientLastUpdated": "2014-01-22T00:00:00.000"
                }],
                "localStatus": "SAVED"
            }];

            mockStore.each.and.returnValue(utils.getPromise(q, dataValues));

            var actual;
            dataRepository.getDataValuesForPeriodsOrgUnits("2016W01","2016W02",["ou1","ou2"]).then(function(data) {
                actual = data;
            });

            scope.$apply();

            expect(actual).toEqual([{
                "orgUnit": "ou1",
                "period": "2016W01",
                "dataValues": [{
                    "period": '2016W01',
                    "orgUnit": 'ou1',
                    "dataElement": "DE2",
                    "categoryOptionCombo": "COC2",
                    "value": "2",
                    "lastUpdated": "2014-01-15T00:00:00.000"
                }],
                "localStatus": "WAITING_TO_SYNC"
            }]);

            expect(actual).not.toEqual(dataValues);

        });

        it("should get localStatus for specific period and orgunit", function() {

            var period = '2016W02',
                orgUnit = 'mod1',
                localStatus;

            mockStore.find.and.callFake(function(period, orgUnit) {
                var result = {
                    "period": "2016W02",
                    "orgUnit": "mod1",
                    "dataValues": [],
                    "localStatus": "FAILED_TO_SYNC"
                };
                return utils.getPromise(q, result);
            });

            dataRepository.getLocalStatus(period, orgUnit).then(function(status) {
                localStatus = status;
            });

            scope.$apply();

            expect(localStatus).toEqual('FAILED_TO_SYNC');

        });

    });
});
