define(["dataRepository", "angularMocks", "utils", "timecop"], function(DataRepository, mocks, utils, timecop) {
    describe("data repository", function() {
        var q, db, mockStore, dataRepository, dataValuesFromClient, dataValuesFromDHIS, scope;
        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            var mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;
            scope = $rootScope;
            dataRepository = new DataRepository(mockDB.db);

            dataValuesFromClient = [{
                "period": '2014W15',
                "orgUnit": 'company_0',
                "dataElement": "DE1",
                "categoryOptionCombo": "COC1",
                "value": 1
            }, {
                "period": '2014W15',
                "orgUnit": 'company_0',
                "dataElement": "DE2",
                "categoryOptionCombo": "COC2",
                "value": 2
            }];

            dataValuesFromDHIS = [{
                "period": '2014W20',
                "orgUnit": 'company_0',
                "dataElement": "DE1",
                "categoryOptionCombo": "COC1",
                "value": 1,
                "lastUpdated": "2014-05-20T00:00:00"
            }, {
                "period": '2014W20',
                "orgUnit": 'company_0',
                "dataElement": "DE2",
                "categoryOptionCombo": "COC2",
                "value": 2,
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
                "dataValues": [{
                    "period": '2014W15',
                    "orgUnit": 'company_0',
                    "dataElement": "DE1",
                    "categoryOptionCombo": "COC1",
                    "value": 1,
                    "clientLastUpdated": "2015-04-15T00:00:00.000Z"
                }, {
                    "period": '2014W15',
                    "orgUnit": 'company_0',
                    "dataElement": "DE2",
                    "categoryOptionCombo": "COC2",
                    "value": 2,
                    "clientLastUpdated": "2015-04-15T00:00:00.000Z"
                }]
            }]);
        });

        it("should save data values sent from client as draft", function() {
            dataRepository.saveAsDraft(dataValuesFromClient);

            expect(mockStore.upsert).toHaveBeenCalledWith([{
                "period": "2014W15",
                "orgUnit": "company_0",
                "dataValues": [{
                    "period": '2014W15',
                    "orgUnit": 'company_0',
                    "dataElement": "DE1",
                    "categoryOptionCombo": "COC1",
                    "value": 1,
                    "clientLastUpdated": "2015-04-15T00:00:00.000Z"
                }, {
                    "period": '2014W15',
                    "orgUnit": 'company_0',
                    "dataElement": "DE2",
                    "categoryOptionCombo": "COC2",
                    "value": 2,
                    "clientLastUpdated": "2015-04-15T00:00:00.000Z"
                }],
                "isDraft": true
            }]);
        });


        it("should save data values sent from DHIS", function() {
            dataRepository.saveDhisData(dataValuesFromDHIS);

            expect(mockStore.upsert).toHaveBeenCalledWith([{
                "period": "2014W20",
                "orgUnit": "company_0",
                "dataValues": [{
                    "period": '2014W20',
                    "orgUnit": 'company_0',
                    "dataElement": "DE1",
                    "categoryOptionCombo": "COC1",
                    "value": 1,
                    "lastUpdated": "2014-05-20T00:00:00"
                }, {
                    "period": '2014W20',
                    "orgUnit": 'company_0',
                    "dataElement": "DE2",
                    "categoryOptionCombo": "COC2",
                    "value": 2,
                    "lastUpdated": "2014-05-20T00:00:00"
                }]
            }]);
        });

        it("should get the data values", function() {

            var dataValueFromClient = {
                "period": '2014W15',
                "orgUnit": 'company_0',
                "dataElement": "DE1",
                "categoryOptionCombo": "COC1",
                "value": 1,
                "clientLastUpdated": "2015-04-15T00:00:00.000"
            };

            var dataValueFromDhis = {
                "period": '2014W15',
                "orgUnit": 'company_0',
                "dataElement": "DE2",
                "categoryOptionCombo": "COC2",
                "value": 2,
                "lastUpdated": "2015-04-16T00:00:00.000"
            };

            mockStore.find.and.returnValue(utils.getPromise(q, {
                "period": "2014W15",
                "orgUnit": "company_0",
                "dataValues": [dataValueFromClient, dataValueFromDhis]
            }));

            var actualDataValues;
            dataRepository.getDataValues('period', 'orgUnitId').then(function(data) {
                actualDataValues = data;
            });

            scope.$apply();

            expect(mockStore.find).toHaveBeenCalledWith(['period', 'orgUnitId']);
            expect(actualDataValues).toEqual([dataValueFromClient, dataValueFromDhis]);
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
                    "value": 2,
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
                    "value": 4,
                    "lastUpdated": "2014-01-22T00:00:00.000"
                }]
            }, {
                "orgUnit": "ou3",
                "period": "2014W02",
                "dataValues": [{
                    "period": '2014W02',
                    "orgUnit": 'ou3',
                    "dataElement": "DE2",
                    "categoryOptionCombo": "COC2",
                    "value": 1,
                    "lastUpdated": "2014-01-15T00:00:00.000"
                }]
            }]));

            var actualDataValues;
            dataRepository.getDataValuesForPeriodsOrgUnits("2014W02", "2014W03", ["ou1", "ou2"]).then(function(dataValues) {
                actualDataValues = dataValues;
            });

            scope.$apply();

            expect(actualDataValues).toEqual([{
                "period": '2014W02',
                "orgUnit": 'ou1',
                "dataElement": "DE2",
                "categoryOptionCombo": "COC2",
                "value": 2,
                "lastUpdated": "2014-01-15T00:00:00.000"
            }, {
                "period": '2014W03',
                "orgUnit": 'ou1',
                "dataElement": "DE2",
                "categoryOptionCombo": "COC2",
                "value": 4,
                "lastUpdated": "2014-01-22T00:00:00.000"
            }]);
        });
    });
});
