define(["dataValuesMapper", "angularMocks", "properties"], function(dataValuesMapper, mocks, properties) {
    describe("dataValuesMapper", function() {
        var viewModel, period, domain, httpBackend, http;

        beforeEach(mocks.inject(function($injector, $q) {
            q = $q;
            viewModel = {
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
            period = "2014W14";
            domain = {
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
        }));

        it("should construct a valid json given the data values", function() {
            var payload = dataValuesMapper.mapToDomain(viewModel, period, "company_0");
            expect(payload).toEqual(domain);
        });

        it("should map to view given the json", function() {
            var dataValues = dataValuesMapper.mapToView(domain);
            expect(dataValues).toEqual(viewModel);
        });

    });
});