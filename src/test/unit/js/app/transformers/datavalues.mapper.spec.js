define(["dataValuesMapper", "angularMocks", "properties", "moment", "lodash"], function(dataValuesMapper, mocks, properties, moment, _) {
    describe("dataValuesMapper", function() {
        var viewModel, period, domain, httpBackend, http;

        beforeEach(mocks.inject(function($injector, $q) {
            q = $q;
            viewModel = {
                123: {
                    DE_Oedema: {
                        32: {
                            formula: '1+2',
                            value: 3
                        },
                        33: {
                            formula: '12',
                            value: 12
                        }
                    },
                    DE_MLT115: {
                        32: {
                            formula: '49',
                            value: 49
                        },
                        37: {
                            formula: '67',
                            value: 67
                        }
                    }
                }
            };
            var _Date = Date;
            var today = new _Date();
            spyOn(window, 'Date').and.returnValue(today);

            period = "2014W14";
            domain = {
                "dataValues": [{
                    "dataElement": "DE_Oedema",
                    "categoryOptionCombo": "32",
                    "period": "2014W14",
                    "orgUnit": "company_0",
                    "storedBy": "user",
                    "formula": "1+2",
                    "value": 3,
                    "lastUpdated": today.toISOString(),
                    "dataset": "123"
                }, {
                    "dataElement": "DE_Oedema",
                    "categoryOptionCombo": "33",
                    "period": "2014W14",
                    "orgUnit": "company_0",
                    "storedBy": "user",
                    "formula": "12",
                    "value": 12,
                    "lastUpdated": today.toISOString(),
                    "dataset": "123"
                }, {
                    "dataElement": "DE_MLT115",
                    "categoryOptionCombo": "32",
                    "period": "2014W14",
                    "orgUnit": "company_0",
                    "storedBy": "user",
                    "formula": "49",
                    "value": 49,
                    "lastUpdated": today.toISOString(),
                    "dataset": "123"
                }, {
                    "dataElement": "DE_MLT115",
                    "categoryOptionCombo": "37",
                    "period": "2014W14",
                    "orgUnit": "company_0",
                    "storedBy": "user",
                    "formula": "67",
                    "value": 67,
                    "lastUpdated": today.toISOString(),
                    "dataset": "123"
                }]
            };
        }));

        it("should construct a valid json filtering out empty values given the data values", function() {
            var payload = dataValuesMapper.mapToDomain(viewModel, period, "company_0", "user");
            expect(payload).toEqual(domain);
        });

        it("should map to view given the json", function() {
            var dataValues = dataValuesMapper.mapToView(domain);
            expect(dataValues).toEqual(viewModel);
        });

        it("should filter out empty values when converting view to domain", function() {
            _.merge(viewModel, {
                "123": {
                    "DE_Podimas": {
                        "33": {
                            "formula": "",
                            "value": ""
                        }
                    }
                }
            });

            var payload = dataValuesMapper.mapToDomain(viewModel, period, "company_0", "user");

            expect(payload).toEqual(domain);
        });


    });
});