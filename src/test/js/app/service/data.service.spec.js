define(["dataService", "angularMocks", "properties"], function(DataService, mocks, properties) {
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
            var response;
            var dataService = new DataService(http, db);
            dataService.fetch('company_0', 'DS_ATFC').then(function(_response) {
                response = _response;
            });

            httpBackend.expectGET(properties.dhis.url + "/api/dataValueSets?orgUnit=company_0&dataSet=DS_ATFC&startDate=1900-01-01&endDate=2014-04-17").respond(500);
            httpBackend.flush();

            expect(response).toEqual({
                message: 'Error fetching data from server.'
            });
        });

        it("should return sucess message if sync was successful", function() {
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
                }, {
                    dataElement: "DE_Oedema",
                    period: "2014W15",
                    orgUnit: "company_0",
                    categoryOptionCombo: "33",
                    value: "9",
                    storedBy: "admin",
                    lastUpdated: "2014-04-17T15:30:56.580+05:30",
                    followUp: false
                }, {
                    dataElement: "DE_Oedema",
                    period: "2014W15",
                    orgUnit: "company_0",
                    categoryOptionCombo: "34",
                    value: "1",
                    storedBy: "admin",
                    lastUpdated: "2014-04-17T15:30:57.114+05:30",
                    followUp: false
                }]
            };
            var response;
            var dataService = new DataService(http, db);
            dataService.fetch('company_0', 'DS_ATFC').then(function(_response) {
                response = _response;
            });

            httpBackend.expectGET(properties.dhis.url + "/api/dataValueSets?orgUnit=company_0&dataSet=DS_ATFC&startDate=1900-01-01&endDate=2014-04-17").respond(200, dataValueSet);
            httpBackend.flush();

            expect(response).toEqual({
                message: 'Sync successful.'
            });
        });

    });
});