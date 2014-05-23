define(["dataService", "angularMocks", "properties", "moment", "utils", "testData"], function(DataService, mocks, properties, moment, utils, testData) {
    describe("dataService", function() {
        var httpBackend, http, db, dataSetStore, dataValuesStore;

        beforeEach(mocks.inject(function($injector, $q) {
            q = $q;
            httpBackend = $injector.get('$httpBackend');
            http = $injector.get('$http');

            db = {
                objectStore: function() {}
            };
            var getMockStore = function(data) {
                var getAll = function() {
                    return utils.getPromise(q, data);
                };
                var upsert = function() {};
                var find = function() {};
                return {
                    getAll: getAll,
                    upsert: upsert,
                    find: find
                };
            };
            dataValuesStore = getMockStore({});
            dataSetStore = getMockStore(testData.get("dataSets"));

            spyOn(db, 'objectStore').and.callFake(function(storeName) {
                var stores = {
                    "dataValues": dataValuesStore,
                    "dataSets": dataSetStore
                };
                return stores[storeName];
            });

            spyOn(dataValuesStore, "upsert").and.callFake(function(data) {
                return utils.getPromise(q, data);
            });
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        it("should save datavalues to dhis", function() {
            var payload = {
                dataValues: [{
                    period: '2014W15',
                    orgUnit: 'company_0',
                    dataElement: "DE1",
                    categoryOptionCombo: "COC1",
                    value: 1,
                }, {
                    period: '2014W15',
                    orgUnit: 'company_0',
                    dataElement: "DE2",
                    categoryOptionCombo: "COC2",
                    value: 2,
                }]
            };

            httpBackend.expectPOST(properties.dhis.url + "/api/dataValueSets", payload).respond(200, "ok");

            var dataService = new DataService(http, db);
            dataService.save(payload);

            httpBackend.flush();
        });


        it("should download all data for an org unit", function() {
            var dataService = new DataService(http, db, q);
            var dataValueSet = {
                "dataValues": [{
                    "dataElement": "b9634a78271",
                    "period": "2014W18",
                    "orgUnit": "c484c99b86d",
                    "categoryOptionCombo": "h48rgCOjDTg",
                    "value": "12",
                    "storedBy": "service.account",
                    "followUp": false
                }, {
                    "dataElement": "b9634a78271",
                    "period": "2014W19",
                    "orgUnit": "c484c99b86d",
                    "categoryOptionCombo": "h48rgCOjDTg",
                    "value": "13",
                    "storedBy": "service.account",
                    "followUp": false
                }]
            };
            var expectedDataSets =
                [{
                period: '2014W18',
                dataValues: [{
                    "dataElement": "b9634a78271",
                    "period": "2014W18",
                    "orgUnit": "c484c99b86d",
                    "categoryOptionCombo": "h48rgCOjDTg",
                    "value": "12",
                    "storedBy": "service.account",
                    "followUp": false
                }],
                orgUnit: 'c484c99b86d'
            }, {
                period: '2014W19',
                dataValues: [{
                    "dataElement": "b9634a78271",
                    "period": "2014W19",
                    "orgUnit": "c484c99b86d",
                    "categoryOptionCombo": "h48rgCOjDTg",
                    "value": "13",
                    "storedBy": "service.account",
                    "followUp": false
                }],
                orgUnit: 'c484c99b86d'
            }];

            var today = moment().format("YYYY-MM-DD");
            httpBackend.expectGET(properties.dhis.url + "/api/dataValueSets?children=true&dataSet=DS_OPD&dataSet=Vacc&endDate=" + today + "&orgUnit=company_0&startDate=1900-01-01").respond(200, dataValueSet);

            dataService.downloadAllData('company_0');

            httpBackend.flush();

            expect(dataValuesStore.upsert).toHaveBeenCalledWith(expectedDataSets);
        });


        it("should return a reject promise if download all data fails", function() {
            httpBackend.expectGET().respond(500, {});
            var dataService = new DataService(http, db, q);
            dataService.downloadAllData('company_0').then(undefined, function(data) {
                expect(data.message).toBeDefined();
            });

            httpBackend.flush();
        });

    });
});