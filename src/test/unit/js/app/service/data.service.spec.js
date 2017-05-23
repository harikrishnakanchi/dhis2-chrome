define(["dataService", "angularMocks", "properties", "moment", "testData", "dhisUrl"], function(DataService, mocks, properties, moment, testData, dhisUrl) {
    describe("dataService", function() {
        var httpBackend, http, dataSetStore, dataValuesStore;

        beforeEach(mocks.inject(function($injector, $q) {
            q = $q;
            httpBackend = $injector.get('$httpBackend');
            http = $injector.get('$http');
            Timecop.install();
            Timecop.freeze(new Date("2014-02-18T00:00:00.000Z"));
        }));

        afterEach(function() {
            Timecop.returnToPresent();
            Timecop.uninstall();
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        it("should save datavalues to dhis", function() {
            var dataValues = [{
                "period": '2014W15',
                "orgUnit": 'company_0',
                "dataElement": "DE1",
                "categoryOptionCombo": "COC1",
                "value": "1",
            }, {
                "period": '2014W15',
                "orgUnit": 'company_0',
                "dataElement": "DE2",
                "categoryOptionCombo": "COC2",
                "value": "2",
            }];

            var expectedPayload = {
                "dataValues": dataValues
            };
            httpBackend.expectPOST(dhisUrl.dataValueSets, expectedPayload).respond(200, "ok");

            var dataService = new DataService(http);
            dataService.save(dataValues);

            httpBackend.flush();
        });


        it("should download all data for an org unit", function() {
            var dataValues = [{
                "dataElement": "b9634a78271",
                "period": "2014W8",
                "orgUnit": "c484c99b86d",
                "categoryOptionCombo": "h48rgCOjDTg",
                "value": "12",
                "storedBy": "service.account",
                "followUp": false
            }];

            var dataValuesFromDhis = {
                "dataValues": dataValues
            };

            var startDate = "2014-02-10";
            var period = "2014W08";

            httpBackend.expectGET(dhisUrl.dataValueSets + "?children=true&dataSet=DS_OPD&dataSet=Vacc&orgUnit=company_0&period=2014W08&period=2014W09").respond(200, dataValuesFromDhis);

            var actualDataValues;
            var dataService = new DataService(http, q);
            dataService.downloadData('company_0', ["DS_OPD", "Vacc"], ["2014W08", "2014W09"]).then(function(result) {
                actualDataValues = result;
            });

            httpBackend.flush();

            var expectedPayload = [{
                "dataElement": "b9634a78271",
                "period": "2014W08",
                "orgUnit": "c484c99b86d",
                "categoryOptionCombo": "h48rgCOjDTg",
                "value": "12",
                "storedBy": "service.account",
                "followUp": false
            }];
            expect(actualDataValues).toEqual(expectedPayload);
        });


    });
});
