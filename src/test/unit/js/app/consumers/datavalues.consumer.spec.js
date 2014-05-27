define(["dataValuesConsumer", "dataValuesService"], function(DataValuesConsumer, DataValuesService) {
    describe("data values consumer", function() {
        var message, payload, dataValuesService, dataValuesConsumer;
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
            message.data = {
                "type": "upload",
                "data": payload
            };

            dataValuesService = new DataValuesService();
            spyOn(dataValuesService, "sync");

            dataValuesConsumer = new DataValuesConsumer(dataValuesService);
        });

        it("should save data in dhis if message type is upload", function() {
            dataValuesConsumer.run(message);
            expect(dataValuesService.sync).toHaveBeenCalledWith(message.data.data);
        });

        it("should not upload data to dhis if message type is not upload", function() {
            message.data.type = "download";
            dataValuesConsumer.run(message);
            expect(dataValuesService.sync).toHaveBeenCalledWith();
        });
    });
});