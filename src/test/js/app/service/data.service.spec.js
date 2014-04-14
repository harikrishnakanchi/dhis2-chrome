define(["dataService", "angularMocks", "properties"], function(DataService, mocks, properties) {
    var httpBackend, http;

    describe("dataService", function() {

        beforeEach(mocks.inject(function($injector, $q) {
            q = $q;
            httpBackend = $injector.get('$httpBackend');
            http = $injector.get('$http');
        }));

        it("should construct a valid json given the data values", function() {
            var dataValues = {
                "DE_Oedema": {
                    "32": "3",
                    "33": "12",
                    "34": "23",
                    "35": "11"
                },
                "DE_MLT115": {
                    "32": "49",
                    "37": "67"
                }
            };
            var period = "2014W14";
            var expectedJson = {
                "completeDate": "2014-04-11",
                "period": "2014W14",
                "orgUnit": "company_0",
                "dataValues": [{
                    "dataElement": "DE_Oedema",
                    "categoryOptionCombo": "32",
                    "value": "3"
                }, {
                    "dataElement": "DE_Oedema",
                    "categoryOptionCombo": "33",
                    "value": "12"
                }, {
                    "dataElement": "DE_Oedema",
                    "categoryOptionCombo": "34",
                    "value": "23"
                }, {
                    "dataElement": "DE_Oedema",
                    "categoryOptionCombo": "35",
                    "value": "11"
                }, {
                    "dataElement": "DE_MLT115",
                    "categoryOptionCombo": "32",
                    "value": "49"
                }, {
                    "dataElement": "DE_MLT115",
                    "categoryOptionCombo": "37",
                    "value": "67"
                }]
            };

            var dataService = new DataService(http);
            dataService.save(dataValues, period);

            httpBackend.expectPOST(properties.dhis.url + "/api/dataValueSets", expectedJson).respond(200, "ok");
            httpBackend.flush();
        });

    });
});