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

            spyOn(dataValuesStore, "upsert").and.callFake(function() {
                return {};
            });
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        it("should save datavalues to dhis", function() {
            var dataValues = {
                "blah": "blah"
            };

            httpBackend.expectPOST(properties.dhis.url + "/api/dataValueSets", dataValues).respond(200, "ok");

            var dataService = new DataService(http, db);
            dataService.save(dataValues);

            httpBackend.flush();
        });

        it("should return a reject promise if dhis responds with an error", function() {
            var dataValues = {
                "blah": "blah"
            };

            httpBackend.expectPOST(properties.dhis.url + "/api/dataValueSets", dataValues).respond(200, {
                "status": "ERROR",
                "description": "The import process failed: Failed to flush BatchHandler",
                "dataValueCount": {
                    "imported": 0,
                    "updated": 0,
                    "ignored": 0,
                    "deleted": 0
                },
                "importCount": {
                    "imported": 0,
                    "updated": 0,
                    "ignored": 0,
                    "deleted": 0
                }
            });

            var dataService = new DataService(http, db, q);

            var onSuccess = jasmine.createSpy();
            var onError = jasmine.createSpy();

            dataService.save(dataValues).then(onSuccess, onError);

            httpBackend.flush();

            expect(onSuccess).not.toHaveBeenCalled();
            expect(onError).toHaveBeenCalled();
        });

        it("should return error message if data values were not fetched", function() {
            var dataService = new DataService(http, db, q);
            var today = moment().format("YYYY-MM-DD");
            httpBackend.expectGET(properties.dhis.url + "/api/dataValueSets?dataSet=DS_OPD&dataSet=Vacc&endDate=" + today + "&orgUnit=company_0&startDate=1900-01-01").respond(500);

            dataService.get('company_0', 'DS_OPD').then(function(response) {
                expect(response).toEqual({
                    message: 'Error fetching data from server.'
                });
            });

            httpBackend.flush();
        });

        it("should return data values fetched from DHIS", function() {
            var dataService = new DataService(http, db, q);
            var dataValueSet = {
                dataValues: [{
                    dataElement: "DE_Oedema",
                    period: "2014W15",
                    orgUnit: "company_0",
                    categoryOptionCombo: "32",
                    value: "8",
                    storedBy: "admin",
                    lastUpdated: "2014-04-17T15:30:56.172+05:30",
                    followUp: false
                }]
            };
            var today = moment().format("YYYY-MM-DD");
            httpBackend.expectGET(properties.dhis.url + "/api/dataValueSets?dataSet=DS_OPD&dataSet=Vacc&endDate=" + today + "&orgUnit=company_0&startDate=1900-01-01").respond(200, dataValueSet);

            dataService.get('company_0', 'DS_OPD').then(function(response) {
                expect(response).toEqual(dataValueSet);
            });

            httpBackend.flush();
        });

        it("should parse and save the fetched data values", function() {
            var orgUnit = "company_1";
            var dataValueSet = [{
                dataElement: "DE_Oedema",
                period: "2014W15",
                orgUnit: "company_0",
                categoryOptionCombo: "32",
                value: 8,
                followUp: false
            }];
            var dataService = new DataService(http, db, q);

            dataService.saveToDb(dataValueSet, orgUnit);

            expect(dataValuesStore.upsert).toHaveBeenCalledWith([{
                period: '2014W15',
                dataValues: dataValueSet,
                "orgUnit": orgUnit
            }]);
        });
    });
});