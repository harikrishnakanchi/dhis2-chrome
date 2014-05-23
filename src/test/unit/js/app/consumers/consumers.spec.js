define(["consumers", "dataValuesConsumer", "registerConsumers"], function(consumers, dataValuesConsumer, registerConsumers) {
    describe("consumers", function() {
        var app;
        beforeEach(function() {
            app = {
                "service": jasmine.createSpy()
            };
        });
        it("should register consumers with angular", function() {
            consumers.init(app);
            expect(app.service).toHaveBeenCalledWith("dataValuesConsumer", ["dataService", dataValuesConsumer]);
            expect(app.service).toHaveBeenCalledWith("registerConsumers", ["$hustle", "dataValuesConsumer", registerConsumers]);
        });
    })
})