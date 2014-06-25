define(["consumers", "dataValuesConsumer", "orgUnitConsumer", "dispatcher", "consumerRegistry"], function(consumers, dataValuesConsumer, orgUnitConsumer, dispatcher, consumerRegistry) {
    describe("consumers", function() {
        var app;
        beforeEach(function() {
            app = {
                "service": jasmine.createSpy()
            };
        });
        it("should register consumers with angular", function() {
            consumers.init(app);
            expect(app.service).toHaveBeenCalledWith("dataValuesConsumer", ["dataService", "dataRepository", "dataSetRepository", "userPreferenceRepository", "$q", "approvalService", dataValuesConsumer]);
            expect(app.service).toHaveBeenCalledWith("orgUnitConsumer", [orgUnitConsumer]);
            expect(app.service).toHaveBeenCalledWith("dispatcher", ["$q", "dataValuesConsumer", "orgUnitConsumer", dispatcher]);
            expect(app.service).toHaveBeenCalledWith("consumerRegistry", ["$hustle", "$q", "dispatcher", consumerRegistry]);
        });
    })
})