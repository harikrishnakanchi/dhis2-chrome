define(["dataService", "angularMocks", "properties", "moment"], function(DataService, mocks, properties, moment) {
    describe("dataService", function() {
        var httpBackend, http, db;

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
            dataValuesStore = getMockStore("dataValues");

            spyOn(db, 'objectStore').and.callFake(function() {
                return dataValuesStore;
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

            var dataService = new DataService(http, db);
            dataService.save(dataValues);

            httpBackend.expectPOST(properties.dhis.url + "/api/dataValueSets", dataValues).respond(200, "ok");
            httpBackend.flush();
        });

        it("should return error message if data values were not fetched", function() {
            var dataService = new DataService(http, db);
            var today = moment().format("YYYY-MM-DD");
            httpBackend.expectGET(properties.dhis.url + "/api/dataValueSets?dataSet=DS_ATFC&endDate=" + today + "&orgUnit=company_0&startDate=1900-01-01").respond(500);

            dataService.get('company_0', 'DS_ATFC').then(function(response) {
                expect(response).toEqual({
                    message: 'Error fetching data from server.'
                });
            });

            httpBackend.flush();
        });

        it("should return data values fetched from DHIS", function() {
            var dataService = new DataService(http, db);
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
            httpBackend.expectGET(properties.dhis.url + "/api/dataValueSets?dataSet=DS_ATFC&endDate=" + today + "&orgUnit=company_0&startDate=1900-01-01").respond(200, dataValueSet);

            dataService.get('company_0', 'DS_ATFC').then(function(response) {
                expect(response).toEqual(dataValueSet);
            });

            httpBackend.flush();
        });

        it("should parse and save the fetched data values", function() {
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
            var dataService = new DataService(http, db);

            dataService.parseAndSave(dataValueSet);

            expect(dataValuesStore.upsert).toHaveBeenCalled();
        });
    });
});