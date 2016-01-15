define(["dataValuesMapper", "angularMocks", "properties", "moment", "lodash"], function(dataValuesMapper, mocks, properties, moment, _) {
    describe("dataValuesMapper", function() {
        var viewModel, period, domain, httpBackend, http;

        beforeEach(mocks.inject(function($injector, $q) {
            q = $q;
            viewModel = {
                "mod1": {
                    "DE_Oedema": {
                        "32": {
                            "value": "3",
                            "formula": "1+2",
                            "existingValue": true
                        },
                        "33": {
                            "value": "12",
                            "formula": "12",
                            "existingValue": true
                        },
                    },
                    "DE_MLT115": {
                        "32": {
                            "value": "49",
                            "formula": "49",
                            "existingValue": true
                        },
                        "37": {
                            "value": "67",
                            "formula": "67",
                            "existingValue": true
                        }
                    }
                },
                "origin1": {
                    "NumPatients": {
                        "Number": {
                            "value": "10",
                            "formula": "10",
                            "existingValue": true
                        }
                    }
                }
            };


            period = "2014W4";
            domain = [{
                "dataElement": "DE_Oedema",
                "categoryOptionCombo": "32",
                "period": "2014W04",
                "orgUnit": "mod1",
                "storedBy": "user",
                "formula": "1+2",
                "value": "3"
            }, {
                "dataElement": "DE_Oedema",
                "categoryOptionCombo": "33",
                "period": "2014W04",
                "orgUnit": "mod1",
                "storedBy": "user",
                "formula": "12",
                "value": "12"
            }, {
                "dataElement": "DE_MLT115",
                "categoryOptionCombo": "32",
                "period": "2014W04",
                "orgUnit": "mod1",
                "storedBy": "user",
                "formula": "49",
                "value": "49"
            }, {
                "dataElement": "DE_MLT115",
                "categoryOptionCombo": "37",
                "period": "2014W04",
                "orgUnit": "mod1",
                "storedBy": "user",
                "formula": "67",
                "value": "67"
            }, {
                "dataElement": "NumPatients",
                "categoryOptionCombo": "Number",
                "period": "2014W04",
                "orgUnit": "origin1",
                "storedBy": "user",
                "formula": "10",
                "value": "10"
            }];
        }));

        it("should construct a valid json filtering out empty values given the data values", function() {
            var payload = dataValuesMapper.mapToDomain(viewModel, period, "user");
            expect(payload).toEqual(domain);
        });

        it("should map to view given the json", function() {
            var dataValues = dataValuesMapper.mapToView(domain);
            expect(dataValues).toEqual(viewModel);
        });

        it("should filter out empty values when converting view to domain", function() {
            _.merge(viewModel, {
                "mod1": {
                    "DE_Podimas": {
                        "33": {
                            "formula": "",
                            "value": "",
                        }
                    }
                }
            });
            var payload = dataValuesMapper.mapToDomain(viewModel, period, "user");

            expect(payload).toEqual(domain);
        });


    });
});
