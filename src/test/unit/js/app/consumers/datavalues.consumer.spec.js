define(["dataValuesConsumer"], function(DataValuesConsumer) {
    describe("data values consumer", function() {
        var message, payload, dataService;
        beforeEach(function() {
            message = {
                "priority": 1024,
                "age": 0,
                "reserves": 1,
                "releases": 0,
                "timeouts": 0,
                "buries": 0,
                "kicks": 0,
                "created": 1400834453569,
                "id": 4,
                "tube": "dataValues"
            };
            payload = {
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
            message["data"] = payload;
            dataService = {
                save: jasmine.createSpy()
            };
        });

        it("should save data in dhis", function() {
            dataValuesConsumer = new DataValuesConsumer(dataService);
            dataValuesConsumer.run(message);
            expect(dataService.save).toHaveBeenCalledWith(payload);
        });
    });
});